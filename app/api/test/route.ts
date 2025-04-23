import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ hello: "world" });
}

export async function POST() {
  console.log("POST to /api/test received");
  return NextResponse.json({ received: true });
}
