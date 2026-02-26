import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AccountType, AccountNature } from "@/lib/types";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, type, nature } = body as {
    name?: string;
    type?: AccountType;
    nature?: AccountNature;
  };

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

  if (type && !validTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid account type" }, { status: 400 });
  }
  if (nature && !validNatures.includes(nature)) {
    return NextResponse.json({ error: "Invalid account nature" }, { status: 400 });
  }

  const account = await prisma.account.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(type && { type }),
      ...(nature && { nature }),
    },
  });
  return NextResponse.json(account);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.account.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
