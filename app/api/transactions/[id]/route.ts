import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { note } = body as { note: string };

  const transaction = await prisma.transaction.update({
    where: { id },
    data: { note: note || null },
    include: { account: true, category: true },
  });
  return NextResponse.json(transaction);
}
