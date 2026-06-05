import { drizzle } from "drizzle-orm/neon-http";

const databaseUrl =
  process.env.DATABASE_URL?.trim() ||
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export const db = drizzle(databaseUrl);
