import { getPaddleClient } from "./client";

type PaddleOrgBuyer = {
  organizationId: string;
  purchaserUserId: string;
  paddleCustomerId?: string | null;
};

export const createPaddleCheckout = async ({
  organization,
  priceId,
}: {
  organization: PaddleOrgBuyer;
  priceId: string;
}) => {
  const paddle = getPaddleClient();
  if (!paddle) {
    throw new Error("Paddle client not initialized");
  }

  try {
    const transaction = await paddle.transactions.create({
      items: [{ priceId, quantity: 1 }],
      customerId: organization.paddleCustomerId ?? undefined,
      customData: {
        organizationId: organization.organizationId,
        purchaserUserId: organization.purchaserUserId,
      },
    });

    if (!transaction.checkout?.url) {
      throw new Error("Paddle transaction created but no checkout URL found");
    }

    return {
      url: transaction.checkout.url,
      transactionId: transaction.id,
    };
  } catch (error) {
    console.error("Error creating Paddle transaction:", error);
    throw error;
  }
};

export const createPaddleCreditCheckout = async ({
  organization,
  productId,
  creditAmount,
  creditType,
  totalPrice,
}: {
  organization: PaddleOrgBuyer;
  productId: string;
  creditAmount: number;
  creditType: string;
  totalPrice: number;
}) => {
  const paddle = getPaddleClient();
  if (!paddle) {
    throw new Error("Paddle client not initialized");
  }

  try {
    const transaction = await paddle.transactions.create({
      items: [
        {
          price: {
            description: `${creditAmount} ${creditType} Credits`,
            productId,
            unitPrice: {
              amount: Math.round(totalPrice * 100).toString(),
              currencyCode: "USD",
            },
            quantity: {
              minimum: 1,
              maximum: 1,
            },
          },
          quantity: 1,
        },
      ],
      customerId: organization.paddleCustomerId ?? undefined,
      customData: {
        organizationId: organization.organizationId,
        purchaserUserId: organization.purchaserUserId,
        purchaseType: "credits",
        creditType,
        creditAmount: creditAmount.toString(),
      },
      collectionMode: "automatic",
    });

    if (!transaction.checkout?.url) {
      throw new Error("Paddle transaction created but no checkout URL found");
    }

    return {
      url: transaction.checkout.url,
      transactionId: transaction.id,
    };
  } catch (error) {
    console.error("Error creating Paddle credit transaction:", error);
    throw error;
  }
};

export const createPaddleCustomerPortalSession = async (customerId: string) => {
  const paddle = getPaddleClient();
  if (!paddle) {
    throw new Error("Paddle client not initialized");
  }

  try {
    const session = await paddle.customerPortalSessions.create(customerId, []);
    return session;
  } catch (error) {
    console.error("Error creating Paddle customer portal session:", error);
    throw error;
  }
};
