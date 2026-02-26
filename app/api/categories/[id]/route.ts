import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@/lib/types";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name, type } = body as { name?: string; type?: TransactionType };

  const validTypes: TransactionType[] = ["INCOME", "EXPENSE"];
  if (type && !validTypes.includes(type)) {
    return NextResponse.json(
      { error: "type must be INCOME or EXPENSE" },
      { status: 400 }
    );
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(type && { type }),
    },
  });
  return NextResponse.json(category);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
