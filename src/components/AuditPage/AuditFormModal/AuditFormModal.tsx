/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import toast from "react-hot-toast";
import styles from "./AuditFormModal.module.css";
import Button from "@/components/shared/Button/Button";

interface Inputs {
  firstName: string;
  url: string;
  email: string;
}

interface Props {
  onSubmit: (url: string, email: string, firstName: string) => void;
  error?: string;
}

export default function AuditFormModal({ onSubmit, error }: Props) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      firstName: "",
      url: "",
      email: "",
    },
    mode: "onBlur",
  });

  const onFormSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      setLoading(true);
      onSubmit(data.url, data.email, data.firstName);
    } catch (e) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit(onFormSubmit)}
      aria-busy={loading}
    >
      <div className={styles.formHeading}>
        <h2 className={styles.heading}>Run Your Free Audit</h2>
        <p className={styles.subheading}>
          Enter your details below. We&apos;ll scan your site in 60 seconds and
          email you the full report with personalized fixes.
        </p>
      </div>

      <div className={styles.everythingElse}>
        <div className={styles.labelInputBox}>
          <label htmlFor='firstName'>
            First Name <span className={styles.required}>*</span>
          </label>
          <input
            id='firstName'
            type='text'
            placeholder='Mike'
            maxLength={120}
            {...register("firstName", { required: true })}
            aria-invalid={!!errors.firstName || undefined}
            disabled={loading}
          />
          {errors.firstName && (
            <span className={styles.error}>*** First Name is required</span>
          )}
        </div>

        <div className={styles.labelInputBox}>
          <label htmlFor='url'>
            Website URL <span className={styles.required}>*</span>
          </label>
          <input
            id='url'
            type='url'
            placeholder='https://yourlimo.com'
            maxLength={500}
            {...register("url", {
              required: true,
              pattern: {
                value: /^https?:\/\/.+\..+/,
                message:
                  "Please enter a valid URL starting with http:// or https://",
              },
            })}
            aria-invalid={!!errors.url || undefined}
            disabled={loading}
          />
          {errors.url && (
            <span className={styles.error}>
              *** {errors.url.message || "Website URL is required"}
            </span>
          )}
        </div>

        <div className={styles.labelInputBox}>
          <label htmlFor='email'>
            Email <span className={styles.required}>*</span>
          </label>
          <input
            id='email'
            type='email'
            placeholder='you@yourlimo.com'
            maxLength={320}
            {...register("email", {
              required: true,
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: "Entered value does not match email format",
              },
            })}
            aria-invalid={!!errors.email || undefined}
            disabled={loading}
          />
          {errors.email && (
            <span className={styles.error}>
              *** {errors.email.message || "Email is required"}
            </span>
          )}
        </div>

        {error && <p className={styles.errorMsg}>*** {error}</p>}

        {/* Honeypot — hidden from real users, bots fill it out */}
        <input
          type='text'
          name='website_url_confirm'
          tabIndex={-1}
          autoComplete='off'
          aria-hidden='true'
          style={{ display: "none" }}
        />
      </div>

      <div className={styles.btnBtnContainer}>
        <Button
          type='submit'
          btnType='black'
          disabled={loading}
          text={loading ? "Scanning..." : "Run Free Audit"}
          arrow
        />
      </div>

      <div className={styles.smallParent}>
        <small className={styles.small}>
          No spam. We&apos;ll email your full report and occasionally share tips
          for black car operators.
        </small>
      </div>
    </form>
  );
}
