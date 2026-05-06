"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import styles from "./PortalLayout.module.css";
import Logo from "@/components/shared/Logo/Logo";

type ProductAccessProp = {
  hasWebsite: boolean;
  hasLeads: boolean;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

type NavGroup = {
  groupLabel: string;
  productKey: "website" | "leads" | null;
  items: NavItem[];
};

// ── Top-level items (always visible) ──
const topNav: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg
        width='20'
        height='20'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <rect x='3' y='3' width='7' height='7' />
        <rect x='14' y='3' width='7' height='7' />
        <rect x='3' y='14' width='7' height='7' />
        <rect x='14' y='14' width='7' height='7' />
      </svg>
    ),
  },
];

// ── Grouped product nav (conditionally shown) ──
const productGroups: NavGroup[] = [
  {
    groupLabel: "Website",
    productKey: "website",
    items: [
      {
        href: "/dashboard/website",
        label: "Project Status",
        icon: (
          <svg
            width='20'
            height='20'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <polyline points='9 11 12 14 22 4' />
            <path d='M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' />
          </svg>
        ),
      },
      {
        href: "/dashboard/website/blueprint",
        label: "Blueprint",
        icon: (
          <svg
            width='20'
            height='20'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <rect x='3' y='3' width='18' height='18' rx='2' />
            <line x1='3' y1='9' x2='21' y2='9' />
            <line x1='9' y1='21' x2='9' y2='9' />
          </svg>
        ),
      },
      {
        href: "/dashboard/website/documents",
        label: "Documents",
        icon: (
          <svg
            width='20'
            height='20'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
            <polyline points='14 2 14 8 20 8' />
            <line x1='16' y1='13' x2='8' y2='13' />
            <line x1='16' y1='17' x2='8' y2='17' />
          </svg>
        ),
      },
      {
        href: "/dashboard/website/questionnaire",
        label: "Questionnaire",
        icon: (
          <svg
            width='20'
            height='20'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <circle cx='12' cy='12' r='10' />
            <path d='M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3' />
            <line x1='12' y1='17' x2='12.01' y2='17' />
          </svg>
        ),
      },
      {
        href: "/dashboard/website/assets",
        label: "Brand Assets",
        icon: (
          <svg
            width='20'
            height='20'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
            <circle cx='8.5' cy='8.5' r='1.5' />
            <polyline points='21 15 16 10 5 21' />
          </svg>
        ),
      },
      {
        href: "/dashboard/website/design-selection",
        label: "Design Selection",
        icon: (
          <svg
            width='20'
            height='20'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M12 19l7-7 3 3-7 7-3-3z' />
            <path d='M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z' />
            <path d='M2 2l7.586 7.586' />
            <circle cx='11' cy='11' r='2' />
          </svg>
        ),
      },
      {
        href: "/dashboard/website/change-requests",
        label: "Change Requests",
        icon: (
          <svg
            width='20'
            height='20'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' />
            <path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' />
          </svg>
        ),
      },
    ],
  },
  {
    groupLabel: "Leads",
    productKey: "leads",
    items: [
      {
        href: "/dashboard/leads",
        label: "Lead Feed",
        icon: (
          <svg
            width='20'
            height='20'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M22 11.08V12a10 10 0 1 1-5.93-9.14' />
            <polyline points='22 4 12 14.01 9 11.01' />
          </svg>
        ),
      },
      {
        href: "/dashboard/leads/search",
        label: "Search",
        icon: (
          <svg
            width='20'
            height='20'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <circle cx='11' cy='11' r='8' />
            <line x1='21' y1='21' x2='16.65' y2='16.65' />
          </svg>
        ),
      },
      {
        href: "/dashboard/leads/favorites",
        label: "Favorites",
        icon: (
          <svg
            width='20'
            height='20'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' />
          </svg>
        ),
      },
      {
        href: "/dashboard/leads/pipeline",
        label: "Pipeline",
        icon: (
          <svg
            width='20'
            height='20'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M3 3h18v4H3zM3 11h18v4H3zM3 19h18v2H3z' />
          </svg>
        ),
      },
      {
        href: "/dashboard/leads/saved",
        label: "Saved Leads",
        icon: (
          <svg
            width='20'
            height='20'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z' />
          </svg>
        ),
      },
      {
        href: "/dashboard/leads/settings",
        label: "Lead Settings",
        icon: (
          <svg
            width='20'
            height='20'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <circle cx='12' cy='12' r='3' />
            <path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z' />
          </svg>
        ),
      },
    ],
  },
];

// ── Bottom items (always visible) ──
const bottomNav: NavItem[] = [
  {
    href: "/dashboard/billing",
    label: "Billing",
    icon: (
      <svg
        width='20'
        height='20'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <rect x='1' y='4' width='22' height='16' rx='2' ry='2' />
        <line x1='1' y1='10' x2='23' y2='10' />
      </svg>
    ),
  },
  {
    href: "/dashboard/support",
    label: "Support",
    icon: (
      <svg
        width='20'
        height='20'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
      </svg>
    ),
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    icon: (
      <svg
        width='20'
        height='20'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
        <circle cx='12' cy='7' r='4' />
      </svg>
    ),
  },
];

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function PortalLayout({
  children,
  access,
}: {
  children: React.ReactNode;
  access: ProductAccessProp;
}) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= 568;
  });

  const pathname = usePathname();
  const { data: session } = useSession();
  const userName = session?.user?.name;
  const userEmail = session?.user?.email;
  const initials = getInitials(userName);

  // ── Determine which product groups to show ──
  const visibleGroups = productGroups.filter((group) => {
    if (group.productKey === "website") return access.hasWebsite;
    if (group.productKey === "leads") return access.hasLeads;
    return true;
  });

  const isItemActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const renderNavItem = (item: NavItem) => {
    const isActive = isItemActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
      >
        <span className={styles.navIcon}>{item.icon}</span>
        {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
        {collapsed && <span className={styles.tooltip}>{item.label}</span>}
      </Link>
    );
  };

  return (
    <div className={styles.shell}>
      {/* SIDEBAR */}
      <aside
        className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}
      >
        {/* Brand */}
        <div className={styles.brand}>
          {!collapsed && (
            <div className={styles.brandText}>
              <span className={styles.brandName}>
                <Logo variant='black' />
              </span>
              <span className={styles.brandSub}>Client Portal</span>
            </div>
          )}
          <button
            className={styles.collapseBtn}
            onClick={() => setCollapsed(!collapsed)}
            aria-label='Toggle sidebar'
          >
            <svg
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className={`${styles.collapseIcon} ${collapsed ? styles.collapseIconFlipped : ""}`}
            >
              <polyline points='15 18 9 12 15 6' />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className={styles.nav}>
          {/* Top-level (Dashboard) */}
          {topNav.map(renderNavItem)}

          {/* Grouped product items (only shown if subscribed) */}
          {visibleGroups.map((group) => (
            <div key={group.groupLabel} className={styles.navGroup}>
              {!collapsed && (
                <div className={styles.navGroupLabel}>{group.groupLabel}</div>
              )}
              {collapsed && <div className={styles.navGroupDivider} />}
              {group.items.map(renderNavItem)}
            </div>
          ))}

          {/* Spacer between product groups and bottom items */}
          <div className={styles.navSpacer}>
            {!collapsed && <div className={styles.navGroupLabel}>Account</div>}
            {collapsed && <div className={styles.navGroupDivider} />}
            {bottomNav.map(renderNavItem)}
          </div>
        </nav>

        {/* User + sign out */}
        <div className={styles.sidebarBottom}>
          {!collapsed && (
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>{initials}</div>
              <div className={styles.userText}>
                <span className={styles.userName}>{userName ?? "Client"}</span>
                <span className={styles.userEmail}>{userEmail ?? ""}</span>
              </div>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={styles.signOutBtn}
          >
            <span className={styles.navIcon}>
              <svg
                width='20'
                height='20'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
                <polyline points='16 17 21 12 16 7' />
                <line x1='21' y1='12' x2='9' y2='12' />
              </svg>
            </span>
            {!collapsed && <span className={styles.navLabel}>Sign out</span>}
            {collapsed && <span className={styles.tooltip}>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className={styles.main}>
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <div className={styles.pageIndicator}>
              <div className={styles.dot} />
              <span className={styles.pageIndicatorText}>Client Portal</span>
            </div>
          </div>
          <div className={styles.topbarRight}>
            <div className={styles.avatar}>{initials}</div>
          </div>
        </div>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
