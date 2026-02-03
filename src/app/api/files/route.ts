import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId");

  const files = await prisma.file.findMany({
    where: {
      userId: session.user.id,
      folderId: folderId || null,
    },
    orderBy: { createdAt: "desc" },
  });

  const folders = await prisma.folder.findMany({
    where: {
      userId: session.user.id,
      parentId: folderId || null,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ files, folders });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const folderId = formData.get("folderId") as string | null;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { storageUsed: true, storageLimit: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    const newUsage = Number(user.storageUsed) + totalSize;

    if (newUsage > Number(user.storageLimit)) {
      return NextResponse.json(
        { error: "Storage limit exceeded. Upgrade to Pro for more storage." },
        { status: 400 }
      );
    }

    const uploadedFiles = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const key = `${session.user.id}/${uuidv4()}-${file.name}`;
      
      // Store file data as base64 in a simple way (for demo - in production use S3/R2)
      const base64Data = buffer.toString("base64");
      const dataUrl = `data:${file.type};base64,${base64Data}`;

      const dbFile = await prisma.file.create({
        data: {
          name: file.name,
          size: BigInt(file.size),
          mimeType: file.type,
          url: dataUrl,
          key,
          userId: session.user.id,
          folderId: folderId || null,
        },
      });

      uploadedFiles.push(dbFile);
    }

    // Update storage usage
    await prisma.user.update({
      where: { id: session.user.id },
      data: { storageUsed: BigInt(newUsage) },
    });

    return NextResponse.json({ files: uploadedFiles });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fileIds = searchParams.get("ids")?.split(",") || [];

  if (fileIds.length === 0) {
    return NextResponse.json({ error: "No files specified" }, { status: 400 });
  }

  const files = await prisma.file.findMany({
    where: {
      id: { in: fileIds },
      userId: session.user.id,
    },
  });

  const totalSize = files.reduce((acc, file) => acc + Number(file.size), 0);

  await prisma.file.deleteMany({
    where: {
      id: { in: fileIds },
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

  return NextResponse.json({ success: true, deleted: fileIds.length });
}
