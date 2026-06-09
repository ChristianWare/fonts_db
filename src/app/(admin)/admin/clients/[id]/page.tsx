import { getClientById } from "@/actions/admin/getClientById";
import { notFound } from "next/navigation";
import Link from "next/link";
import styles from "./ClientChooser.module.css";

const LEADS_PRICE_CENTS = 12500;

const productMeta = {
  WEBSITE: {
    number: "Product 01",
    label: "Custom Website",
    desc: "Onboarding tracker, agreement, blueprint, assets, design, and billing.",
  },
  LEADS: {
    number: "Product 02",
    label: "Leads Tool",
    desc: "Subscription status, market settings, and leads invoices.",
  },
} as const;

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  const now = new Date();
  const subscriptions = client.subscriptions ?? [];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href='/admin/clients' className={styles.backBtn}>
            ← Clients
          </Link>
          <div className={styles.clientMeta}>
            <div className={styles.clientAvatar}>
              {(client.user.name ?? "?")[0].toUpperCase()}
            </div>
            <div>
              <h1 className='h2'>{client.businessName}</h1>
              <p className={styles.clientEmail}>{client.user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <p className={styles.subhead}>
        Choose a product to view its details and billing.
      </p>

      {/* Product chooser */}
      <div className={styles.productGrid}>
        {(["WEBSITE", "LEADS"] as const).map((productType) => {
          const sub =
            subscriptions.find((s) => s.productType === productType) ?? null;
          const meta = productMeta[productType];
          const slug = productType === "WEBSITE" ? "website" : "leads";

          const inTrial = !!sub?.trialEndsAt && new Date(sub.trialEndsAt) > now;
          const isActive = sub?.status === "ACTIVE";
          const isPastDue = sub?.status === "PAST_DUE";
          const isCancelled = sub?.status === "CANCELLED";
          const isPaid = (sub?.planAmountCents ?? 0) > 0;

          // Website counts as "engaged" once advanced past REGISTERED even
          // without a sub yet.
          const websiteEngaged =
            productType === "WEBSITE" &&
            (!!sub || client.onboardingStage !== "REGISTERED");

          let dotClass = styles.dotInactive;
          let statusText = "Not Enrolled";
          if (inTrial) {
            dotClass = styles.dotTrial;
            statusText = "Free Trial";
          } else if (isActive) {
            dotClass = styles.dotActive;
            statusText = "Active";
          } else if (isPastDue) {
            dotClass = styles.dotPastDue;
            statusText = "Past Due";
          } else if (isCancelled) {
            dotClass = styles.dotInactive;
            statusText = "Cancelled";
          } else if (websiteEngaged) {
            dotClass = styles.dotPending;
            statusText = "In Onboarding";
          }

          const priceText = !sub
            ? productType === "WEBSITE"
              ? `${formatCents(client.monthlyAmountCents)}/mo`
              : `${formatCents(LEADS_PRICE_CENTS)}/mo`
            : `${formatCents(sub.planAmountCents)}/mo`;

          return (
            <Link
              key={productType}
              href={`/admin/clients/${client.id}/${slug}`}
              className={`${styles.productCard} ${styles.productCardClickable}`}
            >
              <div className={styles.productCardTop}>
                <div className={styles.productStatus}>
                  <span className={`${styles.statusDot} ${dotClass}`} />
                  <span className={styles.statusLabel}>{statusText}</span>
                </div>
                <span className={styles.productPrice}>{priceText}</span>
              </div>
              <div className={styles.productCardMain}>
                <span className={styles.productLabel}>{meta.number}</span>
                <h3 className={styles.productTitle}>{meta.label}</h3>
                <p className={styles.productDesc}>{meta.desc}</p>
              </div>
              <div className={styles.productCardBottom}>
                <span className={styles.cardCta}>
                  View {meta.label}
                  <svg
                    width='14'
                    height='14'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  >
                    <line x1='5' y1='12' x2='19' y2='12' />
                    <polyline points='12 5 19 12 12 19' />
                  </svg>
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
