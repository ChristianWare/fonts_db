"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { RegisterSchema, RegisterSchemaType } from "@/schemas/RegisterSchema";
import { register as registerUser } from "@/actions/auth/register";
import styles from "./RegisterPage.module.css";

function EyeIcon() {
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
      <circle cx='12' cy='12' r='3' />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94' />
      <path d='M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19' />
      <line x1='1' y1='1' x2='23' y2='23' />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

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
                {/* Honeypot — hidden from real users, bots fill it */}
                <input
                  type='text'
                  {...register("website")}
                  autoComplete='off'
                  tabIndex={-1}
                  aria-hidden='true'
                  style={{ display: "none" }}
                />
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor='name'>
                      Your name
                    </label>
                    <input
                      id='name'
                      type='text'
                      className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
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
                      className={`${styles.input} ${errors.businessName ? styles.inputError : ""}`}
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

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor='password'>
                      Password
                    </label>
                    <div
                      className={`${styles.inputWrap} ${errors.password ? styles.inputWrapError : ""}`}
                    >
                      <input
                        id='password'
                        type={showPassword ? "text" : "password"}
                        className={styles.inputInner}
                        placeholder='••••••••'
                        autoComplete='new-password'
                        {...register("password")}
                      />
                      <button
                        type='button'
                        className={styles.eyeBtn}
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
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
                    <div
                      className={`${styles.inputWrap} ${errors.confirmPassword ? styles.inputWrapError : ""}`}
                    >
                      <input
                        id='confirmPassword'
                        type={showConfirmPassword ? "text" : "password"}
                        className={styles.inputInner}
                        placeholder='••••••••'
                        autoComplete='new-password'
                        {...register("confirmPassword")}
                      />
                      <button
                        type='button'
                        className={styles.eyeBtn}
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
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
