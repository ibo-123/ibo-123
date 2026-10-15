import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABEL } from "@/components/layout/nav-config";
import userService from "@/services/userService";
import { apiErrorMessage } from "@/services/api";

export function ProfilePanel() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const updated = await userService.updateProfile({ name, phone });
      updateUser(updated);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not save your profile"));
    } finally {
      setSaving(false);
    }
  }

  const initials = (user?.name ?? "U")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="surface-panel p-6 text-center">
        <span className="mx-auto grid size-20 place-items-center rounded-full bg-primary font-display text-2xl font-semibold text-primary-foreground">
          {initials}
        </span>
        <h2 className="mt-4 font-display text-lg font-semibold">{user?.name}</h2>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
        {user?.role ? <p className="badge-soft mt-3">{ROLE_LABEL[user.role]}</p> : null}
      </div>

      <form onSubmit={save} className="surface-panel space-y-4 p-6 lg:col-span-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={user?.email ?? ""} readOnly disabled />
          <p className="text-xs text-muted-foreground">
            Contact an administrator to change your email address.
          </p>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Save changes
        </Button>
      </form>
    </div>
  );
}

export default ProfilePanel;
