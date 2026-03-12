/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import styles from "./ContactForm.module.css";
import toast from "react-hot-toast";
import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import Button from "@/components/shared/Button/Button";

interface Inputs {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  siteUrl?: string;
  projectDescription: string;
  services: string[];
}

const serviceOptions = [
  "Free booking audit (I already have a site)",
  "Solo Starter Booking",
  "Team Booking Platform",
  "Multi-Location Booking",
  "Rental Fleet & Inventory",
  "Custom enterprise solution",
] as const;

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      siteUrl: "",
      projectDescription: "",
      services: [],
    },
    mode: "onBlur",
  });

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service],
    );
  };

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    try {
      setLoading(true);

      const formData: Inputs = {
        ...data,
        services: selectedServices,
      };

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (res.ok && json?.messageId) {
        toast.success("Thanks! We'll be in touch soon.");
        reset();
        setSelectedServices([]);
      } else {
        toast.error("Oops! Please try again.");
      }
    } catch (e) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit(onSubmit)}
      aria-busy={loading}
    >
      <div className={styles.namesContainer}>
        <div className={styles.labelInputBox}>
          <label htmlFor='firstName'>
            First Name <span className={styles.required}>*</span>
          </label>
          <input
            id='firstName'
            type='text'
            placeholder='Jane'
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
          <label htmlFor='lastName'>
            Last Name <span className={styles.required}>*</span>
          </label>
          <input
            id='lastName'
            type='text'
            placeholder='Doe'
            maxLength={120}
            {...register("lastName", { required: true })}
            aria-invalid={!!errors.lastName || undefined}
            disabled={loading}
          />
          {errors.lastName && (
            <span className={styles.error}>*** Last Name is required</span>
          )}
        </div>
      </div>

      <div className={styles.everythingElse}>
        <div className={styles.labelInputBox}>
          <label htmlFor='email'>
            Email 
            <span className={styles.required}>*</span>
          </label>
          <input
            id='email'
            type='email'
            placeholder='So we can respond. We won&#39;t send you spam.'
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

        <div className={styles.labelInputBox}>
          <label htmlFor='company'>Company</label>
          <input
            id='company'
            type='text'
            placeholder='Your company name (if applicable)'
            maxLength={200}
            {...register("company")}
            disabled={loading}
          />
        </div>

        <div className={styles.labelInputBox}>
          <label htmlFor='siteUrl'>Current website:</label>
          <input
            id='siteUrl'
            type='url'
            placeholder='www.example.com'
            maxLength={500}
            // {...register("siteUrl", {
            //   pattern: {
            //     // basic URL pattern; keeps it lenient
            //     value: /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[^\s]*)?$/i,
            //     message: "Please enter a valid URL",
            //   },
            // })}
            aria-invalid={!!errors.siteUrl || undefined}
            disabled={loading}
          />
          {errors.siteUrl?.message && (
            <span className={styles.error}>*** {errors.siteUrl.message}</span>
          )}
        </div>

        <div className={styles.labelInputBox}>
          <label htmlFor='projectDescription'>
            Project Description <span className={styles.required}>*</span>
          </label>
          <textarea
            id='projectDescription'
            placeholder='Tell us about your booking challenges or goals.'
            maxLength={5000}
            {...register("projectDescription", { required: true })}
            aria-invalid={!!errors.projectDescription || undefined}
            disabled={loading}
          />
          {errors.projectDescription && (
            <span className={styles.error}>
              *** Project Description is required
            </span>
          )}
        </div>

        <div className={styles.servicesSection}>
          <label className={styles.servicesLabel}>
            What can we help you with?
          </label>

          <div className={styles.serviceCheckboxes}>
            {serviceOptions.map((service) => {
              const checked = selectedServices.includes(service);
              return (
                <div key={service} className={styles.checkboxContainer}>
                  <input
                    type='checkbox'
                    id={service}
                    value={service}
                    checked={checked}
                    onChange={() => toggleService(service)}
                    className={styles.checkbox}
                    disabled={loading}
                  />
                  <label htmlFor={service} className={styles.checkboxLabel}>
                    {service}
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Real submit for keyboard/AT; FalseButton handles visuals */}
      {/* <button type='submit' style={{ display: "none" }} aria-hidden /> */}

      <div className={styles.btnBtnContainer}>
        <Button
          type='submit'
          btnType='black'
          disabled={loading}
          text={loading ? "Sending..." : "Submit"}
          arrow
        />
      </div>
    </form>
  );
}
