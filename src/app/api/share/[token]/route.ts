import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    include: {
      file: {
        select: {
          id: true,
          name: true,
          size: true,
          mimeType: true,
          url: true,
        },
      },
    },
  });

  if (!shareLink) {
    return NextResponse.json({ error: "Share link not found" }, { status: 404 });
  }

  // Check expiration
  if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
    return NextResponse.json({ error: "Share link has expired" }, { status: 410 });
  }

  // Check download limit
  if (shareLink.maxDownloads && shareLink.downloads >= shareLink.maxDownloads) {
    return NextResponse.json({ error: "Download limit reached" }, { status: 410 });
  }

  // Don't include URL if password protected (until verified)
  const hasPassword = !!shareLink.password;
  
  return NextResponse.json({
    file: {
      id: shareLink.file.id,
      name: shareLink.file.name,
      size: shareLink.file.size.toString(),
      mimeType: shareLink.file.mimeType,
      url: hasPassword ? null : shareLink.file.url,
    },
    hasPassword,
    expiresAt: shareLink.expiresAt,
    downloads: shareLink.downloads,
    maxDownloads: shareLink.maxDownloads,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { password, download } = await req.json();

  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    include: {
      file: {
        select: {
          id: true,
          name: true,
          size: true,
          mimeType: true,
          url: true,
        },
      },
    },
  });

  if (!shareLink) {
    return NextResponse.json({ error: "Share link not found" }, { status: 404 });
  }

  // Check expiration
  if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
    return NextResponse.json({ error: "Share link has expired" }, { status: 410 });
  }

  // Check download limit
  if (shareLink.maxDownloads && shareLink.downloads >= shareLink.maxDownloads) {
    return NextResponse.json({ error: "Download limit reached" }, { status: 410 });
  }

  // Check password
  if (shareLink.password && shareLink.password !== password) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  // Increment download count if downloading
  if (download) {
    await prisma.shareLink.update({
      where: { id: shareLink.id },
      data: { downloads: { increment: 1 } },
    });
  }

  return NextResponse.json({
    file: {
      id: shareLink.file.id,
      name: shareLink.file.name,
      size: shareLink.file.size.toString(),
      mimeType: shareLink.file.mimeType,
      url: shareLink.file.url,
    },
  });
}
