"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { BrandLogo } from "@/components/brand/brand-logo";
import {
  DEMO_CREDENTIALS,
  isDemoProfileSwitcherEnabled,
} from "@/lib/security/demo-allowlist";

const loginSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [authenticationError, setAuthenticationError] = useState<string>();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@demo.local",
      password: "DemoAdmin!123",
    },
  });

  async function onSubmit(data: LoginFormData) {
    setAuthenticationError(undefined);

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setAuthenticationError(
        "Credenciais inválidas ou conta fora da allowlist demo.",
      );
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="relative flex min-h-dvh flex-col bg-paper text-ink">
      <div aria-hidden className="so-grain pointer-events-none absolute inset-0" />

      <div className="relative z-10 border-b border-border bg-paper">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            className="flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
            href="/"
          >
            <BrandLogo size={28} className="h-7 w-7" />
            ← Voltar à landing
          </Link>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
            Demo pública
          </span>
        </div>
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-5xl flex-1 lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="hidden border-r border-border bg-primary p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <BrandLogo size={72} priority className="h-[4.5rem] w-[4.5rem]" />
            <p className="mt-6 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-200">
              SalesOps Industrial
            </p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight">
              Acesso controlado à demo
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-blue-100/90">
              Sem cadastro. Autenticação só com contas seed da allowlist.
            </p>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-blue-200/80">
            AUTH / CREDENTIALS · RATE LIMITED
          </p>
        </aside>

        <section
          aria-labelledby="login-title"
          className="flex flex-col justify-center px-4 py-10 sm:px-8 lg:px-12"
        >
          <div className="w-full max-w-md border border-border bg-paper p-8">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <BrandLogo size={40} className="h-10 w-10" />
              <p className="so-label">SalesOps Industrial</p>
            </div>
            <h2
              id="login-title"
              className="text-2xl font-semibold tracking-tight text-ink"
            >
              Entrar na demo
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              Use apenas as contas seed abaixo.
            </p>

            <form
              className="mt-6 space-y-4"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-ink"
                >
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  aria-invalid={Boolean(errors.email)}
                  className="so-input"
                  {...register("email")}
                />
                {errors.email ? (
                  <p className="mt-1 text-xs text-risk">{errors.email.message}</p>
                ) : null}
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-ink"
                >
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(errors.password)}
                  className="so-input"
                  {...register("password")}
                />
                {errors.password ? (
                  <p className="mt-1 text-xs text-risk">
                    {errors.password.message}
                  </p>
                ) : null}
              </div>

              {authenticationError ? (
                <p className="border border-risk/30 bg-red-50 px-3 py-2 text-sm text-risk">
                  {authenticationError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="so-btn so-btn-primary w-full disabled:opacity-60"
              >
                {isSubmitting ? "Entrando…" : "Entrar"}
              </button>
            </form>

            {isDemoProfileSwitcherEnabled() ? (
              <div className="mt-8 border-t border-border pt-5">
                <p className="so-label-muted">Atalhos demo</p>
                <ul className="mt-3 divide-y divide-border border border-border">
                  {DEMO_CREDENTIALS.map((cred) => (
                    <li key={cred.email}>
                      <button
                        type="button"
                        className="flex w-full cursor-pointer flex-col px-3 py-2.5 text-left text-xs transition-colors hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
                        onClick={() => {
                          setValue("email", cred.email);
                          setValue("password", cred.password);
                        }}
                      >
                        <span className="font-semibold text-ink">{cred.role}</span>
                        <span className="font-mono text-ink-muted">
                          {cred.email}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
