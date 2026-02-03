"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Cloud, Download, Lock, AlertTriangle, Loader2, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";
import Link from "next/link";

interface SharedFile {
  id: string;
  name: string;
  size: string;
  mimeType: string;
  url: string | null;
}

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;

  const [file, setFile] = useState<SharedFile | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchFileInfo();
  }, [token]);

  const fetchFileInfo = async () => {
    try {
      const response = await fetch(`/api/share/${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
      } else {
        setFile(data.file);
        setHasPassword(data.hasPassword);
      }
    } catch (err) {
      setError("Failed to load file information");
    } finally {
      setLoading(false);
    }
  };

  const verifyPassword = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/share/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
      } else {
        setFile(data.file);
        setHasPassword(false);
      }
    } catch (err) {
      setError("Failed to verify password");
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async () => {
    if (!file?.url) return;

    setDownloading(true);

    try {
      // Increment download count
      await fetch(`/api/share/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ download: true, password }),
      });

      // Trigger download
      const link = document.createElement("a");
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setDownloading(false);
    }
  };

  const isImage = file?.mimeType?.startsWith("image/");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Cloud className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold">Craig-O-Storage</span>
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {error ? (
          <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
            <h1 className="text-xl font-semibold mt-4">{error}</h1>
            <p className="text-gray-500 mt-2">
              This link may have expired or been deleted.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block text-blue-600 hover:underline"
            >
              Go to Craig-O-Storage
            </Link>
          </div>
        ) : hasPassword ? (
          <div className="bg-white rounded-xl border shadow-sm p-8 max-w-md mx-auto">
            <div className="text-center mb-6">
              <Lock className="h-12 w-12 text-purple-600 mx-auto" />
              <h1 className="text-xl font-semibold mt-4">Password Protected</h1>
              <p className="text-gray-500 mt-2">
                Enter the password to access this file
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === "Enter" && verifyPassword()}
              />
              {error && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  {error}
                </p>
              )}
              <Button onClick={verifyPassword} className="w-full">
                Access File
              </Button>
            </div>
          </div>
        ) : file ? (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            {/* Preview */}
            {isImage && file.url && (
              <div className="bg-gray-100 p-4 flex items-center justify-center min-h-[300px]">
                <img
                  src={file.url}
                  alt={file.name}
                  className="max-w-full max-h-[400px] object-contain rounded-lg shadow"
                />
              </div>
            )}

            {/* File Info */}
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FileIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-semibold truncate">{file.name}</h1>
                  <p className="text-gray-500">
                    {formatBytes(BigInt(file.size))} • {file.mimeType}
                  </p>
                </div>
              </div>

              <Button
                onClick={downloadFile}
                disabled={downloading}
                className="w-full mt-6"
                size="lg"
              >
                {downloading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Download File
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <div className="fixed bottom-4 left-0 right-0 text-center">
        <p className="text-sm text-gray-500">
          Shared via{" "}
          <Link href="/" className="text-blue-600 hover:underline">
            Craig-O-Storage
          </Link>
        </p>
      </div>
    </div>
  );
}
