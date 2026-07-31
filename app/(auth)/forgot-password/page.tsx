"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validators/auth";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (_data: ForgotPasswordInput) => {
    await new Promise((r) => setTimeout(r, 600));
    setSent(true);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0 bg-gradient-radial-glow" />

      <div className="relative w-full max-w-sm">
        <Link href="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar ao login
        </Link>

        <div className="glass rounded-2xl p-6 shadow-card sm:p-8">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
                <MailCheck className="h-6 w-6" />
              </div>
              <h2 className="text-base font-semibold">E-mail enviado</h2>
              <p className="text-sm text-muted-foreground">
                Se houver uma conta associada a este e-mail, você receberá um link para redefinir sua senha.
              </p>
            </div>
          ) : (
            <>
              <h1 className="mb-1 text-lg font-semibold">Recuperar senha</h1>
              <p className="mb-6 text-sm text-muted-foreground">
                Informe seu e-mail e enviaremos instruções para redefinir sua senha.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" placeholder="voce@ivs.studio" {...register("email")} />
                  {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Enviar link de recuperação
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
