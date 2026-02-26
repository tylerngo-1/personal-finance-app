import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const accounts = await prisma.account.findMany({
    include: { transactions: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(accounts);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, type } = body;

  if (!name || !type) {
    return NextResponse.json(
      { error: "name and type are required" },
      { status: 400 }
    );
  }

  const account = await prisma.account.create({
    data: { name, type },
  });
  return NextResponse.json(account, { status: 201 });
}
