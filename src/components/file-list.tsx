"use client";

import { useState } from "react";
import {
  FileIcon,
  FolderIcon,
  MoreVertical,
  Download,
  Share2,
  Trash2,
  Image,
  Video,
  Music,
  FileText,
  Archive,
  Eye,
  CheckSquare,
  Square,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { formatBytes, getFileIcon } from "@/lib/utils";
import { format } from "date-fns";

interface File {
  id: string;
  name: string;
  size: string;
  mimeType: string;
  url: string;
  createdAt: string;
}

interface Folder {
  id: string;
  name: string;
  createdAt: string;
}

interface FileListProps {
  files: File[];
  folders: Folder[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  onFolderClick: (folderId: string) => void;
  onShare: (file: File) => void;
  onDelete: (ids: string[]) => void;
  onPreview: (file: File) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  image: <Image className="h-5 w-5 text-green-500" />,
  video: <Video className="h-5 w-5 text-purple-500" />,
  audio: <Music className="h-5 w-5 text-pink-500" />,
  pdf: <FileText className="h-5 w-5 text-red-500" />,
  doc: <FileText className="h-5 w-5 text-blue-500" />,
  sheet: <FileText className="h-5 w-5 text-green-600" />,
  archive: <Archive className="h-5 w-5 text-yellow-500" />,
  file: <FileIcon className="h-5 w-5 text-gray-500" />,
};

export function FileList({
  files,
  folders,
  selectedIds,
  onSelect,
  onSelectAll,
  onFolderClick,
  onShare,
  onDelete,
  onPreview,
}: FileListProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const downloadFile = (file: File) => {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allSelected =
    files.length > 0 && files.every((f) => selectedIds.includes(f.id));

  if (files.length === 0 && folders.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FolderIcon className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-2">No files or folders</p>
        <p className="text-sm">Upload files or create a folder to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between py-2 border-b">
        <div className="flex items-center gap-2">
          <button
            onClick={onSelectAll}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {allSelected ? (
              <CheckSquare className="h-4 w-4 text-blue-600" />
            ) : (
              <Square className="h-4 w-4 text-gray-400" />
            )}
          </button>
          <span className="text-sm text-gray-600">
            {selectedIds.length > 0
              ? `${selectedIds.length} selected`
              : `${files.length} files, ${folders.length} folders`}
          </span>
        </div>
        {selectedIds.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(selectedIds)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete ({selectedIds.length})
          </Button>
        )}
      </div>

      {/* Folders */}
      {folders.map((folder) => (
        <div
          key={folder.id}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
          onClick={() => onFolderClick(folder.id)}
        >
          <FolderIcon className="h-5 w-5 text-yellow-500" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{folder.name}</p>
            <p className="text-xs text-gray-500">
              {format(new Date(folder.createdAt), "MMM d, yyyy")}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete([folder.id]);
                }}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}

      {/* Files */}
      {files.map((file) => {
        const fileType = getFileIcon(file.mimeType);
        const isSelected = selectedIds.includes(file.id);
        const canPreview = file.mimeType.startsWith("image/");

        return (
          <div
            key={file.id}
            className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 ${
              isSelected ? "bg-blue-50" : ""
            }`}
          >
            <button
              onClick={() => onSelect(file.id)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isSelected ? (
                <CheckSquare className="h-4 w-4 text-blue-600" />
              ) : (
                <Square className="h-4 w-4 text-gray-400" />
              )}
            </button>
            {iconMap[fileType]}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{file.name}</p>
              <p className="text-xs text-gray-500">
                {formatBytes(BigInt(file.size))} •{" "}
                {format(new Date(file.createdAt), "MMM d, yyyy")}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canPreview && (
                  <DropdownMenuItem onClick={() => onPreview(file)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => downloadFile(file)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onShare(file)}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete([file.id])}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      })}
    </div>
  );
}
