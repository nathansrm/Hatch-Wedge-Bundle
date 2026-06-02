"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function UnreadMessagesBell() {
  const { data } = useSWR<{ data: number }>(
    "/api/super-admin/stats/unread-messages"
  );

  if (!data || data.data === 0) return null;

  return (
    <Link href="/super-admin/messages">
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        <Badge
          variant="destructive"
          className="absolute -right-2 -top-2 flex h-4 min-w-[1rem] items-center justify-center p-0 text-[10px]"
        >
          {data.data}
        </Badge>
        <span className="sr-only">View unread contact messages</span>
      </Button>
    </Link>
  );
}
