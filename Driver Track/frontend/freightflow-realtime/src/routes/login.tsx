import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_HOME, useAuth } from "@/context/AuthContext";
import type { Role } from "@/types";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["customer", "driver", "dispatcher", "admin"]),
});

type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search['redirect'] === "string" ? search['redirect'] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — HabeshaFreight" },
      { name: "description", content: "Sign in to HabeshaFreight to track and manage freight." },
      { property: "og:title", content: "Sign in — HabeshaFreight" },
      { property: "og:description", content: "Access your HabeshaFreight workspace." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", role: "customer" },
  });

  async function onSubmit(values: FormValues) {
    try {
      const user = await login(values);
      toast.success(`Welcome back, ${user.name}`);
      navigate({ to: (redirect ?? ROLE_HOME[user.role as Role]) as "/", replace: true });
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Use your HabeshaFreight account to continue."
      footer={
        <>
          No account yet?{" "}
          <Link to="/register" className="font-medium text-foreground underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.et"
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register("email")}
          />
          {form.formState.errors.email ? (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-muted-foreground underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register("password")}
          />
          {form.formState.errors.password ? (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Workspace</Label>
          <Select
            value={form.watch("role")}
            onValueChange={(value) => form.setValue("role", value as Role)}
          >
            <SelectTrigger id="role">
              <SelectValue placeholder="Select workspace" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="driver">Driver</SelectItem>
              <SelectItem value="dispatcher">Dispatcher</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Your real role comes from the API. This selection is only used if the backend is
            unreachable, so you can still preview the interface.
          </p>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
