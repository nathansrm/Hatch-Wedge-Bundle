import { Paddle, Environment } from "@paddle/paddle-node-sdk";

export const getPaddleClient = () => {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) {
    console.warn("PADDLE_API_KEY is not set. Paddle features will not work.");
    return null;
  }

  return new Paddle(apiKey, {
    environment:
      process.env.NODE_ENV === "production"
        ? Environment.production
        : Environment.sandbox,
  });
};
