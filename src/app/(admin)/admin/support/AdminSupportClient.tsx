"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { replyToSupportTicket } from "@/actions/admin/replyToSupportTicket";
import styles from "./AdminSupportClient.module.css";

type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  adminReply: string | null;
  repliedAt: Date | null;
  createdAt: Date;
  clientProfile: {
    businessName: string;
    user: { name: string | null; email: string };
  };
};

export default function AdminSupportClient({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const openTickets = tickets.filter((t) => t.status === "OPEN");
  const closedTickets = tickets.filter((t) => t.status === "CLOSED");

  const handleReply = async (ticketId: string) => {
    if (!replyText.trim()) return;
    setSubmitting(true);

    await replyToSupportTicket({ ticketId, reply: replyText });

    setReplyingTo(null);
    setReplyText("");
    setSubmitting(false);
    router.refresh();
  };

  const TicketCard = ({ ticket }: { ticket: Ticket }) => (
    <div className={styles.ticketCard}>
      <div className={styles.ticketTop}>
        <div className={styles.ticketTopLeft}>
          <div className={styles.ticketClient}>
            <span className={styles.ticketBusiness}>
              {ticket.clientProfile.businessName}
            </span>
            <span className={styles.ticketEmail}>
              {ticket.clientProfile.user.email}
            </span>
          </div>
          <h3 className={styles.ticketSubject}>{ticket.subject}</h3>
          <span className={styles.ticketDate}>
            {format(new Date(ticket.createdAt), "MMMM d, yyyy 'at' h:mm a")}
          </span>
        </div>
        <span
          className={`${styles.ticketStatus} ${
            ticket.status === "OPEN" ? styles.statusOpen : styles.statusClosed
          }`}
        >
          {ticket.status === "OPEN" ? "Open" : "Closed"}
        </span>
      </div>

      <p className={styles.ticketMessage}>{ticket.message}</p>

      {ticket.adminReply && (
        <div className={styles.existingReply}>
          <div className={styles.replyHeader}>
            <span className={styles.replyLabel}>Your reply</span>
            {ticket.repliedAt && (
              <span className={styles.replyDate}>
                {format(new Date(ticket.repliedAt), "MMM d, yyyy")}
              </span>
            )}
          </div>
          <p className={styles.replyText}>{ticket.adminReply}</p>
        </div>
      )}

      {ticket.status === "OPEN" && (
        <>
          {replyingTo === ticket.id ? (
            <div className={styles.replyForm}>
              <textarea
                className={styles.textarea}
                placeholder='Write your reply...'
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                autoFocus
              />
              <div className={styles.replyBtns}>
                <button
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyText("");
                  }}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReply(ticket.id)}
                  className={styles.sendBtn}
                  disabled={submitting || !replyText.trim()}
                >
                  {submitting ? "Sending..." : "Send reply"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setReplyingTo(ticket.id);
                setReplyText("");
              }}
              className={styles.replyBtn}
            >
              Reply
            </button>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={`${styles.heading} h2`}>Support</h1>
        <p className={styles.subheading}>
          {openTickets.length} open · {closedTickets.length} closed
        </p>
      </div>

      {tickets.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No support tickets yet.</p>
        </div>
      ) : (
        <>
          {openTickets.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>
                Open ({openTickets.length})
              </h2>
              <div className={styles.ticketList}>
                {openTickets.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
              </div>
            </div>
          )}

          {closedTickets.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionHeading}>
                Closed ({closedTickets.length})
              </h2>
              <div className={styles.ticketList}>
                {closedTickets.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
