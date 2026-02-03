"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Cloud,
  Plus,
  FolderPlus,
  ChevronRight,
  Home,
  LogOut,
  Loader2,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";
import { FileList } from "@/components/file-list";
import { ShareDialog } from "@/components/share-dialog";
import { PreviewDialog } from "@/components/preview-dialog";
import { StorageUsage } from "@/components/storage-usage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  parentId: string | null;
  createdAt: string;
}

interface UserData {
  id: string;
  email: string;
  name: string;
  storageUsed: string;
  storageLimit: string;
  isPro: boolean;
}

interface Breadcrumb {
  id: string | null;
  name: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [files, setFiles] = useState<File[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([
    { id: null, name: "My Files" },
  ]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Dialogs
  const [uploadOpen, setUploadOpen] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [shareFile, setShareFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [filesRes, userRes] = await Promise.all([
        fetch(`/api/files${currentFolderId ? `?folderId=${currentFolderId}` : ""}`),
        fetch("/api/user"),
      ]);

      if (filesRes.ok) {
        const data = await filesRes.json();
        setFiles(data.files);
        setFolders(data.folders);
      }

      if (userRes.ok) {
        const data = await userRes.json();
        setUserData(data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [currentFolderId]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session, fetchData]);

  // Handle success/cancel from Stripe
  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    if (success) {
      // Refresh user data to get updated subscription
      fetchData();
    }
  }, [searchParams, fetchData]);

  const handleFolderClick = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    if (folder) {
      setCurrentFolderId(folderId);
      setBreadcrumbs((prev) => [...prev, { id: folderId, name: folder.name }]);
      setSelectedIds([]);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    const crumb = breadcrumbs[index];
    setCurrentFolderId(crumb.id);
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
    setSelectedIds([]);
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName,
          parentId: currentFolderId,
        }),
      });

      if (response.ok) {
        setNewFolderOpen(false);
        setNewFolderName("");
        fetchData();
      }
    } catch (error) {
      console.error("Create folder error:", error);
    }
  };

  const handleDelete = async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} item(s)?`)) return;

    try {
      // Check if any are folders
      const folderIds = ids.filter((id) => folders.some((f) => f.id === id));
      const fileIds = ids.filter((id) => files.some((f) => f.id === id));

      // Delete folders
      for (const folderId of folderIds) {
        await fetch(`/api/folders?id=${folderId}`, { method: "DELETE" });
      }

      // Delete files
      if (fileIds.length > 0) {
        await fetch(`/api/files?ids=${fileIds.join(",")}`, { method: "DELETE" });
      }

      setSelectedIds([]);
      fetchData();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === files.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(files.map((f) => f.id));
    }
  };

  const handleUpgrade = async () => {
    try {
      const response = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Upgrade error:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Cloud className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold">Craig-O-Storage</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/links"
                className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <LinkIcon className="h-4 w-4" />
                Share Links
              </Link>
              <span className="text-sm text-gray-600">{session?.user?.email}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Button onClick={() => setUploadOpen(true)} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Upload Files
            </Button>
            <Button
              variant="outline"
              onClick={() => setNewFolderOpen(true)}
              className="w-full"
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </Button>

            {userData && (
              <StorageUsage
                used={BigInt(userData.storageUsed)}
                limit={BigInt(userData.storageLimit)}
                isPro={userData.isPro}
                onUpgrade={handleUpgrade}
              />
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 mb-4 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.id || "root"} className="flex items-center gap-2">
                  {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
                  <button
                    onClick={() => handleBreadcrumbClick(index)}
                    className={`flex items-center gap-1 hover:text-blue-600 ${
                      index === breadcrumbs.length - 1
                        ? "font-medium text-gray-900"
                        : "text-gray-500"
                    }`}
                  >
                    {index === 0 && <Home className="h-4 w-4" />}
                    {crumb.name}
                  </button>
                </div>
              ))}
            </div>

            {/* File List */}
            <div className="bg-white rounded-lg border p-4">
              <FileList
                files={files}
                folders={folders}
                selectedIds={selectedIds}
                onSelect={handleSelect}
                onSelectAll={handleSelectAll}
                onFolderClick={handleFolderClick}
                onShare={setShareFile}
                onDelete={handleDelete}
                onPreview={setPreviewFile}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
          </DialogHeader>
          <FileUpload
            folderId={currentFolderId}
            onUploadComplete={() => {
              setUploadOpen(false);
              fetchData();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <Button onClick={createFolder} className="w-full">
              Create Folder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <ShareDialog
        file={shareFile}
        open={!!shareFile}
        onClose={() => setShareFile(null)}
      />

      {/* Preview Dialog */}
      <PreviewDialog
        file={previewFile}
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
}
