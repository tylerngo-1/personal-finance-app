import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AccountType, AccountNature } from "@/lib/types";

export async function GET() {
  const accounts = await prisma.account.findMany({
    include: { transactions: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(accounts);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, type, nature } = body as {
    name: string;
    type: AccountType;
    nature: AccountNature;
  };

  if (!name || !type || !nature) {
    return NextResponse.json(
      { error: "name, type, and nature are required" },
      { status: 400 }
    );
  }

  const validTypes: AccountType[] = [
    "CHECKING",
    "SAVINGS",
    "CREDIT_CARD",
    "CASH",
    "INVESTMENT",
    "FUNDING",
    "INSURANCE",
  ];
  const validNatures: AccountNature[] = ["ASSET", "LIABILITY"];

  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid account type" }, { status: 400 });
  }
  if (!validNatures.includes(nature)) {
    return NextResponse.json({ error: "Invalid account nature" }, { status: 400 });
  }

  const account = await prisma.account.create({
    data: { name, type, nature },
  });
  return NextResponse.json(account, { status: 201 });
}
