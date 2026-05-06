"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import styles from "./TopLoadingBar.module.css";

export default function TopLoadingBar() {
  const pathname = usePathname();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);

  const navigatingRef = useRef(false);
  const previousPathRef = useRef(pathname);
  const trickleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const safetyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // finish() must be declared first because start() references it
  const finish = useCallback(() => {
    if (trickleIntervalRef.current) clearInterval(trickleIntervalRef.current);
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

    navigatingRef.current = false;
    setWidth(100);

    cleanupTimeoutRef.current = setTimeout(() => {
      setVisible(false);
      cleanupTimeoutRef.current = setTimeout(() => {
        setWidth(0);
      }, 300);
    }, 250);
  }, []);

  const start = useCallback(() => {
    if (trickleIntervalRef.current) clearInterval(trickleIntervalRef.current);
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    if (cleanupTimeoutRef.current) clearTimeout(cleanupTimeoutRef.current);

    navigatingRef.current = true;
    setVisible(true);
    setWidth(15);

    trickleIntervalRef.current = setInterval(() => {
      setWidth((w) => {
        if (w >= 90) return w;
        const remaining = 90 - w;
        return w + remaining * 0.06;
      });
    }, 200);

    safetyTimeoutRef.current = setTimeout(() => {
      if (navigatingRef.current) finish();
    }, 8000);
  }, [finish]);

  // Detect link clicks via event delegation
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as HTMLElement;
      const link = target.closest("a");
      if (!link) return;
      if (link.target === "_blank") return;

      const href = link.getAttribute("href");
      if (!href) return;
      if (href.startsWith("#")) return;
      if (href.startsWith("mailto:") || href.startsWith("tel:")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }

      start();
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [start]);

  // Finish the bar when the route actually changes
  useEffect(() => {
    if (previousPathRef.current !== pathname && navigatingRef.current) {
      queueMicrotask(finish);
    }
    previousPathRef.current = pathname;
  }, [pathname, finish]);

  // Cleanup any pending timers on unmount
  useEffect(() => {
    return () => {
      if (trickleIntervalRef.current) clearInterval(trickleIntervalRef.current);
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
      if (cleanupTimeoutRef.current) clearTimeout(cleanupTimeoutRef.current);
    };
  }, []);

  return (
    <div
      className={`${styles.bar} ${visible ? styles.visible : ""}`}
      aria-hidden='true'
    >
      <div className={styles.progress} style={{ width: `${width}%` }} />
    </div>
  );
}
