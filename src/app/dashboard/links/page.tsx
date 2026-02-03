"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Cloud,
  ArrowLeft,
  Link as LinkIcon,
  Copy,
  Check,
  Trash2,
  Loader2,
  Lock,
  Calendar,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface ShareLink {
  id: string;
  token: string;
  expiresAt: string | null;
  password: string | null;
  downloads: number;
  maxDownloads: number | null;
  createdAt: string;
  file: {
    name: string;
  };
}

export default function LinksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchLinks();
    }
  }, [session]);

  const fetchLinks = async () => {
    try {
      const response = await fetch("/api/share");
      if (response.ok) {
        const data = await response.json();
        setLinks(data.shareLinks);
      }
    } catch (error) {
      console.error("Fetch links error:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async (token: string, id: string) => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/share/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteLink = async (id: string) => {
    if (!confirm("Delete this share link?")) return;

    try {
      const response = await fetch(`/api/share?id=${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchLinks();
      }
    } catch (error) {
      console.error("Delete error:", error);
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
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="flex items-center gap-2">
                <Cloud className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold">Craig-O-Storage</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Share Links
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your shared file links
            </p>
          </div>

          {links.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <LinkIcon className="h-12 w-12 mx-auto text-gray-300" />
              <p className="mt-2">No share links yet</p>
              <p className="text-sm">
                Share a file from the dashboard to create a link
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {links.map((link) => {
                const isExpired =
                  link.expiresAt && new Date(link.expiresAt) < new Date();
                const isLimitReached =
                  link.maxDownloads && link.downloads >= link.maxDownloads;

                return (
                  <div key={link.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{link.file.name}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {link.downloads}
                            {link.maxDownloads && ` / ${link.maxDownloads}`} downloads
                          </span>
                          {link.password && (
                            <span className="flex items-center gap-1 text-purple-600">
                              <Lock className="h-3 w-3" />
                              Password protected
                            </span>
                          )}
                          {link.expiresAt && (
                            <span
                              className={`flex items-center gap-1 ${
                                isExpired ? "text-red-600" : ""
                              }`}
                            >
                              <Calendar className="h-3 w-3" />
                              {isExpired
                                ? "Expired"
                                : `Expires ${format(
                                    new Date(link.expiresAt),
                                    "MMM d, yyyy"
                                  )}`}
                            </span>
                          )}
                        </div>
                        {(isExpired || isLimitReached) && (
                          <p className="mt-2 text-xs text-red-600">
                            This link is no longer active
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyLink(link.token, link.id)}
                          disabled={isExpired || isLimitReached}
                        >
                          {copiedId === link.id ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteLink(link.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
