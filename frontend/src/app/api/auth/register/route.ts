import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Endpoint deprecated. Balancio uses Clerk for authentication." },
    { status: 410 }
  );
}
