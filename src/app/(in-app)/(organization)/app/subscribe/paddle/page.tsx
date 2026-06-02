import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { PaddleCheckoutClient } from "./paddle-checkout-client";

function PaddleCheckoutShimmer() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading checkout...</p>
      </div>
    </div>
  );
}

export default function PaddleCheckoutPage() {
  return (
    <Suspense fallback={<PaddleCheckoutShimmer />}>
      <PaddleCheckoutClient />
    </Suspense>
  );
}
