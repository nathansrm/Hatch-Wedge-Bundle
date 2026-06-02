"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UnreadMessagesBell } from "@/components/UnreadMessagesBell";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import useSWR from "swr";
import { format, parseISO } from "date-fns";

interface SignupStat {
  date: string;
  count: number;
}

interface PlanStat {
  id: string;
  name: string;
  count: number;
}

interface DailyStatRow {
  date: string;
  users: number;
  organizations: number;
  waitlist: number;
}

export default function SuperAdminDashboard() {
  const { data: signupStats, isLoading: isLoadingSignups } = useSWR<
    SignupStat[]
  >("/api/super-admin/stats/signups");

  const { data: planStats, isLoading: isLoadingPlans } =
    useSWR<PlanStat[]>("/api/super-admin/stats/plans");

  const { data: dailyWrapper, isLoading: isDailyLoading } = useSWR<{
    data: DailyStatRow[];
  }>("/api/super-admin/stats/daily");

  const signupChartData = signupStats?.map((stat) => ({
    date: format(new Date(stat.date), "MMM d"),
    signups: stat.count,
  }));

  const dailySeries = dailyWrapper?.data ?? [];

  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-row items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your application&apos;s performance
          </p>
        </div>
        <UnreadMessagesBell />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity (Last 31 Days)</CardTitle>
          <CardDescription>
            User signups, new organizations, and waitlist submissions
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[350px]">
          {isDailyLoading ? (
            <div className="bg-muted h-full w-full animate-pulse rounded" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailySeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(d: string) => format(parseISO(d), "MMM d")}
                  interval="preserveStartEnd"
                  tickMargin={10}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  allowDecimals={false}
                  domain={[0, "auto"]}
                  tickMargin={10}
                />
                <Tooltip
                  labelFormatter={(value: string) =>
                    format(parseISO(value), "MMM d, yyyy")
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="users"
                  name="New Users"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="organizations"
                  name="New Organizations"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="waitlist"
                  name="Waitlist"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoadingPlans ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <CardTitle className="bg-muted h-4 w-24 rounded" />
              </CardHeader>
              <CardContent>
                <div className="bg-muted h-8 w-12 rounded" />
              </CardContent>
            </Card>
          ))
        ) : (
          planStats?.map((stat) => (
            <Card key={stat.id}>
              <CardHeader className="space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.count}</div>
                <p className="text-muted-foreground text-xs">
                  Total Organizations
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Signups</CardTitle>
          <CardDescription>
            Daily user registration activity over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            {isLoadingSignups ? (
              <div className="bg-muted h-full w-full animate-pulse rounded" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={signupChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickMargin={10}
                    allowDecimals={false}
                    domain={[0, "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                    labelStyle={{
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="signups"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
