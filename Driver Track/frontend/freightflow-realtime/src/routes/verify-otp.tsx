import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { ROLE_HOME, useAuth } from "@/context/AuthContext";
import authService from "@/services/authService";
import { apiErrorMessage } from "@/services/api";

export const Route = createFileRoute("/verify-otp")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search["email"] === "string" ? search["email"] : "",
    mode: typeof search["mode"] === "string" && search["mode"] === "reset" ? "reset" : "verify",
  }),
  head: () => ({
    meta: [
      { title: "Verify code — HabeshaFreight" },
      { name: "description", content: "Enter the 6-digit code we sent to verify your account." },
      { property: "og:title", content: "Verify code — HabeshaFreight" },
      { property: "og:description", content: "One-time password verification." },
    ],
  }),
  component: VerifyOtpPage,
});

function VerifyOtpPage() {
  const { email, mode } = Route.useSearch();
  const { verifyOtp, loading } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [resending, setResending] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function submit() {
    if (code.length !== 6) {
      toast.error("Enter all 6 digits");
      return;
    }
    if (mode === "reset") {
      if (password.length < 8) {
        toast.error("Enter a new password with at least 8 characters");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
    }
    try {
      const user = await verifyOtp({
        email,
        otp: code,
        mode,
        newPassword: mode === "reset" ? password : undefined,
      });
      toast.success("Account verified");
      navigate({ to: ROLE_HOME[user.role] as "/", replace: true });
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  async function resend() {
    setResending(true);
    try {
      await authService.resendOtp({ email, mode });
      toast.success("A new code is on its way");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not resend the code"));
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell
      title="Verify your account"
      subtitle={
        email
          ? mode === "reset"
            ? `Enter the 6-digit password reset code sent to ${email}.`
            : `Enter the 6-digit code sent to ${email}.`
          : "Enter your 6-digit code."
      }
      footer={
        <>
          Wrong email?{" "}
          <Link to="/register" className="font-medium text-foreground underline">
            Start over
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="otp">Verification code</Label>
          <InputOTP id="otp" maxLength={6} value={code} onChange={setCode}>
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <InputOTPSlot key={index} index={index} className="size-12 text-base" />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        {mode === "reset" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="input w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="input w-full"
              />
            </div>
          </div>
        ) : null}

        <Button size="lg" className="w-full" onClick={submit} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Verify
        </Button>

        <Button variant="ghost" className="w-full" onClick={resend} disabled={resending || !email}>
          {resending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Resend code
        </Button>
      </div>
    </AuthShell>
  );
}
