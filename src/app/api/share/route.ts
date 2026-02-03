import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateShareToken } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shareLinks = await prisma.shareLink.findMany({
    where: { userId: session.user.id },
    include: { file: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ shareLinks });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { fileId, expiresIn, password, maxDownloads } = await req.json();

    // Verify file ownership
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId: session.user.id },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const token = generateShareToken();
    let expiresAt: Date | null = null;

    if (expiresIn) {
      expiresAt = new Date();
      switch (expiresIn) {
        case "1h":
          expiresAt.setHours(expiresAt.getHours() + 1);
          break;
        case "24h":
          expiresAt.setHours(expiresAt.getHours() + 24);
          break;
        case "7d":
          expiresAt.setDate(expiresAt.getDate() + 7);
          break;
        case "30d":
          expiresAt.setDate(expiresAt.getDate() + 30);
          break;
      }
    }

    const shareLink = await prisma.shareLink.create({
      data: {
        token,
        fileId,
        userId: session.user.id,
        expiresAt,
        password: password || null,
        maxDownloads: maxDownloads || null,
      },
      include: { file: { select: { name: true } } },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const shareUrl = `${baseUrl}/share/${token}`;

    return NextResponse.json({ shareLink, shareUrl });
  } catch (error) {
    console.error("Create share link error:", error);
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const linkId = searchParams.get("id");

  if (!linkId) {
    return NextResponse.json({ error: "Link ID is required" }, { status: 400 });
  }

  await prisma.shareLink.delete({
    where: {
      id: linkId,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ success: true });
}
