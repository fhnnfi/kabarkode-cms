"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/brand/logo";
import { useAuth } from "@/features/auth/auth-provider";
import { loginSchema, type LoginValues } from "@/lib/validation/schemas";
import type { NormalizedApiError } from "@/types/api";

function LoginForm() {
  const { status, login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(params.get("next") ?? "/dashboard");
    }
  }, [status, router, params]);

  async function onSubmit(values: LoginValues) {
    setSubmitting(true);
    try {
      await login(values.email, values.password);
      // redirect ditangani useEffect di atas
    } catch (err) {
      const e = err as NormalizedApiError;
      toast.error(e.message ?? "Login gagal");
    } finally {
      setSubmitting(false);
    }
  }

  // Redesign §63: login membangun identitas merek sejak layar pertama.
  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center text-center">
        <BrandMark size={56} className="rounded-2xl shadow-lg shadow-black/10" />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">KabarKode</h1>
        <p className="mt-1 font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Editorial Workspace
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="admin@kabarkode.local"
            className="h-11 bg-card"
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className="h-11 bg-card"
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>
        <Button type="submit" size="lg" disabled={submitting} className="mt-2 w-full">
          {submitting && <Loader2 className="animate-spin" />}
          {submitting ? "Memproses…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-8 text-center font-mono text-[10px] tracking-wide text-muted-foreground">
        K&lt;/&gt; — editorial workspace for people who care about technology
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
