import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const setting = await prisma.setting.findUnique({ where: { key: "currency" } });
  return NextResponse.json({ currency: setting?.value ?? "USD" });
}

export async function PUT(req: Request) {
  const { currency } = await req.json();
  if (!currency || typeof currency !== "string") {
    return NextResponse.json({ error: "Invalid currency" }, { status: 400 });
  }
  const setting = await prisma.setting.upsert({
    where: { key: "currency" },
    update: { value: currency },
    create: { key: "currency", value: currency },
  });
  return NextResponse.json({ currency: setting.value });
}
