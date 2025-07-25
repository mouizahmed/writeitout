"use client";

import { useState } from "react";
import Link from "next/link";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";

export default function PasswordResetPage() {
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetStep, setResetStep] = useState<"email" | "code">("email");
  
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setError("");

    try {
      await signIn.create({
        identifier: email,
      });

      const firstFactor = signIn.supportedFirstFactors.find(
        (factor) => factor.strategy === "reset_password_email_code"
      );

      if (firstFactor) {
        await signIn.prepareFirstFactor({
          strategy: "reset_password_email_code",
          emailAddressId: firstFactor.emailAddressId,
        });
        setResetStep("code");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Password reset failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetCode,
        password: newPassword,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Password reset failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="flex items-center justify-center">
            <Image src="/logo2.svg" alt="WriteItOut" width={100} height={100} className="w-12 h-12 bg-white border border-gray-200 rounded-xl" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">
            {resetStep === "email" ? "Reset your password" : "Enter reset code"}
          </h1>
          <p className="text-gray-600 mt-2">
            {resetStep === "email" 
              ? "Enter your email to receive a reset code" 
              : `We sent a reset code to ${email}`
            }
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">
              {resetStep === "email" ? "Reset Password" : "Enter Reset Code"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            {resetStep === "email" && (
              <form onSubmit={handleSendResetCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending reset code..." : "Send Reset Code"}
                </Button>
              </form>
            )}

            {resetStep === "code" && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-code">Reset Code</Label>
                  <Input
                    id="reset-code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    required
                    disabled={isLoading}
                    maxLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || resetCode.length !== 6}>
                  {isLoading ? "Resetting password..." : "Reset Password"}
                </Button>
              </form>
            )}

            {resetStep === "code" && (
              <div className="text-center text-sm">
                <span className="text-gray-600">Didn't receive the code? </span>
                <button
                  onClick={() => handleSendResetCode({ preventDefault: () => {} } as React.FormEvent)}
                  className="text-blue-600 hover:underline"
                  disabled={isLoading}
                >
                  Resend
                </button>
              </div>
            )}

            <div className="text-center text-sm">
              <Link href="/login" className="text-blue-600 hover:underline">
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}