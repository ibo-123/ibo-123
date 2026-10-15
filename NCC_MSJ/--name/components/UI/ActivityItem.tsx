"use client";

import React from "react";

interface ActivityItemProps {
  icon: React.ReactNode;
  action: string;
  user: string;
  time: string;
  type?: "success" | "warning" | "info" | "default";
}

const typeStyles = {
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  info: "bg-blue-100 text-blue-700",
  default: "bg-primary/10 text-primary",
};

export function ActivityItem({
  icon,
  action,
  user,
  time,
  type = "default",
}: ActivityItemProps) {
  return (
    <div className="flex items-start gap-4 p-4 border-b border-border last:border-0">
      <div className={`p-2 rounded-lg ${typeStyles[type]} flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{action}</p>
        <p className="text-xs text-muted-foreground mt-1">{user}</p>
      </div>
      <div className="text-xs text-muted-foreground whitespace-nowrap">
        {time}
      </div>
    </div>
  );
}
