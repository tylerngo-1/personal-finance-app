import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@/lib/types";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, type } = body as { name: string; type: TransactionType };

  if (!name || !type) {
    return NextResponse.json(
      { error: "name and type are required" },
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

  const category = await prisma.category.create({
    data: { name, type },
  });
  return NextResponse.json(category, { status: 201 });
}
