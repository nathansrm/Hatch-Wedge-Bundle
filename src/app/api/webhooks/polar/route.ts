import { NextRequest, NextResponse } from "next/server";
import {
  validateEvent,
  WebhookVerificationError,
} from "@polar-sh/sdk/webhooks";
import type { Order } from "@polar-sh/sdk/models/components/order";
import type { Subscription } from "@polar-sh/sdk/models/components/subscription";
import APIError from "@/lib/api/errors";
import { organizations } from "@/db/schema/organization";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import updatePlan from "@/lib/plans/updatePlan";
import downgradeToDefaultPlan from "@/lib/plans/downgradeToDefaultPlan";
import { addCredits } from "@/lib/credits/recalculate";
import { type CreditType } from "@/lib/credits/credits";
import { creditTypeSchema } from "@/lib/credits/config";
import { allocatePlanCredits } from "@/lib/credits/allocatePlanCredits";
import { getPlanFromPolarProductId } from "@/lib/plans/getPlanFromPolarProductId";
import getOrCreateOrganizationByPolarCustomer from "@/lib/organizations/getOrCreateOrganizationByPolarCustomer";

function metaString(
  v: string | number | boolean | null | undefined
): string | undefined {
  if (v === null || v === undefined) return undefined;
  return String(v);
}

async function resolveOrganizationFromPolarCustomer(customer: {
  externalId?: string | null;
  email?: string | null;
  name?: string | null;
  id?: string;
}) {
  if (customer.externalId) {
    const row = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, customer.externalId))
      .limit(1);
    if (row[0]) {
      return row[0];
    }
  }

  const polarCustomerId = customer.id;
  if (polarCustomerId) {
    const byPolar = await db
      .select()
      .from(organizations)
      .where(eq(organizations.polarCustomerId, polarCustomerId))
      .limit(1);
    if (byPolar[0]) {
      return byPolar[0];
    }
  }

  if (customer.email && polarCustomerId) {
    const { organization } = await getOrCreateOrganizationByPolarCustomer({
      polarCustomerId,
      customerEmail: customer.email,
      customerName: customer.name ?? null,
    });
    return organization;
  }

  return null;
}

async function syncPolarSubscription(organizationId: string, sub: Subscription) {
  const dbPlan = await getPlanFromPolarProductId(sub.productId ?? null);
  if (!dbPlan) {
    console.warn(
      "Polar: no local plan for product",
      sub.productId,
      "subscription",
      sub.id
    );
    return;
  }

  await db
    .update(organizations)
    .set({
      polarSubscriptionId: sub.id,
      polarCustomerId: sub.customer.id,
    })
    .where(eq(organizations.id, organizationId));

  await updatePlan({ organizationId, newPlanId: dbPlan.id });

  await allocatePlanCredits({
    organizationId,
    planId: dbPlan.id,
    paymentId: sub.id,
    paymentMetadata: {
      source: "polar_subscription",
      subscriptionId: sub.id,
      productId: sub.productId,
    },
  });
}

class PolarWebhookHandler {
  async handleCreditsPurchase(order: Order) {
    const metadata = order.metadata;
    if (!metadata || metaString(metadata.type) !== "credits_purchase") {
      return false;
    }

    const creditType = metaString(metadata.creditType);
    const amountRaw = metaString(metadata.amount);
    const organizationId = metaString(metadata.organizationId);

    if (!creditType || !amountRaw || !organizationId) {
      throw new APIError("Invalid credits purchase metadata");
    }

    const parsedCreditType = creditTypeSchema.safeParse(creditType);
    if (!parsedCreditType.success) {
      throw new APIError(`Invalid credit type: ${creditType}`);
    }

    const creditAmount = parseInt(amountRaw, 10);
    if (Number.isNaN(creditAmount) || creditAmount <= 0) {
      throw new APIError(`Invalid credit amount: ${amountRaw}`);
    }

    const organization = await resolveOrganizationFromPolarCustomer(
      order.customer
    );

    if (!organization || organization.id !== organizationId) {
      throw new APIError(
        "Organization ID mismatch in Polar credits purchase metadata"
      );
    }

    try {
      const paymentId = `polar_order_${order.id}`;
      await addCredits(
        organization.id,
        parsedCreditType.data as CreditType,
        creditAmount,
        paymentId,
        {
          reason: "Purchase via Polar",
          polarOrderId: order.id,
          amountPaid: order.totalAmount,
          currency: order.currency,
        }
      );
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes("already exists")) {
        return true;
      }
      throw new APIError(
        `Failed to add credits: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async onOrderPaid(order: Order) {
    if (await this.handleCreditsPurchase(order)) {
      return;
    }

    if (order.billingReason !== "purchase") {
      return;
    }

    const productId = order.productId ?? null;
    const dbPlan = await getPlanFromPolarProductId(productId);
    if (!dbPlan) {
      console.log(
        "Polar order.paid: no plan for product",
        productId,
        "— skipping"
      );
      return;
    }

    const organization = await resolveOrganizationFromPolarCustomer(
      order.customer
    );
    if (!organization) {
      throw new APIError("Could not resolve organization for Polar order");
    }

    await db
      .update(organizations)
      .set({ polarCustomerId: order.customer.id })
      .where(eq(organizations.id, organization.id));

    await updatePlan({ organizationId: organization.id, newPlanId: dbPlan.id });

    await allocatePlanCredits({
      organizationId: organization.id,
      planId: dbPlan.id,
      paymentId: `polar_order_${order.id}`,
      paymentMetadata: {
        source: "polar_order",
        orderId: order.id,
        productId: productId ?? undefined,
      },
    });
  }

  async onSubscriptionActive(sub: Subscription) {
    const organization = await resolveOrganizationFromPolarCustomer(
      sub.customer
    );
    if (!organization) {
      throw new APIError(
        "Could not resolve organization for Polar subscription"
      );
    }
    await syncPolarSubscription(organization.id, sub);
  }

  async onSubscriptionCreated(sub: Subscription) {
    const organization = await resolveOrganizationFromPolarCustomer(
      sub.customer
    );
    if (!organization) {
      return;
    }
    await db
      .update(organizations)
      .set({
        polarSubscriptionId: sub.id,
        polarCustomerId: sub.customer.id,
      })
      .where(eq(organizations.id, organization.id));
  }

  async onSubscriptionUpdated(sub: Subscription) {
    let organizationIdFromRow: string | undefined;
    const row = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.polarSubscriptionId, sub.id))
      .limit(1);

    if (row[0]) {
      organizationIdFromRow = row[0].id;
    } else {
      const organization = await resolveOrganizationFromPolarCustomer(
        sub.customer
      );
      if (!organization) {
        return;
      }
      organizationIdFromRow = organization.id;
      await db
        .update(organizations)
        .set({
          polarSubscriptionId: sub.id,
          polarCustomerId: sub.customer.id,
        })
        .where(eq(organizations.id, organizationIdFromRow));
    }

    const isActive = sub.status === "active" || sub.status === "trialing";

    if (!isActive && organizationIdFromRow) {
      await downgradeToDefaultPlan({
        organizationId: organizationIdFromRow,
      });
      return;
    }

    if (organizationIdFromRow) {
      await syncPolarSubscription(organizationIdFromRow, sub);
    }
  }

  async onSubscriptionCanceled(sub: Subscription) {
    if (sub.cancelAtPeriodEnd) {
      return;
    }
    const row = await db
      .select()
      .from(organizations)
      .where(eq(organizations.polarSubscriptionId, sub.id))
      .limit(1);
    if (!row[0]) {
      return;
    }
    await downgradeToDefaultPlan({ organizationId: row[0].id });
  }

  async onSubscriptionRevoked(sub: Subscription) {
    const row = await db
      .select()
      .from(organizations)
      .where(eq(organizations.polarSubscriptionId, sub.id))
      .limit(1);
    if (!row[0]) {
      return;
    }
    await downgradeToDefaultPlan({ organizationId: row[0].id });
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Polar webhook not configured" },
      { status: 500 }
    );
  }

  const body = await req.text();
  const headers = Object.fromEntries(req.headers.entries());

  let event: ReturnType<typeof validateEvent>;
  try {
    event = validateEvent(body, headers, secret);
  } catch (e) {
    if (e instanceof WebhookVerificationError) {
      return new NextResponse(null, { status: 403 });
    }
    throw e;
  }

  const handler = new PolarWebhookHandler();

  try {
    switch (event.type) {
      case "order.paid":
        await handler.onOrderPaid(event.data);
        break;
      case "subscription.created":
        await handler.onSubscriptionCreated(event.data);
        break;
      case "subscription.active":
        await handler.onSubscriptionActive(event.data);
        break;
      case "subscription.updated":
        await handler.onSubscriptionUpdated(event.data);
        break;
      case "subscription.canceled":
        await handler.onSubscriptionCanceled(event.data);
        break;
      case "subscription.revoked":
        await handler.onSubscriptionRevoked(event.data);
        break;
      default:
        break;
    }
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json({ received: true, message: error.message });
    }
    throw error;
  }

  return new NextResponse(null, { status: 202 });
}

export const maxDuration = 20;
