"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/actions/auth/resetPassword";
import styles from "./ResetPasswordPage.module.css";

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

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const result = await resetPassword({ token, password });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push("/login"), 3000);
  };

  // No token in URL
  if (!token) {
    return (
      <div className={styles.page}>
        <div className={styles.left}>
          <div className={styles.brand}>
            <span className={styles.brandName}>Fonts & Footers</span>
            <p className={styles.brandTagline}>Client Portal</p>
          </div>
          <div className={styles.quote}>
            <h1 className={styles.quoteText}>
              Let&apos;s get you <br />
              <span>back in.</span>
            </h1>
          </div>
        </div>
        <div className={styles.right}>
          <div className={styles.card}>
            <div className={styles.errorState}>
              <div className={styles.errorIcon}>✕</div>
              <h2 className={styles.errorHeading}>Invalid link</h2>
              <p className={styles.errorText}>
                This password reset link is invalid or has expired.
              </p>
              <Link href='/forgot-password' className={styles.btn}>
                Request a new link
              </Link>
            </div>
          </div>
        </div>
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
            Let&apos;s get you <br />
            <span>back in.</span>
          </h1>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.card}>
          {success ? (
            <div className={styles.successState}>
              <div className={styles.successIcon}>✓</div>
              <h2 className={styles.successHeading}>Password updated</h2>
              <p className={styles.successText}>
                Your password has been reset. Redirecting you to login...
              </p>
              <Link href='/login' className={styles.btn}>
                Go to login
              </Link>
            </div>
          ) : (
            <>
              <div className={styles.cardTop}>
                <h2 className={styles.heading}>Reset your password</h2>
                <p className={styles.subheading}>
                  Choose a new password for your account.
                </p>
              </div>

              <div className={styles.form}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor='password'>
                    New password
                  </label>
                  <div className={styles.inputWrap}>
                    <input
                      id='password'
                      type={showPassword ? "text" : "password"}
                      className={styles.inputInner}
                      placeholder='Min. 8 characters'
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      autoFocus
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
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor='confirmPassword'>
                    Confirm new password
                  </label>
                  <div className={styles.inputWrap}>
                    <input
                      id='confirmPassword'
                      type={showConfirmPassword ? "text" : "password"}
                      className={styles.inputInner}
                      placeholder='••••••••'
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError(null);
                      }}
                    />
                    <button
                      type='button'
                      className={styles.eyeBtn}
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                {error && <div className={styles.errorBanner}>{error}</div>}

                <button
                  onClick={handleSubmit}
                  className={styles.submitBtn}
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update password"}
                </button>
              </div>

              <Link href='/login' className={styles.backBtn}>
                ← Back to login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
