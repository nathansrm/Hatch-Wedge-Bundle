import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const GET = (req: NextRequest) => {
  return NextResponse.json({
    ok: true,
    message: "Public API stub.",
    hint: req.nextUrl.pathname,
  });
};
