// this file should be updated
import React, { useState } from "react";
import {
  Code2,
  Link2,
  Unlink,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Plus,
  Github,
  Linkedin,
  Globe,
  Shield,
} from "lucide-react";
import { Card, CardContent } from "../ui/card";

const PROVIDERS = [
  {
    id: "codeforces",
    name: "Codeforces",
    icon: Code2,
    color: "blue",
    description: "Sync your rating, submissions & contest history",
    getProfileUrl: (handle) => `https://codeforces.com/profile/${handle}`,
  },
  {
    id: "github",
    name: "GitHub",
    icon: Github,
    color: "slate",
    description: "Showcase your open-source contributions",
    getProfileUrl: (handle) => `https://github.com/${handle}`,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    color: "sky",
    description: "Connect your professional profile",
    getProfileUrl: (handle) => `https://linkedin.com/in/${handle}`,
  },
  {
    id: "leetcode",
    name: "LeetCode",
    icon: Globe,
    color: "amber",
    description: "Sync your problem-solving stats",
    getProfileUrl: (handle) => `https://leetcode.com/${handle}`,
  },
];

const COLOR_MAP = {
  blue: {
    bg: "from-blue-500/10 to-blue-600/5",
    border: "border-blue-500/20",
    icon: "text-blue-400",
    iconBg: "bg-blue-500/20",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  slate: {
    bg: "from-slate-500/10 to-slate-600/5",
    border: "border-slate-500/20",
    icon: "text-slate-300",
    iconBg: "bg-slate-500/20",
    badge: "bg-slate-500/10 text-slate-300 border-slate-500/20",
  },
  sky: {
    bg: "from-sky-500/10 to-sky-600/5",
    border: "border-sky-500/20",
    icon: "text-sky-400",
    iconBg: "bg-sky-500/20",
    badge: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  },
  amber: {
    bg: "from-amber-500/10 to-amber-600/5",
    border: "border-amber-500/20",
    icon: "text-amber-400",
    iconBg: "bg-amber-500/20",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
};

function ConnectedAccounts({
  accounts = {},
  onConnect,
  onDisconnect,
  onSync,
  className = "",
  isSyncing = false,
}) {
  const [hoveredId, setHoveredId] = useState(null);

  const handleConnect = (providerId) => {
    onConnect?.(providerId);
  };

  const handleDisconnect = (providerId) => {
    if (window.confirm(`Disconnect ${providerId}?`)) {
      onDisconnect?.(providerId);
    }
  };

  const handleSync = (providerId) => {
    onSync?.(providerId);
  };

  return (
    <Card
      className={`overflow-hidden border-white/5 bg-gradient-to-br from-slate-900 to-slate-800 ${className}`}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-white/5">
              <Link2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Connected Accounts
              </h3>
              <p className="text-xs text-slate-400">
                Link platforms to sync your stats
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
            <Shield className="w-3 h-3" />
            Secure
          </div>
        </div>

        {/* Accounts list */}
        <div className="space-y-3">
          {PROVIDERS.map((provider) => {
            const Icon = provider.icon;
            const scheme = COLOR_MAP[provider.color] || COLOR_MAP.blue;
            const account = accounts[provider.id];
            const isConnected = !!account?.handle;
            const isHovered = hoveredId === provider.id;

            return (
              <div
                key={provider.id}
                className={`
                  relative flex items-center gap-4 p-4 rounded-xl
                  bg-gradient-to-r ${scheme.bg}
                  border ${scheme.border}
                  transition-all duration-300
                  hover:scale-[1.01]
                `}
                onMouseEnter={() => setHoveredId(provider.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Icon */}
                <div
                  className={`flex-shrink-0 p-2.5 rounded-lg ${scheme.iconBg} transition-transform duration-300 ${
                    isHovered ? "scale-110" : ""
                  }`}
                >
                  <Icon className={`w-5 h-5 ${scheme.icon}`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white">
                      {provider.name}
                    </p>
                    {isConnected && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${scheme.badge} flex items-center gap-1`}
                      >
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Connected
                      </span>
                    )}
                  </div>
                  {isConnected ? (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400 font-mono truncate">
                        @{account.handle}
                      </span>
                      {account.profileUrl && (
                        <a
                          href={account.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-500 hover:text-white transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {provider.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <button
                        onClick={() => handleSync(provider.id)}
                        disabled={isSyncing}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all duration-200 disabled:opacity-50"
                        title="Sync now"
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${
                            isSyncing ? "animate-spin" : ""
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => handleDisconnect(provider.id)}
                        className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all duration-200"
                        title="Disconnect"
                      >
                        <Unlink className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleConnect(provider.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="mt-5 pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] text-slate-500">
          <AlertCircle className="w-3 h-3" />
          <span>
            We only read public data. Your credentials are never stored.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default ConnectedAccounts;