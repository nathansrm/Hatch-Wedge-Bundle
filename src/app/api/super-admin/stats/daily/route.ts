import { NextResponse } from "next/server";
import withSuperAdminAuthRequired from "@/lib/auth/withSuperAdminAuthRequired";
import { db } from "@/db";
import { users } from "@/db/schema/user";
import { organizations } from "@/db/schema/organization";
import { waitlist } from "@/db/schema/waitlist";
import { sql } from "drizzle-orm";
import { format, subDays, startOfDay } from "date-fns";

export const GET = withSuperAdminAuthRequired(async () => {
  const thirtyDaysAgo = startOfDay(subDays(new Date(), 30));

  const userSignups = await db
    .select({
      date: sql<string>`DATE(${users.createdAt})::text`,
      count: sql<number>`COUNT(*)`,
    })
    .from(users)
    .where(sql`${users.createdAt} >= ${thirtyDaysAgo}`)
    .groupBy(sql`DATE(${users.createdAt})`)
    .orderBy(sql`DATE(${users.createdAt})`);

  const organizationCreations = await db
    .select({
      date: sql<string>`DATE(${organizations.createdAt})::text`,
      count: sql<number>`COUNT(*)`,
    })
    .from(organizations)
    .where(sql`${organizations.createdAt} >= ${thirtyDaysAgo}`)
    .groupBy(sql`DATE(${organizations.createdAt})`)
    .orderBy(sql`DATE(${organizations.createdAt})`);

  const waitlistEntries = await db
    .select({
      date: sql<string>`DATE(${waitlist.createdAt})::text`,
      count: sql<number>`COUNT(*)`,
    })
    .from(waitlist)
    .where(sql`${waitlist.createdAt} >= ${thirtyDaysAgo}`)
    .groupBy(sql`DATE(${waitlist.createdAt})`)
    .orderBy(sql`DATE(${waitlist.createdAt})`);

  const dates = Array.from({ length: 31 }, (_, i) => {
    const date = format(subDays(new Date(), i), "yyyy-MM-dd");
    return {
      date,
      users: 0,
      organizations: 0,
      waitlist: 0,
    };
  }).reverse();

  userSignups.forEach((signup) => {
    const day = dates.find((d) => d.date === signup.date);
    if (day) day.users = Number(signup.count);
  });

  organizationCreations.forEach((entry) => {
    const day = dates.find((d) => d.date === entry.date);
    if (day) day.organizations = Number(entry.count);
  });

  waitlistEntries.forEach((entry) => {
    const day = dates.find((d) => d.date === entry.date);
    if (day) day.waitlist = Number(entry.count);
  });

  return NextResponse.json({ data: dates });
});
