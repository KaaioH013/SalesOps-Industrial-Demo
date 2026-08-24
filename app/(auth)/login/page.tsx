"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DEMO_CREDENTIALS } from "@/lib/security/demo-allowlist";

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
    <main className="flex min-h-screen flex-col bg-slate-100 text-slate-950">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <Link
            className="text-sm font-semibold text-blue-950 hover:underline"
            href="/"
          >
            ← Voltar à landing
          </Link>
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Demo pública
          </span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <section
          aria-labelledby="login-title"
          className="w-full max-w-md border border-slate-200 bg-white p-8 shadow-sm"
        >
          <div className="mb-6">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-blue-950">
              SalesOps Industrial
            </p>
            <h1
              id="login-title"
              className="text-2xl font-semibold tracking-tight"
            >
              Entrar na demo
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Sem cadastro. Use apenas as contas seed abaixo.
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                aria-invalid={Boolean(errors.email)}
                className="min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-950 focus:ring-2 focus:ring-blue-950/15"
                {...register("email")}
              />
              {errors.email ? (
                <p className="mt-1 text-xs text-red-700">{errors.email.message}</p>
              ) : null}
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium"
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                className="min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-950 focus:ring-2 focus:ring-blue-950/15"
                {...register("password")}
              />
              {errors.password ? (
                <p className="mt-1 text-xs text-red-700">
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            {authenticationError ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {authenticationError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-md bg-blue-950 text-sm font-semibold text-white transition-colors hover:bg-blue-900 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950"
            >
              {isSubmitting ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-100 pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Atalhos demo
            </p>
            <ul className="mt-3 space-y-2">
              {DEMO_CREDENTIALS.map((cred) => (
                <li key={cred.email}>
                  <button
                    type="button"
                    className="flex w-full cursor-pointer flex-col rounded-md border border-slate-200 px-3 py-2 text-left text-xs transition-colors hover:border-blue-950/40 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-950"
                    onClick={() => {
                      setValue("email", cred.email);
                      setValue("password", cred.password);
                    }}
                  >
                    <span className="font-semibold text-slate-900">
                      {cred.role}
                    </span>
                    <span className="font-mono text-slate-600">{cred.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
