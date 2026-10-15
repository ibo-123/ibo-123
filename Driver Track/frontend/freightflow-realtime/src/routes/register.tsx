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

const schema = z
  .object({
    name: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email"),
    phone: z.string().min(9, "Enter a valid phone number"),
    role: z.enum(["customer", "driver", "dispatcher", "admin"]),
    password: z.string().min(6, "At least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — HabeshaFreight" },
      {
        name: "description",
        content: "Register as a customer, driver, dispatcher or admin on HabeshaFreight.",
      },
      { property: "og:title", content: "Create account — HabeshaFreight" },
      { property: "og:description", content: "Join HabeshaFreight in under a minute." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { register: registerUser, loading } = useAuth();
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "customer",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      const result = await registerUser({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        role: values.role,
      });
      if (result.user) {
        toast.success("Account created");
        navigate({ to: ROLE_HOME[result.user.role] as "/", replace: true });
        return;
      }
      toast.success("Verification code sent", { description: values.email });
      navigate({ to: "/verify-otp", search: { email: values.email } });
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  const errors = form.formState.errors;

  return (
    <AuthShell
      title="Create your account"
      subtitle="Freight visibility for shippers, drivers and dispatch teams."
      footer={
        <>
          Already registered?{" "}
          <Link to="/login" className="font-medium text-foreground underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" autoComplete="name" {...form.register("name")} />
          {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
            {errors.email ? (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" placeholder="+2519…" autoComplete="tel" {...form.register("phone")} />
            {errors.phone ? (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">I am a</Label>
          <Select
            value={form.watch("role")}
            onValueChange={(value) => form.setValue("role", value as Role)}
          >
            <SelectTrigger id="role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer">Customer — I ship cargo</SelectItem>
              <SelectItem value="driver">Driver — I move cargo</SelectItem>
              <SelectItem value="dispatcher">Dispatcher — I coordinate</SelectItem>
              <SelectItem value="admin">Admin — I manage the platform</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...form.register("password")}
            />
            {errors.password ? (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...form.register("confirmPassword")}
            />
            {errors.confirmPassword ? (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            ) : null}
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
