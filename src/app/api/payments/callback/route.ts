import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const type = req.nextUrl.searchParams.get("type");
  const externalReference = req.nextUrl.searchParams.get("external_reference");

  if (type === "subscription") {
    if (status === "approved") {
      return NextResponse.redirect(
        new URL("/lawyer/profile?payment=success", req.url)
      );
    }
    return NextResponse.redirect(
      new URL("/lawyer/profile?payment=failure", req.url)
    );
  }

  if (status === "approved") {
    return NextResponse.redirect(
      new URL("/client/appointments?payment=success", req.url)
    );
  }

  return NextResponse.redirect(
    new URL("/client/appointments?payment=failure", req.url)
  );
}
