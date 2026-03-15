/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { LoginSchema, LoginSchemaType } from "@/schemas/LoginSchema";
import { login } from "@/actions/auth/login";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (values: LoginSchemaType) => {
    setError(null);
    setLoading(true);

    const result = await login(values);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  // Don't render the form while checking session or if already logged in
  if (status === "loading" || status === "authenticated") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--white)",
        }}
      >
        <div
          style={{
            width: "3.2rem",
            height: "3.2rem",
            border: "2px solid var(--lightGray)",
            borderTopColor: "var(--black)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.brand}>
          <span className={styles.brandName}>Fonts & Footers</span>
          <p className={styles.brandTagline}>Client Portal</p>
        </div>
        <div className={styles.quote}>
          <h1 className={styles.quoteText}>
            Your site. <br /> Your brand. <br /> Your portal.
          </h1>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.card}>
          <div className={styles.cardTop}>
            <h2 className={styles.heading}>Welcome back</h2>
            <p className={styles.subheading}>Sign in to your client portal</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor='email'>
                Email
              </label>
              <input
                id='email'
                type='email'
                className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                placeholder='you@yourcompany.com'
                autoComplete='email'
                {...register("email")}
              />
              {errors.email && (
                <span className={styles.fieldError}>
                  {errors.email.message}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label className={styles.label} htmlFor='password'>
                  Password
                </label>
                <Link href='/forgot-password' className={styles.forgotLink}>
                  Forgot password?
                </Link>
              </div>
              <input
                id='password'
                type='password'
                className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
                placeholder='••••••••'
                autoComplete='current-password'
                {...register("password")}
              />
              {errors.password && (
                <span className={styles.fieldError}>
                  {errors.password.message}
                </span>
              )}
            </div>

            {error && (
              <div className={styles.errorBanner}>
                <span>{error}</span>
              </div>
            )}

            <button
              type='submit'
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className={styles.registerPrompt}>
            Don&apos;t have an account?{" "}
            <Link href='/register' className={styles.registerLink}>
              Get started
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
