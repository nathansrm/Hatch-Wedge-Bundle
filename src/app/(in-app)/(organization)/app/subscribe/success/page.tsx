import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  PlanProvider,
  PlanType,
  subscribeParams,
} from "@/lib/plans/getSubscribeUrl";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { redirect } from "next/navigation";
import { getStripe } from "@/lib/stripe";
import { auth } from "@/auth";
import { db } from "@/db";
import { plans } from "@/db/schema/plans";
import { eq } from "drizzle-orm";
import { getDodoClient } from "@/lib/dodopayments/client";

// Extended params for success page including sessionId
const successParams = subscribeParams.extend({
  sessionId: z.string().optional(), // STRIPE
  subscription_id: z.string().optional(), // DODO
  status: z.string().optional(), // DODO
  payment_id: z.string().optional(), // DODO
  paypalContextId: z.string().optional(), // PAYPAL
});

type SuccessParams = z.infer<typeof successParams>;

function getBillingText(type: PlanType) {
  switch (type) {
    case PlanType.MONTHLY:
      return "monthly billing";
    case PlanType.YEARLY:
      return "annual billing";
    case PlanType.ONETIME:
      return "one-time payment";
  }
}

async function getSuccessPageData(searchParams: Promise<SuccessParams>) {
  const params = await searchParams;
  const parsedParams = successParams.parse({
    ...params,
    trialPeriodDays: params.trialPeriodDays
      ? Number(params.trialPeriodDays)
      : undefined,
  });
  const { provider, codename, type, sessionId } = parsedParams;

  const plan = await db
    .select()
    .from(plans)
    .where(eq(plans.codename, codename))
    .limit(1)
    .then((res) => res[0]);

  if (!plan) {
    return redirect("/app/subscribe/error?code=PLAN_NOT_FOUND");
  }

  let successKind: "stripe" | "lemon" | "default" = "default";
  let stripeTrialEndDate: Date | undefined;
  let dodoFailure: "subscription" | "payment" | undefined;

  if (provider === PlanProvider.STRIPE) {
    successKind = "stripe";

    if (!sessionId) {
      return redirect("/app/subscribe/error?code=SESSION_NOT_FOUND");
    }

    const stripeSession = await getStripe()
      .checkout.sessions.retrieve(sessionId)
      .catch((error) => {
        console.error("Error verifying Stripe session:", error);
        redirect("/app/subscribe/error?code=SESSION_VERIFICATION_FAILED");
      });

    if (stripeSession.status !== "complete") {
      return redirect("/app/subscribe/error?code=PAYMENT_INCOMPLETE");
    }

    if (stripeSession.subscription) {
      const subscription = await getStripe()
        .subscriptions.retrieve(stripeSession.subscription as string)
        .catch((error) => {
          console.error("Error verifying Stripe subscription:", error);
          redirect("/app/subscribe/error?code=SESSION_VERIFICATION_FAILED");
        });

      if (subscription.status === "trialing" && subscription.trial_end) {
        stripeTrialEndDate = new Date(subscription.trial_end * 1000);
      }
    }
  } else if (provider === PlanProvider.LEMON_SQUEEZY) {
    successKind = "lemon";
  } else if (provider === PlanProvider.DODO) {
    const { subscription_id, payment_id } = parsedParams;

    if (subscription_id) {
      const subscription =
        await getDodoClient().subscriptions.retrieve(subscription_id);

      if (subscription.status !== "active") {
        dodoFailure = "subscription";
      }
    } else if (payment_id) {
      const payment = await getDodoClient().payments.retrieve(payment_id);

      if (payment.status !== "succeeded") {
        dodoFailure = "payment";
      }
    }
  }

  return {
    billingText: getBillingText(type),
    dodoFailure,
    plan,
    stripeTrialEndDate,
    successKind,
  };
}

export default async function SubscribeSuccessPage({
  searchParams,
}: {
  searchParams: Promise<SuccessParams>;
}) {
  // Get session and validate user is logged in
  const session = await auth();
  if (!session?.user?.email) {
    return redirect("/auth/login");
  }

  const data = await getSuccessPageData(searchParams).catch((error) => {
    console.error("Error in subscription success page:", error);
    if (error instanceof z.ZodError) {
      redirect(
        `/app/subscribe/error?code=INVALID_PARAMS&message=${encodeURIComponent(
          error.message
        )}`
      );
    }
    redirect("/app/subscribe/error");
  });

  if (data.dodoFailure) {
    return (
      <p>
        Oops! Your {data.dodoFailure} to {data.plan.name} was not successful.
        Please retry or{" "}
        <Link href="/contact" className="underline">
          contact support
        </Link>
        .
      </p>
    );
  }

  const successDetails =
    data.successKind === "stripe" ? (
      <>
        <p>Your payment was processed successfully.</p>
        {data.stripeTrialEndDate && (
          <p className="text-muted-foreground mt-1">
            Your free trial ends on {data.stripeTrialEndDate.toLocaleDateString()}.
          </p>
        )}
      </>
    ) : data.successKind === "lemon" ? (
      <p>Your subscription to {data.plan.name} was successful.</p>
    ) : null;

  return (
    <div className="container max-w-lg mx-auto py-12">
      <Card className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <h1 className="text-2xl font-bold">Subscription Successful</h1>
          <div>
            <p className="font-medium">
              You are now subscribed to the {data.plan.name} plan with{" "}
              {data.billingText}.
            </p>
            <p className="text-muted-foreground">
              Please note that in some cases it can take around upto 5 minutes
              for the subscription to be activated.
            </p>
            {successDetails}
          </div>

          <div className="flex flex-row gap-2 items-center mt-8">
            <Button asChild>
              <Link href="/app/billing">Go to Billing</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/app">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
