import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId") ?? undefined;
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const type = searchParams.get("type") as TransactionType | null;
  const search = searchParams.get("search") ?? undefined;
  const sort = searchParams.get("sort") ?? "date_desc";

  const orderBy = (() => {
    switch (sort) {
      case "date_asc":
        return { createdAt: "asc" as const };
      case "amount_asc":
        return { amount: "asc" as const };
      case "amount_desc":
        return { amount: "desc" as const };
      default:
        return { createdAt: "desc" as const };
    }
  })();

  const transactions = await prisma.transaction.findMany({
    where: {
      ...(accountId && { accountId }),
      ...(categoryId && { categoryId }),
      ...(type && { type }),
      ...(search && {
        description: { contains: search, mode: "insensitive" as const },
      }),
    },
    orderBy,
    include: { account: true, category: true },
  });

  return NextResponse.json(transactions);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { accountId, amount, type, description, categoryId } = body as {
    accountId: string;
    amount: string | number;
    type: TransactionType;
    description: string;
    categoryId: string;
  };

  if (!accountId || !amount || !type || !description || !categoryId) {
    return NextResponse.json(
      { error: "accountId, amount, type, description, and categoryId are required" },
      { status: 400 }
    );
  }

  const validTypes: TransactionType[] = ["INCOME", "EXPENSE"];
  if (!validTypes.includes(type)) {
    return NextResponse.json(
      { error: "type must be INCOME or EXPENSE" },
      { status: 400 }
    );
  }

  const transaction = await prisma.transaction.create({
    data: {
      accountId,
      amount: parseFloat(String(amount)),
      type,
      description,
      categoryId,
    },
    include: { account: true, category: true },
  });
  return NextResponse.json(transaction, { status: 201 });
}
