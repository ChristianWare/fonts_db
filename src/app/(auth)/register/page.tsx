"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { RegisterSchema, RegisterSchemaType } from "@/schemas/RegisterSchema";
import { register as registerUser } from "@/actions/auth/register";
import styles from "./RegisterPage.module.css";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterSchemaType>({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = async (values: RegisterSchemaType) => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    const result = await registerUser(values);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess(result?.success ?? "Account created!");
    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.brand}>
          <span className={styles.brandName}>Fonts & Footers</span>
          <p className={styles.brandTagline}>Client Portal</p>
        </div>
        <div className={styles.quote}>
          <h1 className={styles.quoteText}>
            Let&apos;s build <br /> something <br />
            <span>premium.</span>
          </h1>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.card}>
          <div className={styles.cardTop}>
            <h2 className={styles.heading}>Create your account</h2>
            <p className={styles.subheading}>
              Get access to your client portal
            </p>
          </div>

          {success ? (
            <div className={styles.successState}>
              <div className={styles.successIcon}>✓</div>
              <h3 className={styles.successHeading}>Check your email</h3>
              <p className={styles.successText}>
                We sent a verification link to your email address. Click it to
                activate your account and access your portal.
              </p>
              <Link href='/login' className={styles.backToLogin}>
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor='name'>
                      Your name
                    </label>
                    <input
                      id='name'
                      type='text'
                      className={`${styles.input} ${
                        errors.name ? styles.inputError : ""
                      }`}
                      placeholder='Marcus Johnson'
                      autoComplete='name'
                      {...register("name")}
                    />
                    {errors.name && (
                      <span className={styles.fieldError}>
                        {errors.name.message}
                      </span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor='businessName'>
                      Business name
                    </label>
                    <input
                      id='businessName'
                      type='text'
                      className={`${styles.input} ${
                        errors.businessName ? styles.inputError : ""
                      }`}
                      placeholder='Elite Black Car'
                      {...register("businessName")}
                    />
                    {errors.businessName && (
                      <span className={styles.fieldError}>
                        {errors.businessName.message}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor='email'>
                    Email
                  </label>
                  <input
                    id='email'
                    type='email'
                    className={`${styles.input} ${
                      errors.email ? styles.inputError : ""
                    }`}
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

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor='password'>
                      Password
                    </label>
                    <input
                      id='password'
                      type='password'
                      className={`${styles.input} ${
                        errors.password ? styles.inputError : ""
                      }`}
                      placeholder='••••••••'
                      autoComplete='new-password'
                      {...register("password")}
                    />
                    {errors.password && (
                      <span className={styles.fieldError}>
                        {errors.password.message}
                      </span>
                    )}
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor='confirmPassword'>
                      Confirm password
                    </label>
                    <input
                      id='confirmPassword'
                      type='password'
                      className={`${styles.input} ${
                        errors.confirmPassword ? styles.inputError : ""
                      }`}
                      placeholder='••••••••'
                      autoComplete='new-password'
                      {...register("confirmPassword")}
                    />
                    {errors.confirmPassword && (
                      <span className={styles.fieldError}>
                        {errors.confirmPassword.message}
                      </span>
                    )}
                  </div>
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
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </form>

              <p className={styles.loginPrompt}>
                Already have an account?{" "}
                <Link href='/login' className={styles.loginLink}>
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
