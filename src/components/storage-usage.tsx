"use client";

import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { formatBytes } from "@/lib/utils";
import { HardDrive, Zap } from "lucide-react";

interface StorageUsageProps {
  used: bigint;
  limit: bigint;
  isPro: boolean;
  onUpgrade: () => void;
}

export function StorageUsage({ used, limit, isPro, onUpgrade }: StorageUsageProps) {
  const usedNum = Number(used);
  const limitNum = Number(limit);
  const percentage = limitNum > 0 ? (usedNum / limitNum) * 100 : 0;

  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-gray-500" />
          <span className="font-medium">Storage</span>
        </div>
        {isPro && (
          <span className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-0.5 rounded-full">
            PRO
          </span>
        )}
      </div>

      <Progress value={percentage} className="h-2" />

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          {formatBytes(used)} of {formatBytes(limit)} used
        </span>
        <span className="text-gray-500">{percentage.toFixed(1)}%</span>
      </div>

      {!isPro && (
        <Button
          onClick={onUpgrade}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Zap className="mr-2 h-4 w-4" />
          Upgrade to Pro - $14/mo
        </Button>
      )}
    </div>
  );
}
