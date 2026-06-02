"use client";

import { Loader2 } from "lucide-react";
import { Paddle, initializePaddle } from "@paddle/paddle-js";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import useUser from "@/lib/users/useUser";
import useOrganization from "@/lib/organizations/useOrganization";

export function PaddleCheckoutClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [paddle, setPaddle] = useState<Paddle | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [showRetry, setShowRetry] = useState(false);
  const { user } = useUser();
  const { organization } = useOrganization();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowRetry(true);
    }, 3000);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  const openCheckout = useCallback(() => {
    if (!paddle) return;
    const transactionId =
      searchParams.get("transactionId") || searchParams.get("_ptxn");

    if (transactionId) {
      paddle.Checkout.open({
        transactionId,
        settings: {
          displayMode: "overlay",
          theme: "light",
          locale: "en",
          allowLogout: false,
          showAddDiscounts: true,
          showAddTaxId: true,
          successUrl: `${window.location.origin}/app/subscribe/success?provider=paddle&transactionId=${transactionId}`,
        },
        customer: organization?.paddleCustomerId
          ? { id: organization.paddleCustomerId }
          : user?.email
            ? { email: user.email }
            : undefined,
      });
    }
  }, [paddle, user, organization, searchParams]);

  useEffect(() => {
    const initPaddle = async () => {
      try {
        if (
          process.env.NEXT_PUBLIC_PADDLE_ENV !== "production" &&
          process.env.NEXT_PUBLIC_PADDLE_ENV !== "sandbox"
        ) {
          console.warn(
            "NEXT_PUBLIC_PADDLE_ENV is not set to 'production' or 'sandbox'. Defaulting to 'sandbox'."
          );
        }

        const paddleInstance = await initializePaddle({
          environment:
            process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
              ? "production"
              : "sandbox",
          token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
          eventCallback: (event) => {
            if (event.name === "checkout.closed") {
              setTimeout(() => {
                openCheckout();
              }, 1000);
            }
          },
        });
        setPaddle(paddleInstance);
      } catch (err) {
        console.error("Failed to initialize Paddle:", err);
        setError("Failed to load payment system.");
      }
    };

    if (!paddle) {
      void initPaddle();
    }

    return () => {
      if (paddle) {
        paddle.Checkout.close();
        setPaddle(undefined);
      }
    };
  }, [paddle, openCheckout]);

  useEffect(() => {
    if (!paddle) return;
    const transactionId =
      searchParams.get("transactionId") || searchParams.get("_ptxn");

    if (transactionId) {
      openCheckout();
    } else {
      const t = setTimeout(() => setError("Transaction ID is missing."), 1000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [paddle, searchParams, openCheckout]);

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error}</p>
        <button
          type="button"
          onClick={() => router.push("/app")}
          className="text-sm underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Opening secure checkout...</p>
        {showRetry ? (
          <button
            type="button"
            onClick={() => openCheckout()}
            className="cursor-pointer text-sm underline"
          >
            Click here if checkout doesn&apos;t open
          </button>
        ) : null}
      </div>
    </div>
  );
}
