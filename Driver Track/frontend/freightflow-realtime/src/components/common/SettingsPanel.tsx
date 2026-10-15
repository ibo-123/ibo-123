import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getApiUrl, getSocketUrl } from "@/lib/config";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export function SettingsPanel() {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [tripAlerts, setTripAlerts] = useState(true);
  const [gpsAlerts, setGpsAlerts] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="surface-panel space-y-4 p-6">
        <h2 className="font-display text-lg font-semibold">Appearance</h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-xs text-muted-foreground">
              Currently using {theme === "dark" ? "dark" : "light"} mode.
            </p>
          </div>
          <Button variant="outline" onClick={toggleTheme}>
            {theme === "dark" ? (
              <Sun className="size-4" aria-hidden />
            ) : (
              <Moon className="size-4" aria-hidden />
            )}
            Switch
          </Button>
        </div>
      </section>

      <section className="surface-panel space-y-4 p-6">
        <h2 className="font-display text-lg font-semibold">Notifications</h2>
        {[
          {
            id: "tripAlerts",
            label: "Trip status changes",
            value: tripAlerts,
            set: setTripAlerts,
          },
          { id: "gpsAlerts", label: "GPS signal lost", value: gpsAlerts, set: setGpsAlerts },
          { id: "emailDigest", label: "Weekly email digest", value: emailDigest, set: setEmailDigest },
        ].map((row) => (
          <div key={row.id} className="flex items-center justify-between gap-4">
            <Label htmlFor={row.id} className="text-sm font-medium">
              {row.label}
            </Label>
            <Switch
              id={row.id}
              checked={row.value}
              onCheckedChange={(checked) => {
                row.set(checked);
                toast.success(`${row.label} ${checked ? "enabled" : "disabled"}`);
              }}
            />
          </div>
        ))}
      </section>

      <section className="surface-panel space-y-3 p-6">
        <h2 className="font-display text-lg font-semibold">Connection</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">API base URL</dt>
            <dd className="truncate font-mono text-xs">{getApiUrl()}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Realtime URL</dt>
            <dd className="truncate font-mono text-xs">{getSocketUrl()}</dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">
          Set VITE_API_URL and VITE_SOCKET_URL to your machine's LAN address (for example
          http://192.168.1.20:5000) so phones on the same network can reach the backend.
        </p>
      </section>

      <section className="surface-panel space-y-3 p-6">
        <h2 className="font-display text-lg font-semibold">Session</h2>
        <p className="text-sm text-muted-foreground">
          Signing out clears your stored token on this device.
        </p>
        <Button variant="destructive" onClick={() => logout()}>
          Sign out
        </Button>
      </section>
    </div>
  );
}

export default SettingsPanel;
