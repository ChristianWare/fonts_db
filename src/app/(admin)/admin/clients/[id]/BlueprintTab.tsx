"use client";

import { useState } from "react";
import { format } from "date-fns";
import styles from "./BlueprintTab.module.css";
import {
  createSitemapPage,
  deleteSitemapPage,
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
  sections: Section[];
};

type Props = {
  clientId: string;
  initialPages: Page[];
};

// ── Default pages — used when a client has no sitemap yet ──────────────────

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

// ── Component ──────────────────────────────────────────────────────────────

export default function BlueprintTab({ clientId, initialPages }: Props) {
  const [pages, setPages] = useState<Page[]>(initialPages);
  const [activePageId, setActivePageId] = useState<string>(
    initialPages[0]?.id ?? "",
  );
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
  const [addingPage, setAddingPage] = useState(false);
  const [deletingPageId, setDeletingPageId] = useState<string | null>(null);

  const activePage = pages.find((p) => p.id === activePageId) ?? pages[0];

  // ── Seed default pages ─────────────────────────────────────────────────

  async function seedDefaultPages() {
    const created: Page[] = [];
    for (const name of DEFAULT_PAGE_NAMES) {
      const page = await createSitemapPage(clientId, name);
      created.push(page as unknown as Page);
    }
    setPages(created);
    setActivePageId(created[0]?.id ?? "");
  }

  // ── Page mutations ─────────────────────────────────────────────────────

  async function handleAddPage() {
    const name = newPageName.trim();
    if (!name) return;
    const page = await createSitemapPage(clientId, name);
    const newPage = page as unknown as Page;
    setPages((prev) => [...prev, newPage]);
    setActivePageId(newPage.id);
    setNewPageName("");
    setAddingPage(false);
  }

  async function handleDeletePage(pageId: string) {
    if (
      !confirm("Delete this page and all its sections? This cannot be undone.")
    )
      return;
    setDeletingPageId(pageId);
    await deleteSitemapPage(pageId);
    setPages((prev) => prev.filter((p) => p.id !== pageId));
    if (activePageId === pageId) {
      const remaining = pages.filter((p) => p.id !== pageId);
      setActivePageId(remaining[0]?.id ?? "");
    }
    setDeletingPageId(null);
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
  }

  async function handleSaveCopy(sectionId: string) {
    setSavingSection(sectionId);
    await updateSitemapSection(sectionId, { copy: editCopy });
    setPages((prev) =>
      prev.map((p) =>
        p.id === activePage.id
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
  }

  async function handleStatusChange(sectionId: string, status: SitemapStatus) {
    await updateSitemapSection(sectionId, { status });
    setPages((prev) =>
      prev.map((p) =>
        p.id === activePage.id
          ? {
              ...p,
              sections: p.sections.map((s) =>
                s.id === sectionId ? { ...s, status } : s,
              ),
            }
          : p,
      ),
    );
  }

  async function handleAddComment(sectionId: string) {
    const text = (commentInputs[sectionId] ?? "").trim();
    if (!text) return;
    setPostingComment(sectionId);
    const comment = await createSitemapComment(sectionId, text, "admin");
    setPages((prev) =>
      prev.map((p) =>
        p.id === activePage.id
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
  }

  // ── Empty state ────────────────────────────────────────────────────────

  if (pages.length === 0) {
    return (
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
    );
  }

  // ── Main render ────────────────────────────────────────────────────────

  const approvedSections =
    activePage?.sections.filter((s) => s.status === "APPROVED").length ?? 0;
  const totalSections = activePage?.sections.length ?? 0;
  const progress =
    totalSections > 0
      ? Math.round((approvedSections / totalSections) * 100)
      : 0;

  return (
    <div className={styles.layout}>
      {/* ── Sidebar ── */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarLabel}>Pages</div>

        {pages.map((page) => {
          const derived = derivePageStatus(page);
          return (
            <div
              key={page.id}
              className={`${styles.pageItem} ${activePageId === page.id ? styles.pageItemActive : ""}`}
            >
              <button
                className={styles.pageItemBtn}
                onClick={() => setActivePageId(page.id)}
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
                className={styles.pageDeleteBtn}
                onClick={() => handleDeletePage(page.id)}
                disabled={deletingPageId === page.id}
                title='Delete page'
              >
                ×
              </button>
            </div>
          );
        })}

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
        ) : (
          <button
            className={styles.addPageBtn}
            onClick={() => setAddingPage(true)}
          >
            + Add page
          </button>
        )}
      </div>

      {/* ── Main panel ── */}
      <div className={styles.main}>
        {!activePage ? (
          <div className={styles.emptyMain}>
            Select a page from the sidebar.
          </div>
        ) : (
          <>
            {/* Page header */}
            <div className={styles.mainHeader}>
              <div className={styles.mainHeaderTop}>
                <h3 className={styles.mainTitle}>{activePage.name}</h3>
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
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Sections */}
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
                    {/* Section header */}
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

                    {/* Section body */}
                    {isOpen && (
                      <div className={styles.sectionBody}>
                        {/* Copy block */}
                        <div className={styles.copyBlock}>
                          <div className={styles.copyLabel}>
                            Copy / Content Notes
                          </div>
                          {isEditing ? (
                            <textarea
                              className={styles.copyTextarea}
                              value={editCopy}
                              onChange={(e) => setEditCopy(e.target.value)}
                              rows={6}
                            />
                          ) : (
                            <div className={styles.copyDisplay}>
                              {section.copy?.trim() ? (
                                <span style={{ whiteSpace: "pre-wrap" }}>
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

                        {/* Comments */}
                        {section.comments.length > 0 && (
                          <div className={styles.comments}>
                            {section.comments.map((c) => (
                              <div key={c.id} className={styles.comment}>
                                <div className={styles.commentMeta}>
                                  {c.authorType === "admin" ? "You" : "Client"}{" "}
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

                        {/* Comment input */}
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

                        {/* Footer actions */}
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
                            <option value='REVIEW'>Mark for Review</option>
                            <option value='APPROVED'>Approved</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add section row */}
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
      </div>
    </div>
  );
}
