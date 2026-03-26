"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import styles from "./ClientBlueprintView.module.css";
import {
  updateSitemapSection,
  createSitemapComment,
} from "@/actions/admin/sitemapActions";

// ── Types ──────────────────────────────────────────────────────────────────

type SitemapStatus = "DRAFT" | "REVIEW" | "APPROVED";

type Comment = {
  id: string;
  authorType: string;
  text: string;
  createdAt: Date;
};

type Section = {
  id: string;
  title: string;
  copy: string | null;
  status: SitemapStatus;
  position: number;
  comments: Comment[];
};

type Page = {
  id: string;
  name: string;
  position: number;
  parentId: string | null;
  sections: Section[];
};

type Props = {
  initialPages: Page[];
};

type ViewMode = "review" | "tree";

// ── Helpers ────────────────────────────────────────────────────────────────

function derivePageStatus(page: Page): SitemapStatus {
  const total = page.sections.length;
  if (total === 0) return "DRAFT";
  const approved = page.sections.filter((s) => s.status === "APPROVED").length;
  const review = page.sections.filter((s) => s.status === "REVIEW").length;
  if (approved === total) return "APPROVED";
  if (review > 0) return "REVIEW";
  return "DRAFT";
}

function sortByPosition<T extends { position: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.position - b.position);
}

// ── Tree node (recursive) ──────────────────────────────────────────────────

function TreePageNode({
  page,
  allPages,
  activePageId,
  onSelect,
}: {
  page: Page;
  allPages: Page[];
  activePageId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const children = sortByPosition(
    allPages.filter((p) => p.parentId === page.id),
  );
  const derived = derivePageStatus(page);
  const approved = page.sections.filter((s) => s.status === "APPROVED").length;
  const total = page.sections.length;
  const isActive = activePageId === page.id;

  const boxClass = [
    styles.treeBox,
    derived === "APPROVED"
      ? styles.treeBoxApproved
      : derived === "REVIEW"
        ? styles.treeBoxReview
        : styles.treeBoxDraft,
    isActive ? styles.treeBoxActive : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.treeNode}>
      <div className={boxClass} onClick={() => onSelect(page.id)}>
        <span className={styles.treeBoxName}>{page.name}</span>
        <span className={styles.treeBoxCount}>
          {approved}/{total}
        </span>
        {children.length > 0 && (
          <button
            className={styles.treeBoxToggle}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
          >
            {open ? "▲" : "▼"}
          </button>
        )}
      </div>

      {children.length > 0 && open && (
        <>
          <div className={styles.treeVLine} />
          <div className={styles.treeChildRow}>
            {children.map((child) => (
              <div key={child.id} className={styles.treeChildCell}>
                <div className={styles.treeVLine} />
                <TreePageNode
                  page={child}
                  allPages={allPages}
                  activePageId={activePageId}
                  onSelect={onSelect}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Tree legend ────────────────────────────────────────────────────────────

function TreeLegend() {
  return (
    <div className={styles.treeLegend}>
      {[
        { cls: "", label: "Not started" },
        { cls: styles.treeLegendDotReview, label: "Ready for review" },
        { cls: styles.treeLegendDotApproved, label: "Approved" },
        { cls: styles.treeLegendDotActive, label: "Selected" },
      ].map(({ cls, label }) => (
        <div key={label} className={styles.treeLegendItem}>
          <div className={`${styles.treeLegendDot} ${cls}`} />
          <span className={styles.treeLegendLabel}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Tree view ──────────────────────────────────────────────────────────────

const SCROLL_AMOUNT = 320;

function TreeView({
  pages,
  activePageId,
  onSelect,
  fullscreen,
  onToggleFullscreen,
}: {
  pages: Page[];
  activePageId: string;
  onSelect: (id: string) => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState);
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState, pages, fullscreen]);

  // Close on Escape
  useEffect(() => {
    if (!fullscreen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onToggleFullscreen();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen, onToggleFullscreen]);

  // Lock body scroll when fullscreen
  useEffect(() => {
    if (fullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [fullscreen]);

  function scrollLeft() {
    scrollRef.current?.scrollBy({ left: -SCROLL_AMOUNT, behavior: "smooth" });
  }

  function scrollRight() {
    scrollRef.current?.scrollBy({ left: SCROLL_AMOUNT, behavior: "smooth" });
  }

  const topLevel = sortByPosition(pages.filter((p) => !p.parentId));

  const content = (
    <>
      <div className={styles.treeToolbar}>
        <TreeLegend />
        <button
          className={styles.fullscreenBtn}
          onClick={onToggleFullscreen}
          aria-label={fullscreen ? "Exit full screen" : "Full screen"}
        >
          {fullscreen ? (
            <>
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
                <polyline points='4 14 10 14 10 20' />
                <polyline points='20 10 14 10 14 4' />
                <line x1='10' y1='14' x2='3' y2='21' />
                <line x1='21' y1='3' x2='14' y2='10' />
              </svg>
              Exit Full Screen
            </>
          ) : (
            <>
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
                <polyline points='15 3 21 3 21 9' />
                <polyline points='9 21 3 21 3 15' />
                <line x1='21' y1='3' x2='14' y2='10' />
                <line x1='3' y1='21' x2='10' y2='14' />
              </svg>
              Full Screen
            </>
          )}
        </button>
      </div>

      <div className={styles.treeScrollWrapper}>
        <button
          className={`${styles.treeNavBtn} ${styles.treeNavBtnLeft} ${!canScrollLeft ? styles.treeNavBtnHidden : ""}`}
          onClick={scrollLeft}
          aria-label='Scroll left'
          tabIndex={canScrollLeft ? 0 : -1}
        >
          ←
        </button>

        <div className={styles.treeViewScroll} ref={scrollRef}>
          <div className={styles.treeTopRow}>
            {topLevel.length === 0 ? (
              <div className={styles.treeEmpty}>
                No pages in this blueprint yet.
              </div>
            ) : (
              topLevel.map((page) => (
                <TreePageNode
                  key={page.id}
                  page={page}
                  allPages={pages}
                  activePageId={activePageId}
                  onSelect={onSelect}
                />
              ))
            )}
          </div>
        </div>

        <button
          className={`${styles.treeNavBtn} ${styles.treeNavBtnRight} ${!canScrollRight ? styles.treeNavBtnHidden : ""} ${canScrollLeft ? styles.treeNavBtnRightScrolled : ""}`}
          onClick={scrollRight}
          aria-label='Scroll right'
          tabIndex={canScrollRight ? 0 : -1}
        >
          →
        </button>
      </div>

      <div className={styles.treeNote}>
        {fullscreen
          ? "Click any page to select it, then close full screen to approve sections. Press Esc to exit."
          : "Click any page to select it, then switch to Review to approve sections."}
      </div>
    </>
  );

  if (fullscreen) {
    return (
      <div className={styles.fullscreenOverlay}>
        <div className={styles.fullscreenInner}>{content}</div>
      </div>
    );
  }

  return <div className={styles.treeViewContainer}>{content}</div>;
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ClientBlueprintView({ initialPages }: Props) {
  const router = useRouter();

  const [pages, setPages] = useState<Page[]>(initialPages);
  const [activePageId, setActivePageId] = useState<string>(
    initialPages[0]?.id ?? "",
  );
  const [viewMode, setViewMode] = useState<ViewMode>("review");
  const [treeFullscreen, setTreeFullscreen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [approvingSection, setApprovingSection] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {},
  );
  const [postingComment, setPostingComment] = useState<string | null>(null);

  useEffect(() => {
    setPages(initialPages);
  }, [initialPages]);

  const topLevelPages = sortByPosition(pages.filter((p) => !p.parentId));
  const activePage = pages.find((p) => p.id === activePageId) ?? pages[0];

  const totalSections = pages.reduce((acc, p) => acc + p.sections.length, 0);
  const approvedSections = pages.reduce(
    (acc, p) => acc + p.sections.filter((s) => s.status === "APPROVED").length,
    0,
  );
  const allApproved = totalSections > 0 && approvedSections === totalSections;

  async function handleApprove(sectionId: string) {
    setApprovingSection(sectionId);
    await updateSitemapSection(sectionId, { status: "APPROVED" });
    setPages((prev) =>
      prev.map((p) =>
        p.id === activePage?.id
          ? {
              ...p,
              sections: p.sections.map((s) =>
                s.id === sectionId ? { ...s, status: "APPROVED" as const } : s,
              ),
            }
          : p,
      ),
    );
    setApprovingSection(null);
    router.refresh();
  }

  async function handleAddComment(sectionId: string) {
    const text = (commentInputs[sectionId] ?? "").trim();
    if (!text) return;
    setPostingComment(sectionId);
    const comment = await createSitemapComment(sectionId, text, "client");
    setPages((prev) =>
      prev.map((p) =>
        p.id === activePage?.id
          ? {
              ...p,
              sections: p.sections.map((s) =>
                s.id === sectionId
                  ? {
                      ...s,
                      comments: [...s.comments, comment as unknown as Comment],
                    }
                  : s,
              ),
            }
          : p,
      ),
    );
    setCommentInputs((prev) => ({ ...prev, [sectionId]: "" }));
    setPostingComment(null);
    router.refresh();
  }

  function handleSelectPage(id: string) {
    setActivePageId(id);
    // If in fullscreen, stay in tree but close fullscreen and switch to review
    if (treeFullscreen) {
      setTreeFullscreen(false);
    }
    setViewMode("review");
  }

  function renderSidebarPages() {
    return topLevelPages.map((page) => {
      const children = sortByPosition(
        pages.filter((p) => p.parentId === page.id),
      );
      const derived = derivePageStatus(page);
      const isActive = activePageId === page.id;

      return (
        <div key={page.id}>
          <button
            className={`${styles.pageItem} ${isActive ? styles.pageItemActive : ""}`}
            onClick={() => handleSelectPage(page.id)}
          >
            <span
              className={`${styles.pageDot} ${
                derived === "APPROVED"
                  ? styles.pageDotApproved
                  : derived === "REVIEW"
                    ? styles.pageDotReview
                    : styles.pageDotDraft
              }`}
            />
            <span className={styles.pageName}>{page.name}</span>
            <span className={styles.pageCount}>
              {page.sections.filter((s) => s.status === "APPROVED").length}/
              {page.sections.length}
            </span>
          </button>

          {children.map((child) => {
            const childDerived = derivePageStatus(child);
            const childActive = activePageId === child.id;
            return (
              <button
                key={child.id}
                className={`${styles.pageItem} ${styles.pageItemSlug} ${childActive ? styles.pageItemActive : ""}`}
                onClick={() => handleSelectPage(child.id)}
              >
                <span className={styles.pageSlugMarker}>└─</span>
                <span
                  className={`${styles.pageDot} ${
                    childDerived === "APPROVED"
                      ? styles.pageDotApproved
                      : childDerived === "REVIEW"
                        ? styles.pageDotReview
                        : styles.pageDotDraft
                  }`}
                />
                <span className={styles.pageName}>{child.name}</span>
                <span className={styles.pageCount}>
                  {child.sections.filter((s) => s.status === "APPROVED").length}
                  /{child.sections.length}
                </span>
              </button>
            );
          })}
        </div>
      );
    });
  }

  const pageApprovedCount =
    activePage?.sections.filter((s) => s.status === "APPROVED").length ?? 0;
  const pageTotalCount = activePage?.sections.length ?? 0;
  const pageProgress =
    pageTotalCount > 0
      ? Math.round((pageApprovedCount / pageTotalCount) * 100)
      : 0;

  return (
    <div className={styles.wrapper}>
      {/* Progress banner */}
      <div
        className={allApproved ? styles.bannerComplete : styles.bannerPending}
      >
        <div className={styles.bannerLeft}>
          {allApproved ? (
            <>
              <span className={styles.bannerIcon}>✓</span>
              <span className={styles.bannerText}>
                All sections approved — blueprint complete.
              </span>
            </>
          ) : (
            <span className={styles.bannerText}>
              {approvedSections} of {totalSections} sections approved across all
              pages.
            </span>
          )}
        </div>
        <span className={styles.bannerCount}>
          {approvedSections}/{totalSections}
        </span>
      </div>

      <div className={styles.layout}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarLabel}>Pages</div>
          {renderSidebarPages()}
        </div>

        {/* Main */}
        <div className={styles.main}>
          {/* View toggle */}
          <div className={styles.viewToggleBar}>
            <div className={styles.viewToggleGroup}>
              <button
                className={`${styles.viewToggleBtn} ${viewMode === "review" ? styles.viewToggleBtnActive : ""}`}
                onClick={() => setViewMode("review")}
              >
                Review
              </button>
              <button
                className={`${styles.viewToggleBtn} ${viewMode === "tree" ? styles.viewToggleBtnActive : ""}`}
                onClick={() => setViewMode("tree")}
              >
                Tree View
              </button>
            </div>
            {viewMode === "tree" && (
              <span className={styles.viewToggleHint}>
                Click any page to review it
              </span>
            )}
          </div>

          {viewMode === "tree" && (
            <TreeView
              pages={pages}
              activePageId={activePageId}
              onSelect={handleSelectPage}
              fullscreen={treeFullscreen}
              onToggleFullscreen={() => setTreeFullscreen((v) => !v)}
            />
          )}

          {viewMode === "review" && (
            <>
              {!activePage ? (
                <div className={styles.emptyMain}>
                  Select a page from the sidebar.
                </div>
              ) : (
                <>
                  <div className={styles.mainHeader}>
                    <div className={styles.mainHeaderTop}>
                      <div className={styles.mainTitleGroup}>
                        <h2 className={styles.mainTitle}>{activePage.name}</h2>
                        {activePage.parentId && (
                          <span className={styles.slugBadge}>Slug page</span>
                        )}
                      </div>
                      {pageApprovedCount === pageTotalCount &&
                      pageTotalCount > 0 ? (
                        <span className={styles.pageApprovedBadge}>
                          ✓ Page approved
                        </span>
                      ) : (
                        <span className={styles.pageProgressBadge}>
                          {pageApprovedCount}/{pageTotalCount} approved
                        </span>
                      )}
                    </div>
                    <div className={styles.progressRow}>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={
                            {
                              "--progress-width": `${pageProgress}%`,
                            } as React.CSSProperties
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles.sectionsList}>
                    {activePage.sections.length === 0 && (
                      <p className={styles.emptySections}>
                        No sections have been added to this page yet.
                      </p>
                    )}

                    {sortByPosition(activePage.sections).map((section) => {
                      const isOpen = !!openSections[section.id];
                      const isApproving = approvingSection === section.id;
                      const isApproved = section.status === "APPROVED";

                      return (
                        <div
                          key={section.id}
                          className={`${styles.sectionCard} ${isApproved ? styles.sectionCardApproved : ""}`}
                        >
                          <div
                            className={styles.sectionHeader}
                            onClick={() =>
                              setOpenSections((prev) => ({
                                ...prev,
                                [section.id]: !prev[section.id],
                              }))
                            }
                          >
                            <span
                              className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
                            >
                              ▶
                            </span>
                            <span className={styles.sectionTitle}>
                              {section.title}
                            </span>
                            {isApproved ? (
                              <span className={styles.approvedPill}>
                                ✓ Approved
                              </span>
                            ) : section.status === "REVIEW" ? (
                              <span className={styles.reviewPill}>
                                Ready for review
                              </span>
                            ) : (
                              <span className={styles.draftPill}>Draft</span>
                            )}
                          </div>

                          {isOpen && (
                            <div className={styles.sectionBody}>
                              <div className={styles.copyBlock}>
                                <div className={styles.copyLabel}>
                                  Content Direction
                                </div>
                                {section.copy?.trim() ? (
                                  <div className={styles.copyText}>
                                    {section.copy}
                                  </div>
                                ) : (
                                  <p className={styles.copyEmpty}>
                                    Copy notes haven&apos;t been added yet.
                                  </p>
                                )}
                              </div>

                              {section.comments.length > 0 && (
                                <div className={styles.comments}>
                                  {section.comments.map((c) => (
                                    <div
                                      key={c.id}
                                      className={`${styles.comment} ${
                                        c.authorType === "client"
                                          ? styles.commentClient
                                          : styles.commentAdmin
                                      }`}
                                    >
                                      <div className={styles.commentMeta}>
                                        {c.authorType === "client"
                                          ? "You"
                                          : "Fonts & Footers"}{" "}
                                        ·{" "}
                                        {format(
                                          new Date(c.createdAt),
                                          "MMM d, h:mm a",
                                        )}
                                      </div>
                                      <div className={styles.commentText}>
                                        {c.text}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className={styles.commentRow}>
                                <input
                                  className={styles.commentInput}
                                  placeholder='Leave a note or feedback...'
                                  value={commentInputs[section.id] ?? ""}
                                  onChange={(e) =>
                                    setCommentInputs((prev) => ({
                                      ...prev,
                                      [section.id]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      handleAddComment(section.id);
                                  }}
                                  disabled={postingComment === section.id}
                                />
                                <button
                                  className={styles.btnSecondary}
                                  onClick={() => handleAddComment(section.id)}
                                  disabled={postingComment === section.id}
                                >
                                  {postingComment === section.id
                                    ? "Sending..."
                                    : "Send"}
                                </button>
                              </div>

                              {!isApproved && (
                                <div className={styles.approveRow}>
                                  <button
                                    className={styles.btnApprove}
                                    onClick={() => handleApprove(section.id)}
                                    disabled={isApproving}
                                  >
                                    {isApproving
                                      ? "Approving..."
                                      : "Approve this section →"}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
