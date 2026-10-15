"use client";

import { CheckCircle, AlertCircle } from "lucide-react";

interface StatusItemProps {
  label: string;
  status: string;
  isHealthy?: boolean;
}

export function StatusItem({
  label,
  status,
  isHealthy = true,
}: StatusItemProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        {isHealthy ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-yellow-600" />
        )}
        <span className="text-foreground font-medium">{label}</span>
      </div>
      <span
        className={`text-sm font-medium ${
          isHealthy ? "text-green-600" : "text-yellow-600"
        }`}
      >
        {status}
      </span>
    </div>
  );
}
