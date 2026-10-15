import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import authService from "@/services/authService";
import { apiErrorMessage, isNetworkError } from "@/services/api";

const schema = z.object({ email: z.string().email("Enter a valid email") });
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — HabeshaFreight" },
      { name: "description", content: "Request a HabeshaFreight password reset code by email." },
      { property: "og:title", content: "Reset password — HabeshaFreight" },
      { property: "og:description", content: "We'll email you a one-time verification code." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  async function onSubmit(values: FormValues) {
    setPending(true);
    try {
      await authService.forgotPassword(values);
      setSent(true);
      toast.success("Reset code sent", { description: values.email });
      navigate({ to: "/verify-otp", search: { email: values.email, mode: "reset" } });
    } catch (error) {
      if (isNetworkError(error)) {
        setSent(true);
        toast.warning("API unreachable — continuing to the code screen");
        navigate({ to: "/verify-otp", search: { email: values.email } });
        return;
      }
      toast.error(apiErrorMessage(error, "Could not send the reset code"));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="We'll send a one-time code to your registered email."
      footer={
        <>
          Remembered it?{" "}
          <Link to="/login" className="font-medium text-foreground underline">
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="surface-panel p-6 text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-full bg-success/15 text-success">
            <MailCheck className="size-5" aria-hidden />
          </span>
          <p className="mt-3 text-sm">Check your inbox for the verification code.</p>
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
            {form.formState.errors.email ? (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            ) : null}
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Send reset code
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
