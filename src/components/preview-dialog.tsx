"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface File {
  id: string;
  name: string;
  mimeType: string;
  url: string;
}

interface PreviewDialogProps {
  file: File | null;
  open: boolean;
  onClose: () => void;
}

export function PreviewDialog({ file, open, onClose }: PreviewDialogProps) {
  if (!file) return null;

  const isImage = file.mimeType.startsWith("image/");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="truncate">{file.name}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center min-h-[300px] bg-gray-100 rounded-lg overflow-hidden">
          {isImage ? (
            <img
              src={file.url}
              alt={file.name}
              className="max-w-full max-h-[60vh] object-contain"
            />
          ) : (
            <p className="text-gray-500">Preview not available for this file type</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
