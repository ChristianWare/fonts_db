"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import styles from "./BlueprintTab.module.css";
import Modal from "@/components/shared/Modal/Modal";
import {
  createSitemapPage,
  deleteSitemapPage,
  deleteAllClientSitemapPages,
  reorderSitemapPages,
  reparentSitemapPage,
  createSitemapSection,
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
  clientId: string;
  initialPages: Page[];
};

type ViewMode = "edit" | "tree";

type ModalState =
  | { type: "deletePage"; pageId: string; pageName: string }
  | { type: "startOver" }
  | { type: "reparent"; pageId: string; pageName: string }
  | null;

// ── Default page names ─────────────────────────────────────────────────────

const DEFAULT_PAGE_NAMES = [
  "Home",
  "Airport Transfers",
  "Corporate Accounts",
  "Events & Special Occasions",
  "Hourly / As-Directed",
  "Fleet",
  "Service Areas",
  "About",
  "Contact",
];

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

function statusLabel(s: SitemapStatus) {
  return s === "APPROVED" ? "Approved" : s === "REVIEW" ? "In Review" : "Draft";
}

function sortByPosition(pages: Page[]) {
  return [...pages].sort((a, b) => a.position - b.position);
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

function TreeLegend() {
  return (
    <div className={styles.treeLegend}>
      {[
        { cls: "", label: "Draft" },
        { cls: styles.treeLegendDotReview, label: "In Review" },
        { cls: styles.treeLegendDotApproved, label: "Approved" },
        { cls: styles.treeLegendDotActive, label: "Active page" },
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
        {/* Left button */}
        <button
          className={`${styles.treeNavBtn} ${styles.treeNavBtnLeft} ${!canScrollLeft ? styles.treeNavBtnHidden : ""}`}
          onClick={scrollLeft}
          aria-label='Scroll left'
          tabIndex={canScrollLeft ? 0 : -1}
        >
          ←
        </button>

        {/* Tree content */}
        <div className={styles.treeViewScroll} ref={scrollRef}>
          <div className={styles.treeTopRow}>
            {topLevel.length === 0 ? (
              <div className={styles.treeEmpty}>
                No pages yet. Switch to Edit to add pages.
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

        {/* Right button */}
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
          ? "Click any page to select it, then close full screen to edit. Press Esc to exit."
          : "Click any page to select it. Switch to Edit view to update sections and copy."}
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

export default function BlueprintTab({ clientId, initialPages }: Props) {
  const router = useRouter();

  const [pages, setPages] = useState<Page[]>(initialPages);
  const [activePageId, setActivePageId] = useState<string>(
    initialPages[0]?.id ?? "",
  );
  const [viewMode, setViewMode] = useState<ViewMode>("edit");
  const [treeFullscreen, setTreeFullscreen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editCopy, setEditCopy] = useState<string>("");
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {},
  );
  const [postingComment, setPostingComment] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState("");
  const [addingSection, setAddingSection] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [newPageParentId, setNewPageParentId] = useState<string>("");
  const [addingPage, setAddingPage] = useState(false);
  const [deletingPageId, setDeletingPageId] = useState<string | null>(null);
  const [startingOver, setStartingOver] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);

  // Drag state
  const dragId = useRef<string | null>(null);
  const dragGroupKey = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  // Reparent modal state
  const [reparentTargetId, setReparentTargetId] = useState<string>("");

  useEffect(() => {
    setPages(initialPages);
  }, [initialPages]);

  const activePage = pages.find((p) => p.id === activePageId) ?? pages[0];
  const topLevelPages = sortByPosition(pages.filter((p) => !p.parentId));

  // ── Seed / Start Over ──────────────────────────────────────────────────

  async function seedDefaultPages() {
    const created: Page[] = [];
    for (const name of DEFAULT_PAGE_NAMES) {
      const page = await createSitemapPage(clientId, name);
      created.push(page as unknown as Page);
    }
    setPages(created);
    setActivePageId(created[0]?.id ?? "");
    router.refresh();
  }

  async function handleStartOver() {
    setModal(null);
    setStartingOver(true);
    await deleteAllClientSitemapPages(clientId);
    const created: Page[] = [];
    for (const name of DEFAULT_PAGE_NAMES) {
      const page = await createSitemapPage(clientId, name);
      created.push(page as unknown as Page);
    }
    setPages(created);
    setActivePageId(created[0]?.id ?? "");
    setOpenSections({});
    setEditingSection(null);
    setViewMode("edit");
    setStartingOver(false);
    router.refresh();
  }

  // ── Drag and drop ──────────────────────────────────────────────────────

  function handleDragStart(id: string, parentId: string | null) {
    dragId.current = id;
    dragGroupKey.current = parentId ?? "top";
    setDragging(id);
  }

  function handleDragOver(
    e: React.DragEvent,
    overId: string,
    overParentId: string | null,
  ) {
    e.preventDefault();
    const overGroup = overParentId ?? "top";
    if (overGroup !== dragGroupKey.current) return;
    if (overId !== dragId.current) setDragOverId(overId);
  }

  function handleDragEnd() {
    setDragging(null);
    setDragOverId(null);
    dragId.current = null;
    dragGroupKey.current = null;
  }

  async function handleDrop(
    e: React.DragEvent,
    dropId: string,
    dropParentId: string | null,
  ) {
    e.preventDefault();
    const sourceId = dragId.current;
    const group = dragGroupKey.current;
    if (!sourceId || sourceId === dropId) {
      handleDragEnd();
      return;
    }
    const dropGroup = dropParentId ?? "top";
    if (dropGroup !== group) {
      handleDragEnd();
      return;
    }

    const groupPages = sortByPosition(
      pages.filter((p) => (p.parentId ?? "top") === group),
    );
    const sourceIdx = groupPages.findIndex((p) => p.id === sourceId);
    const dropIdx = groupPages.findIndex((p) => p.id === dropId);
    if (sourceIdx === -1 || dropIdx === -1) {
      handleDragEnd();
      return;
    }

    const reordered = [...groupPages];
    const [moved] = reordered.splice(sourceIdx, 1);
    reordered.splice(dropIdx, 0, moved);

    const updates = reordered.map((p, i) => ({ id: p.id, position: i }));

    setPages((prev) =>
      prev.map((p) => {
        const u = updates.find((u) => u.id === p.id);
        return u ? { ...p, position: u.position } : p;
      }),
    );

    handleDragEnd();
    await reorderSitemapPages(updates);
    router.refresh();
  }

  // ── Reparent ───────────────────────────────────────────────────────────

  async function handleReparent() {
    if (!modal || modal.type !== "reparent") return;
    const { pageId } = modal;
    const newParentId = reparentTargetId === "" ? null : reparentTargetId;
    setModal(null);
    await reparentSitemapPage(pageId, newParentId);
    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, parentId: newParentId } : p)),
    );
    router.refresh();
  }

  // ── Page mutations ─────────────────────────────────────────────────────

  async function handleAddPage() {
    const name = newPageName.trim();
    if (!name) return;
    const page = await createSitemapPage(
      clientId,
      name,
      newPageParentId || null,
    );
    const newPage = page as unknown as Page;
    setPages((prev) => [...prev, newPage]);
    setActivePageId(newPage.id);
    setNewPageName("");
    setNewPageParentId("");
    setAddingPage(false);
    router.refresh();
  }

  async function handleDeletePage(pageId: string) {
    setModal(null);
    setDeletingPageId(pageId);
    const children = pages.filter((p) => p.parentId === pageId);
    for (const child of children) {
      await deleteSitemapPage(child.id);
    }
    await deleteSitemapPage(pageId);
    const remaining = pages.filter(
      (p) => p.id !== pageId && p.parentId !== pageId,
    );
    setPages(remaining);
    if (
      activePageId === pageId ||
      children.some((c) => c.id === activePageId)
    ) {
      setActivePageId(remaining[0]?.id ?? "");
    }
    setDeletingPageId(null);
    router.refresh();
  }

  // ── Section mutations ──────────────────────────────────────────────────

  async function handleAddSection() {
    const title = newSectionName.trim();
    if (!title || !activePage) return;
    setAddingSection(true);
    const section = await createSitemapSection(activePage.id, title);
    const newSection = section as unknown as Section;
    setPages((prev) =>
      prev.map((p) =>
        p.id === activePage.id
          ? { ...p, sections: [...p.sections, newSection] }
          : p,
      ),
    );
    setNewSectionName("");
    setAddingSection(false);
    router.refresh();
  }

  async function handleSaveCopy(sectionId: string) {
    setSavingSection(sectionId);
    await updateSitemapSection(sectionId, { copy: editCopy });
    setPages((prev) =>
      prev.map((p) =>
        p.id === activePage?.id
          ? {
              ...p,
              sections: p.sections.map((s) =>
                s.id === sectionId ? { ...s, copy: editCopy } : s,
              ),
            }
          : p,
      ),
    );
    setEditingSection(null);
    setSavingSection(null);
    router.refresh();
  }

  async function handleStatusChange(sectionId: string, status: SitemapStatus) {
    await updateSitemapSection(sectionId, { status });
    setPages((prev) =>
      prev.map((p) =>
        p.id === activePage?.id
          ? {
              ...p,
              sections: p.sections.map((s) =>
                s.id === sectionId ? { ...s, status } : s,
              ),
            }
          : p,
      ),
    );
    router.refresh();
  }

  async function handleAddComment(sectionId: string) {
    const text = (commentInputs[sectionId] ?? "").trim();
    if (!text) return;
    setPostingComment(sectionId);
    const comment = await createSitemapComment(sectionId, text, "admin");
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
    if (treeFullscreen) setTreeFullscreen(false);
    setViewMode("edit");
  }

  // ── Sidebar renderer ───────────────────────────────────────────────────

  function renderSidebarPage(page: Page, isSlug: boolean) {
    const derived = derivePageStatus(page);
    const isDraggingThis = dragging === page.id;
    const isDropTarget = dragOverId === page.id;
    const isActive = activePageId === page.id;

    const itemClass = [
      styles.pageItem,
      isSlug ? styles.pageItemSlug : "",
      isActive ? styles.pageItemActive : "",
      isDraggingThis ? styles.pageItemDragging : "",
      isDropTarget ? styles.pageItemDropTarget : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div
        key={page.id}
        className={itemClass}
        draggable
        onDragStart={() => handleDragStart(page.id, page.parentId)}
        onDragOver={(e) => handleDragOver(e, page.id, page.parentId)}
        onDrop={(e) => handleDrop(e, page.id, page.parentId)}
        onDragEnd={handleDragEnd}
      >
        <span className={styles.dragHandle} title='Drag to reorder'>
          ⠿
        </span>

        {isSlug && <span className={styles.pageSlugMarker}>└─</span>}

        <button
          className={styles.pageItemBtn}
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

        <button
          className={styles.reparentBtn}
          onClick={() => {
            setReparentTargetId(page.parentId ?? "");
            setModal({
              type: "reparent",
              pageId: page.id,
              pageName: page.name,
            });
          }}
          title='Move page'
        >
          ↕
        </button>
        <button
          className={styles.pageDeleteBtn}
          onClick={() =>
            setModal({
              type: "deletePage",
              pageId: page.id,
              pageName: page.name,
            })
          }
          disabled={deletingPageId === page.id}
          title='Delete page'
        >
          ×
        </button>
      </div>
    );
  }

  function renderSidebarPages() {
    return topLevelPages.map((page) => {
      const children = sortByPosition(
        pages.filter((p) => p.parentId === page.id),
      );
      return (
        <div key={page.id}>
          {renderSidebarPage(page, false)}
          {children.map((child) => renderSidebarPage(child, true))}
        </div>
      );
    });
  }

  // ── Empty state ────────────────────────────────────────────────────────

  if (pages.length === 0) {
    return (
      <>
        <div className={styles.emptyState}>
          <p className={styles.emptyStateText}>
            No blueprint yet for this client.
          </p>
          <p className={styles.emptyStateDesc}>
            Seed the standard black car site architecture to get started, or add
            pages manually.
          </p>
          <div className={styles.emptyStateActions}>
            <button className={styles.btnAccent} onClick={seedDefaultPages}>
              Seed Standard Pages
            </button>
            <button className={styles.btn} onClick={() => setAddingPage(true)}>
              Add page manually
            </button>
          </div>
          {addingPage && (
            <div className={styles.addPageFormStandalone}>
              <input
                className={styles.inputSm}
                placeholder='Page name...'
                value={newPageName}
                onChange={(e) => setNewPageName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddPage();
                  if (e.key === "Escape") setAddingPage(false);
                }}
                autoFocus
              />
              <div className={styles.addPageActions}>
                <button className={styles.btnAccent} onClick={handleAddPage}>
                  Add
                </button>
                <button
                  className={styles.btnGhost}
                  onClick={() => setAddingPage(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
        <Modals
          modal={modal}
          pages={pages}
          reparentTargetId={reparentTargetId}
          setReparentTargetId={setReparentTargetId}
          onClose={() => setModal(null)}
          onConfirmDelete={handleDeletePage}
          onConfirmStartOver={handleStartOver}
          onConfirmReparent={handleReparent}
        />
      </>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────

  const approvedSections =
    activePage?.sections.filter((s) => s.status === "APPROVED").length ?? 0;
  const totalSections = activePage?.sections.length ?? 0;
  const progressPct =
    totalSections > 0
      ? Math.round((approvedSections / totalSections) * 100)
      : 0;

  return (
    <>
      <div className={styles.layout}>
        {/* ── Sidebar ── */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarLabel}>Pages</div>
          {renderSidebarPages()}

          {addingPage ? (
            <div className={styles.addPageForm}>
              <input
                className={styles.inputSm}
                placeholder='Page name...'
                value={newPageName}
                onChange={(e) => setNewPageName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddPage();
                  if (e.key === "Escape") setAddingPage(false);
                }}
                autoFocus
              />
              <select
                className={styles.inputSm}
                value={newPageParentId}
                onChange={(e) => setNewPageParentId(e.target.value)}
              >
                <option value=''>Top-level page</option>
                {topLevelPages.map((p) => (
                  <option key={p.id} value={p.id}>
                    Slug under: {p.name}
                  </option>
                ))}
              </select>
              <div className={styles.addPageActions}>
                <button className={styles.btnAccent} onClick={handleAddPage}>
                  Add
                </button>
                <button
                  className={styles.btnGhost}
                  onClick={() => {
                    setAddingPage(false);
                    setNewPageParentId("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              className={styles.addPageBtn}
              onClick={() => setAddingPage(true)}
            >
              + Add page
            </button>
          )}

          <button
            className={styles.startOverBtn}
            onClick={() => setModal({ type: "startOver" })}
            disabled={startingOver}
          >
            {startingOver ? "Resetting..." : "Start Over"}
          </button>
        </div>

        {/* ── Main panel ── */}
        <div className={styles.main}>
          {/* View toggle */}
          <div className={styles.viewToggleBar}>
            <div className={styles.viewToggleGroup}>
              <button
                className={`${styles.viewToggleBtn} ${viewMode === "edit" ? styles.viewToggleBtnActive : ""}`}
                onClick={() => setViewMode("edit")}
              >
                Edit
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
                Click a page to select it
              </span>
            )}
          </div>

          {/* Tree view */}
          {viewMode === "tree" && (
            <TreeView
              pages={pages}
              activePageId={activePageId}
              onSelect={handleSelectPage}
              fullscreen={treeFullscreen}
              onToggleFullscreen={() => setTreeFullscreen((v) => !v)}
            />
          )}

          {/* Edit view */}
          {viewMode === "edit" && (
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
                        <h3 className={styles.mainTitle}>{activePage.name}</h3>
                        {activePage.parentId && (
                          <span className={styles.slugBadge}>Slug page</span>
                        )}
                      </div>
                      <span
                        className={`${styles.statusPill} ${
                          derivePageStatus(activePage) === "APPROVED"
                            ? styles.pillApproved
                            : derivePageStatus(activePage) === "REVIEW"
                              ? styles.pillReview
                              : styles.pillDraft
                        }`}
                      >
                        {statusLabel(derivePageStatus(activePage))}
                      </span>
                    </div>
                    <div className={styles.progressRow}>
                      <span className={styles.progressLabel}>
                        {approvedSections} of {totalSections} sections approved
                      </span>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={
                            {
                              "--progress-width": `${progressPct}%`,
                            } as React.CSSProperties
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles.sectionsList}>
                    {activePage.sections.length === 0 && (
                      <p className={styles.emptySections}>
                        No sections yet. Add one below.
                      </p>
                    )}

                    {activePage.sections.map((section) => {
                      const isOpen = !!openSections[section.id];
                      const isEditing = editingSection === section.id;
                      const isSaving = savingSection === section.id;

                      return (
                        <div key={section.id} className={styles.sectionCard}>
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
                            <span
                              className={`${styles.statusPill} ${
                                section.status === "APPROVED"
                                  ? styles.pillApproved
                                  : section.status === "REVIEW"
                                    ? styles.pillReview
                                    : styles.pillDraft
                              }`}
                            >
                              {statusLabel(section.status)}
                            </span>
                          </div>

                          {isOpen && (
                            <div className={styles.sectionBody}>
                              <div className={styles.copyBlock}>
                                <div className={styles.copyLabel}>
                                  Copy / Content Notes
                                </div>
                                {isEditing ? (
                                  <textarea
                                    className={styles.copyTextarea}
                                    value={editCopy}
                                    onChange={(e) =>
                                      setEditCopy(e.target.value)
                                    }
                                    rows={6}
                                  />
                                ) : (
                                  <div className={styles.copyDisplay}>
                                    {section.copy?.trim() ? (
                                      <span className={styles.copyPreserved}>
                                        {section.copy}
                                      </span>
                                    ) : (
                                      <span className={styles.copyEmpty}>
                                        No copy added yet.
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {section.comments.length > 0 && (
                                <div className={styles.comments}>
                                  {section.comments.map((c) => (
                                    <div key={c.id} className={styles.comment}>
                                      <div className={styles.commentMeta}>
                                        {c.authorType === "admin"
                                          ? "You"
                                          : "Client"}{" "}
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
                                  placeholder='Leave a note...'
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
                                  className={styles.btn}
                                  onClick={() => handleAddComment(section.id)}
                                  disabled={postingComment === section.id}
                                >
                                  {postingComment === section.id
                                    ? "Posting..."
                                    : "Post"}
                                </button>
                              </div>

                              <div className={styles.sectionFooter}>
                                {isEditing ? (
                                  <button
                                    className={styles.btnAccent}
                                    onClick={() => handleSaveCopy(section.id)}
                                    disabled={isSaving}
                                  >
                                    {isSaving ? "Saving..." : "Save Copy"}
                                  </button>
                                ) : (
                                  <button
                                    className={styles.btn}
                                    onClick={() => {
                                      setEditingSection(section.id);
                                      setEditCopy(section.copy ?? "");
                                    }}
                                  >
                                    Edit Copy
                                  </button>
                                )}
                                {isEditing && (
                                  <button
                                    className={styles.btnGhost}
                                    onClick={() => setEditingSection(null)}
                                  >
                                    Cancel
                                  </button>
                                )}
                                <select
                                  className={styles.statusSelect}
                                  value={section.status}
                                  onChange={(e) =>
                                    handleStatusChange(
                                      section.id,
                                      e.target.value as SitemapStatus,
                                    )
                                  }
                                >
                                  <option value='DRAFT'>Draft</option>
                                  <option value='REVIEW'>
                                    Mark for Review
                                  </option>
                                  <option value='APPROVED'>Approved</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className={styles.addSectionRow}>
                    <input
                      className={styles.inputSm}
                      placeholder='New section name (e.g. Hero, FAQ, CTA...)'
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddSection();
                      }}
                      disabled={addingSection}
                    />
                    <button
                      className={styles.btnAccent}
                      onClick={handleAddSection}
                      disabled={addingSection}
                    >
                      {addingSection ? "Adding..." : "+ Add Section"}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <Modals
        modal={modal}
        pages={pages}
        reparentTargetId={reparentTargetId}
        setReparentTargetId={setReparentTargetId}
        onClose={() => setModal(null)}
        onConfirmDelete={handleDeletePage}
        onConfirmStartOver={handleStartOver}
        onConfirmReparent={handleReparent}
      />
    </>
  );
}

// ── Modals ─────────────────────────────────────────────────────────────────

function Modals({
  modal,
  pages,
  reparentTargetId,
  setReparentTargetId,
  onClose,
  onConfirmDelete,
  onConfirmStartOver,
  onConfirmReparent,
}: {
  modal: ModalState;
  pages: Page[];
  reparentTargetId: string;
  setReparentTargetId: (v: string) => void;
  onClose: () => void;
  onConfirmDelete: (id: string) => Promise<void>;
  onConfirmStartOver: () => Promise<void>;
  onConfirmReparent: () => Promise<void>;
}) {
  const topLevelPages = sortByPosition(pages.filter((p) => !p.parentId));

  return (
    <Modal isOpen={modal !== null} onClose={onClose}>
      {modal?.type === "deletePage" && (
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <span className={styles.modalHeading}>Delete Page</span>
          </div>
          <div className={styles.modalBody}>
            <p className={styles.modalText}>
              You are about to permanently delete{" "}
              <strong>{modal.pageName}</strong> and all of its sections. Any
              slug pages under it will also be deleted.
            </p>
            <p className={styles.modalTextSmall}>This cannot be undone.</p>
          </div>
          <div className={styles.modalFooter}>
            <button className={styles.btn} onClick={onClose}>
              Cancel
            </button>
            <button
              className={styles.btnDanger}
              onClick={() => onConfirmDelete(modal.pageId)}
            >
              Delete Page
            </button>
          </div>
        </div>
      )}

      {modal?.type === "startOver" && (
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <span className={styles.modalHeading}>Start Over</span>
          </div>
          <div className={styles.modalBody}>
            <p className={styles.modalText}>
              This will permanently delete all existing pages and sections and
              replace them with the standard black car site architecture.
            </p>
            <p className={styles.modalTextSmall}>
              All copy, comments, and approvals will be lost. This cannot be
              undone.
            </p>
          </div>
          <div className={styles.modalFooter}>
            <button className={styles.btn} onClick={onClose}>
              Cancel
            </button>
            <button className={styles.btnDanger} onClick={onConfirmStartOver}>
              Yes, Start Over
            </button>
          </div>
        </div>
      )}

      {modal?.type === "reparent" && (
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <span className={styles.modalHeading}>Move Page</span>
          </div>
          <div className={styles.modalBody}>
            <p className={styles.modalText}>
              Change where <strong>{modal.pageName}</strong> lives in the site
              structure.
            </p>
            <div className={styles.reparentField}>
              <label className={styles.reparentLabel}>Move to</label>
              <select
                className={styles.inputSm}
                value={reparentTargetId}
                onChange={(e) => setReparentTargetId(e.target.value)}
              >
                <option value=''>Top-level page (no parent)</option>
                {topLevelPages
                  .filter((p) => p.id !== modal.pageId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      Slug under: {p.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button className={styles.btn} onClick={onClose}>
              Cancel
            </button>
            <button className={styles.btnAccent} onClick={onConfirmReparent}>
              Move Page
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
