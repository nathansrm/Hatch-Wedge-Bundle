import { db } from "@/db";
import { organizations } from "@/db/schema/organization";
import { eq } from "drizzle-orm";
import type { Polar } from "@polar-sh/sdk";
import { ResourceNotFound } from "@polar-sh/sdk/models/errors/resourcenotfound";

type OrgRow = typeof organizations.$inferSelect;

/**
 * Ensures a Polar customer exists for the organization; persists `polarCustomerId`.
 * Polar `externalId` is the organization id for webhook resolution.
 */
export async function ensurePolarCustomerIdForOrganization(params: {
  polar: Polar;
  organization: Pick<
    OrgRow,
    "id" | "name" | "polarCustomerId"
  >;
  billingEmail: string;
}): Promise<string> {
  const { polar, organization, billingEmail } = params;
  if (!billingEmail) {
    throw new Error("billingEmail is required for Polar customer");
  }

  if (organization.polarCustomerId) {
    try {
      await polar.customers.get({ id: organization.polarCustomerId });
      return organization.polarCustomerId;
    } catch (e) {
      if (!(e instanceof ResourceNotFound)) {
        throw e;
      }
    }
  }

  try {
    const existing = await polar.customers.getExternal({
      externalId: organization.id,
    });
    if (existing.id !== organization.polarCustomerId) {
      await db
        .update(organizations)
        .set({ polarCustomerId: existing.id })
        .where(eq(organizations.id, organization.id));
    }
    return existing.id;
  } catch (e) {
    if (!(e instanceof ResourceNotFound)) {
      throw e;
    }
  }

  const created = await polar.customers.create({
    email: billingEmail,
    externalId: organization.id,
    name: organization.name ?? undefined,
    type: "team",
  });

  await db
    .update(organizations)
    .set({ polarCustomerId: created.id })
    .where(eq(organizations.id, organization.id));

  return created.id;
}
