import styles from "./PriorityBadge.module.css";
import type { LeadPriority } from "@/lib/leadPriority";

type Props = {
  priority: LeadPriority;
  showLabel?: boolean;
};

export default function PriorityBadge({ priority, showLabel = true }: Props) {
  return (
    <span
      className={`${styles.badge} ${styles[`priority${priority}`]}`}
      title={`${priority} priority lead`}
    >
      {showLabel ? `${priority} PRIORITY` : priority}
    </span>
  );
}
