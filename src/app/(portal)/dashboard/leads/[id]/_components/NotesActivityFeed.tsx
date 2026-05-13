"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./LeadEnhancements.module.css";

type Activity = {
  id: string;
  activityType: string;
  description: string | null;
  createdAt: string | Date;
};

type Props = { leadId: string; activities: Activity[] };

const TYPE_LABELS: Record<string, string> = {
  CREATED: "Lead created",
  STATUS_CHANGED: "Status changed",
  NOTE_ADDED: "Note",
  SCRIPT_GENERATED: "Script generated",
  CONTACTED: "Contacted",
  EMAIL_SENT: "Email sent",
  CALL_MADE: "Call made",
  LINKEDIN_SENT: "LinkedIn message",
  SMS_SENT: "SMS sent",
  IN_PERSON_VISIT: "In-person visit",
  SNOOZED: "Snoozed",
  REMINDER_SENT: "Reminder sent",
  WON: "Won",
  DEAD: "Marked dead",
};

const TYPE_ICON: Record<string, string> = {
  NOTE_ADDED: "💬",
  EMAIL_SENT: "✉",
  CALL_MADE: "☎",
  LINKEDIN_SENT: "in",
  SMS_SENT: "✉",
  IN_PERSON_VISIT: "📍",
};

function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotesActivityFeed({ leadId, activities }: Props) {
  const router = useRouter();
  const [noteText, setNoteText] = useState("");
  const [posting, setPosting] = useState(false);

  async function postNote() {
    if (!noteText.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: noteText }),
      });
      if (res.ok) {
        setNoteText("");
        router.refresh();
      } else {
        const body = await res.json();
        console.error("Failed to add note", body);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  }

  return (
    <section className={styles.feedSection}>
      {/* <h2 className={styles.feedTitle}>Activity & Notes</h2> */}

      <div className={styles.noteComposer}>
        <textarea
          className={styles.noteInput}
          placeholder='Add a note — what happened on the call, what they said, what to remember...'
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={3}
        />
        <button
          type='button'
          onClick={postNote}
          disabled={posting || !noteText.trim()}
          className={styles.noteSubmit}
        >
          {posting ? "Saving..." : "Add note"}
        </button>
      </div>

      <ol className={styles.timeline}>
        {activities.length === 0 ? (
          <li className={styles.timelineEmpty}>
            No activity yet. Add a note above or log an outreach attempt from
            the sidebar.
          </li>
        ) : (
          activities.map((a) => (
            <li key={a.id} className={styles.timelineItem}>
              <span className={styles.timelineIcon} aria-hidden>
                {TYPE_ICON[a.activityType] ?? "·"}
              </span>
              <div className={styles.timelineBody}>
                <header className={styles.timelineHeader}>
                  <span className={styles.timelineType}>
                    {TYPE_LABELS[a.activityType] ?? a.activityType}
                  </span>
                  <span className={styles.timelineTime}>
                    {formatRelativeTime(a.createdAt)}
                  </span>
                </header>
                {a.description && (
                  <p className={styles.timelineDesc}>{a.description}</p>
                )}
              </div>
            </li>
          ))
        )}
      </ol>
    </section>
  );
}
