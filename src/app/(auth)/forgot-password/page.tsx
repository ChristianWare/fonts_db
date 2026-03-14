"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/actions/auth/forgotPassword";
import styles from "./ForgotPasswordPage.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setError(null);
    setLoading(true);

    await forgotPassword(email);

    // Always show success — prevents email enumeration
    setSubmitted(true);
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
            We&apos;ve got <br /> you <br />
            <span>covered.</span>
          </h1>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.card}>
          {submitted ? (
            <div className={styles.successState}>
              <div className={styles.successIcon}>✓</div>
              <h2 className={styles.successHeading}>Check your email</h2>
              <p className={styles.successText}>
                If an account exists for {email}, we&apos;ve sent a password
                reset link. Check your inbox — it expires in 1 hour.
              </p>
              <Link href='/login' className={styles.backBtn}>
                ← Back to login
              </Link>
            </div>
          ) : (
            <>
              <div className={styles.cardTop}>
                <h2 className={styles.heading}>Forgot your password?</h2>
                <p className={styles.subheading}>
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              <div className={styles.form}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor='email'>
                    Email address
                  </label>
                  <input
                    id='email'
                    type='email'
                    className={styles.input}
                    placeholder='you@yourcompany.com'
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    autoComplete='email'
                    autoFocus
                  />
                </div>

                {error && <div className={styles.errorBanner}>{error}</div>}

                <button
                  onClick={handleSubmit}
                  className={styles.submitBtn}
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send reset link"}
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
