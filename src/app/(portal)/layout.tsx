"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import styles from "./PortalLayout.module.css";

const navItems = [
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
  {
    href: "/dashboard/documents",
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
        <polyline points='10 9 9 9 8 9' />
      </svg>
    ),
  },
  {
    href: "/dashboard/questionnaire",
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
    href: "/dashboard/assets",
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
    href: "/dashboard/design-selection",
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
        <rect x='3' y='3' width='18' height='18' rx='2' />
        <circle cx='8.5' cy='8.5' r='1.5' />
        <polyline points='21 15 16 10 5 21' />
      </svg>
    ),
  },
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
    href: "/dashboard/change-requests",
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
}: {
  children: React.ReactNode;
}) {
  // Collapsed by default on mobile (<=768px), expanded on desktop
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= 568;
  });

  const pathname = usePathname();
  const { data: session } = useSession();
  const userName = session?.user?.name;
  const userEmail = session?.user?.email;
  const initials = getInitials(userName);

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
              <span className={styles.brandName}>Fonts & Footers</span>
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
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {!collapsed && (
                  <span className={styles.navLabel}>{item.label}</span>
                )}
                {collapsed && (
                  <span className={styles.tooltip}>{item.label}</span>
                )}
              </Link>
            );
          })}
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
        {/* Top bar */}
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

        {/* Content */}
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
