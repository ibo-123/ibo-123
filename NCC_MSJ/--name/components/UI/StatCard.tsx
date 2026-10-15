"use client";

import React from "react";
import Link from "next/link";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon?: React.ReactNode;
  link?: string;
  trend?: "up" | "down" | "neutral";
}

export function StatCard({
  title,
  value,
  change,
  icon,
  link,
  trend = "neutral",
}: StatCardProps) {
  const content = (
    <div className="ncc-card p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {change && (
              <span
                className={`text-sm font-medium ${
                  trend === "up"
                    ? "text-green-600"
                    : trend === "down"
                      ? "text-destructive"
                      : "text-muted-foreground"
                }`}
              >
                {change}
              </span>
            )}
          </div>
        </div>
        {icon && (
          <div className="text-primary/40 flex-shrink-0">{icon}</div>
        )}
      </div>
    </div>
  );

  return link ? <Link href={link}>{content}</Link> : content;
}
