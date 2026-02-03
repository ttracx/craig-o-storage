import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, parentId } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        userId: session.user.id,
        parentId: parentId || null,
      },
    });

    return NextResponse.json({ folder });
  } catch (error) {
    console.error("Create folder error:", error);
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("id");

  if (!folderId) {
    return NextResponse.json({ error: "Folder ID is required" }, { status: 400 });
  }

  // Get all files in folder to update storage
  const files = await prisma.file.findMany({
    where: {
      folderId,
      userId: session.user.id,
    },
  });

  const totalSize = files.reduce((acc, file) => acc + Number(file.size), 0);

  await prisma.folder.delete({
    where: {
      id: folderId,
      userId: session.user.id,
    },
  });

  // Update storage usage
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { storageUsed: true },
  });

  if (user) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { storageUsed: BigInt(Math.max(0, Number(user.storageUsed) - totalSize)) },
    });
  }

  return NextResponse.json({ success: true });
}
