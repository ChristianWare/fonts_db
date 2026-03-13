"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import styles from "./AdminLayout.module.css";

const navItems = [
  {
    href: "/admin",
    label: "Overview",
    icon: (
      <svg
        width='16'
        height='16'
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
    href: "/admin/clients",
    label: "Clients",
    icon: (
      <svg
        width='16'
        height='16'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
        <circle cx='9' cy='7' r='4' />
        <path d='M23 21v-2a4 4 0 0 0-3-3.87' />
        <path d='M16 3.13a4 4 0 0 1 0 7.75' />
      </svg>
    ),
  },
  {
    href: "/admin/change-requests",
    label: "Change Requests",
    icon: (
      <svg
        width='16'
        height='16'
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
    href: "/admin/support",
    label: "Support",
    icon: (
      <svg
        width='16'
        height='16'
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
];

function getInitials(name?: string | null) {
  if (!name) return "A";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const userName = session?.user?.name;
  const initials = getInitials(userName);

  return (
    <div className={styles.shell}>
      <aside
        className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}
      >
        {/* Brand */}
        <div className={styles.brand}>
          {!collapsed && (
            <div className={styles.brandText}>
              <span className={styles.brandName}>F&F</span>
              <span className={styles.brandSub}>Admin</span>
            </div>
          )}
          <button
            className={styles.collapseBtn}
            onClick={() => setCollapsed(!collapsed)}
            aria-label='Toggle sidebar'
          >
            <svg
              width='14'
              height='14'
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
              item.href === "/admin"
                ? pathname === "/admin"
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

        {/* Bottom */}
        <div className={styles.sidebarBottom}>
          {!collapsed && (
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>{initials}</div>
              <div className={styles.userText}>
                <span className={styles.userName}>{userName ?? "Admin"}</span>
                <span className={styles.userRole}>Administrator</span>
              </div>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={styles.signOutBtn}
          >
            <span className={styles.navIcon}>
              <svg
                width='16'
                height='16'
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

      <main className={styles.main}>
        <div className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <span className={styles.topbarBrand}>Fonts & Footers</span>
            <span className={styles.topbarDivider}>/</span>
            <span className={styles.topbarSection}>Admin Portal</span>
          </div>
          <div className={styles.adminBadge}>Administrator</div>
        </div>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
