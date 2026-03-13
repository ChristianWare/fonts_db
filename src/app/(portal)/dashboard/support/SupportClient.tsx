"use client";

import { useState } from "react";
import { submitSupportTicket } from "@/actions/client/submitSupportTicket";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import styles from "./SupportClient.module.css";

type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  adminReply: string | null;
  repliedAt: Date | null;
  createdAt: Date;
};

export default function SupportClient({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      setError("Please fill out both fields.");
      return;
    }

    setError(null);
    setSubmitting(true);

    const result = await submitSupportTicket({ subject, message });

    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubject("");
    setMessage("");
    setSubmitting(false);
    router.refresh();
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={`${styles.heading} h2`}>Support</h1>
        <p className={styles.subheading}>
          Have a question or need help? Send us a message and we&apos;ll get
          back to you shortly.
        </p>
      </div>

      {/* New ticket form */}
      <div className={styles.formCard}>
        <h3 className={styles.formHeading}>Send a message</h3>

        {success && (
          <div className={styles.successBanner}>
            Message sent — we&apos;ll be in touch soon.
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>Subject</label>
          <input
            type='text'
            className={styles.input}
            placeholder='What do you need help with?'
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setSuccess(false);
            }}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Message</label>
          <textarea
            className={styles.textarea}
            placeholder='Describe your question or issue in detail...'
            value={message}
            rows={5}
            onChange={(e) => {
              setMessage(e.target.value);
              setSuccess(false);
            }}
          />
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <div className={styles.formFooter}>
          <button
            onClick={handleSubmit}
            className={styles.submitBtn}
            disabled={submitting}
          >
            {submitting ? "Sending..." : "Send message"}
          </button>
        </div>
      </div>

      {/* Ticket history */}
      {tickets.length > 0 && (
        <div className={styles.ticketSection}>
          <h3 className={styles.ticketSectionHeading}>
            Previous messages ({tickets.length})
          </h3>
          <div className={styles.ticketList}>
            {tickets.map((ticket) => (
              <div key={ticket.id} className={styles.ticketCard}>
                <div className={styles.ticketTop}>
                  <div className={styles.ticketTopLeft}>
                    <span className={styles.ticketSubject}>
                      {ticket.subject}
                    </span>
                    <span className={styles.ticketDate}>
                      {format(new Date(ticket.createdAt), "MMMM d, yyyy")}
                    </span>
                  </div>
                  <span
                    className={`${styles.ticketStatus} ${
                      ticket.status === "OPEN"
                        ? styles.ticketOpen
                        : styles.ticketClosed
                    }`}
                  >
                    {ticket.status === "OPEN" ? "Open" : "Closed"}
                  </span>
                </div>

                <p className={styles.ticketMessage}>{ticket.message}</p>

                {ticket.adminReply && (
                  <div className={styles.adminReply}>
                    <div className={styles.adminReplyHeader}>
                      <span className={styles.adminReplyLabel}>
                        Fonts & Footers replied
                      </span>
                      {ticket.repliedAt && (
                        <span className={styles.adminReplyDate}>
                          {format(new Date(ticket.repliedAt), "MMMM d, yyyy")}
                        </span>
                      )}
                    </div>
                    <p className={styles.adminReplyText}>{ticket.adminReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
