/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLenis } from "lenis/react";
import { selectDesignOption } from "@/actions/client/selectDesignOption";
import styles from "./DesignSelectionClient.module.css";

type DesignOption = {
  id: string;
  fileUrl: string;
  templateName: string | null;
  sourceUrl: string | null;
  selected: boolean;
  clientNotes: string | null;
};

export default function DesignSelectionClient({
  options,
  selectedOption,
}: {
  options: DesignOption[];
  selectedOption: DesignOption | null;
}) {
  const router = useRouter();
  const lenis = useLenis();

  const [activeId, setActiveId] = useState<string | null>(
    selectedOption?.id ?? null,
  );
  const [notes, setNotes] = useState(selectedOption?.clientNotes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!selectedOption);
  const [error, setError] = useState<string | null>(null);

  const [lightboxOption, setLightboxOption] = useState<DesignOption | null>(
    null,
  );
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);

  useEffect(() => {
    if (lightboxOption) {
      lenis?.stop();
      document.body.style.overflow = "hidden";
    } else {
      lenis?.start();
      document.body.style.overflow = "";
    }
    return () => {
      lenis?.start();
      document.body.style.overflow = "";
    };
  }, [lightboxOption, lenis]);

  const openLightbox = (option: DesignOption, index: number) => {
    setLightboxOption(option);
    setLightboxIndex(index);
  };

  const closeLightbox = () => setLightboxOption(null);

  const handleSelect = (id: string) => {
    setActiveId(id);
    setError(null);
    // Allow changing selection after a prior submission
    if (submitted && id !== selectedOption?.id) {
      setSubmitted(false);
    }
  };

  const handleSelectFromLightbox = (id: string) => {
    setActiveId(id);
    setError(null);
    if (submitted && id !== selectedOption?.id) {
      setSubmitted(false);
    }
    closeLightbox();
  };

  const handleSubmit = async () => {
    if (!activeId) {
      setError("Please select a design before confirming.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = await selectDesignOption({
      assetId: activeId,
      clientNotes: notes,
    });
    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    setSubmitted(true);
    setSubmitting(false);
    router.refresh();
  };

  const activeOption = options.find((o) => o.id === activeId);

  // ── EMPTY STATE ───────────────────────────────────────────────────
  if (options.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.heading}>Choose Your Design</h1>
          <p className={styles.subheading}>
            We&apos;re curating design options tailored to your brand. Check
            back soon — we&apos;ll notify you when they&apos;re ready.
          </p>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg
              width='28'
              height='28'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='1.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <rect x='3' y='3' width='18' height='18' rx='2' />
              <circle cx='8.5' cy='8.5' r='1.5' />
              <polyline points='21 15 16 10 5 21' />
            </svg>
          </div>
          <p className={styles.emptyText}>No design options uploaded yet.</p>
        </div>
      </div>
    );
  }

  // ── MAIN ─────────────────────────────────────────────────────────
  return (
    <>
      {/* LIGHTBOX */}
      {lightboxOption && (
        <div className={styles.lightboxOverlay} onClick={closeLightbox}>
          <div
            className={styles.lightboxPanel}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.lightboxHeader}>
              <div className={styles.lightboxMeta}>
                <span className={styles.lightboxNum}>
                  Option {lightboxIndex + 1}
                </span>
                {lightboxOption.templateName && (
                  <span className={styles.lightboxName}>
                    {lightboxOption.templateName}
                  </span>
                )}
              </div>
              <div className={styles.lightboxActions}>
                {lightboxOption.sourceUrl && (
                  <a
                    href={lightboxOption.sourceUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className={styles.lightboxSourceLink}
                    onClick={(e) => e.stopPropagation()}
                  >
                    View template →
                  </a>
                )}
                <button
                  className={`${styles.lightboxSelectBtn} ${activeId === lightboxOption.id ? styles.lightboxSelectBtnActive : ""}`}
                  onClick={() => handleSelectFromLightbox(lightboxOption.id)}
                >
                  {activeId === lightboxOption.id
                    ? "✓ Selected"
                    : "Select this design"}
                </button>
                <button
                  onClick={closeLightbox}
                  className={styles.lightboxClose}
                  aria-label='Close'
                >
                  <svg
                    width='18'
                    height='18'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  >
                    <line x1='18' y1='6' x2='6' y2='18' />
                    <line x1='6' y1='6' x2='18' y2='18' />
                  </svg>
                </button>
              </div>
            </div>

            <div className={styles.lightboxScroll}>
              <img
                src={lightboxOption.fileUrl}
                alt={
                  lightboxOption.templateName ??
                  `Design option ${lightboxIndex + 1}`
                }
                className={styles.lightboxImage}
              />
            </div>

            <div className={styles.lightboxFooter}>
              <span className={styles.lightboxFooterHint}>
                Scroll to review the full design, then choose below
              </span>
              <button
                className={`${styles.lightboxSelectBtn} ${activeId === lightboxOption.id ? styles.lightboxSelectBtnActive : ""}`}
                onClick={() => handleSelectFromLightbox(lightboxOption.id)}
              >
                {activeId === lightboxOption.id
                  ? "✓ Selected — close & confirm"
                  : "Select this design"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.heading}>Choose Your Design</h1>
          <p className={styles.subheading}>
            {submitted
              ? "Your selection has been submitted. You can update your choice at any time before we begin building."
              : "Preview each design option below. Click any preview to view the full page, then select your favorite."}
          </p>
        </div>

        {submitted && (
          <div className={styles.successBanner}>
            <svg
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <polyline points='20 6 9 17 4 12' />
            </svg>
            Selection confirmed — we&apos;ll be in touch shortly to kick off the
            build.
          </div>
        )}

        <div className={styles.instructions}>
          <div className={styles.instructionStep}>
            <span className={styles.instructionNum}>1</span>
            <span className={styles.instructionText}>
              Click any preview to view the full design
            </span>
          </div>
          <div className={styles.instructionDivider}>→</div>
          <div className={styles.instructionStep}>
            <span className={styles.instructionNum}>2</span>
            <span className={styles.instructionText}>
              Check the box next to your favorite to select it
            </span>
          </div>
          <div className={styles.instructionDivider}>→</div>
          <div className={styles.instructionStep}>
            <span className={styles.instructionNum}>3</span>
            <span className={styles.instructionText}>
              Add notes and confirm below
            </span>
          </div>
        </div>

        {/* Gallery */}
        <div className={styles.gallery}>
          {options.map((option, index) => {
            const isActive = activeId === option.id;
            const isChosen = submitted && option.id === selectedOption?.id;

            return (
              <div
                key={option.id}
                className={`${styles.optionCard} ${isActive ? styles.optionActive : ""} ${isChosen ? styles.optionChosen : ""}`}
              >
                <div className={styles.optionHeader}>
                  <div className={styles.optionHeaderLeft}>
                    <input
                      type='radio'
                      name='designSelection'
                      className={styles.radio}
                      checked={isActive}
                      onChange={() => handleSelect(option.id)}
                      aria-label={`Select option ${index + 1}`}
                    />
                    <span className={styles.optionNumber}>
                      Option {index + 1}
                    </span>
                    {option.templateName && (
                      <span className={styles.templateName}>
                        {option.templateName}
                      </span>
                    )}
                  </div>
                  <div className={styles.optionHeaderRight}>
                    {isChosen && !isActive && (
                      <span className={styles.chosenBadge}>✓ Your choice</span>
                    )}
                    {isActive && (
                      <span className={styles.activeBadge}>✓ Selected</span>
                    )}
                  </div>
                </div>

                <div
                  className={styles.preview}
                  onClick={() => openLightbox(option, index)}
                  title='Click to view full design'
                >
                  <img
                    src={option.fileUrl}
                    alt={option.templateName ?? `Design option ${index + 1}`}
                    className={styles.previewImage}
                  />
                  <div className={styles.previewOverlay}>
                    <div className={styles.previewHint}>
                      <svg
                        width='18'
                        height='18'
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
                      View full design
                    </div>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <button
                    className={styles.previewBtn}
                    onClick={() => openLightbox(option, index)}
                  >
                    View full design
                  </button>
                  <button
                    className={`${styles.selectBtn} ${isActive ? styles.selectBtnActive : ""}`}
                    onClick={() => handleSelect(option.id)}
                  >
                    {isActive ? "✓ Selected" : "Select this design"}
                  </button>
                  {option.sourceUrl && (
                    <a
                      href={option.sourceUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className={styles.sourceLink}
                    >
                      Template source →
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Confirm block — always visible */}
        <div
          className={`${styles.confirmCard} ${activeId ? styles.confirmCardActive : ""}`}
        >
          <div className={styles.confirmLeft}>
            <h3 className={styles.confirmHeading}>
              {activeId
                ? `Option ${options.findIndex((o) => o.id === activeId) + 1} selected${activeOption?.templateName ? ` — ${activeOption.templateName}` : ""}`
                : "No design selected yet"}
            </h3>
            <p className={styles.confirmDesc}>
              {activeId
                ? "Add any notes about adjustments you want, then confirm your selection."
                : "Check the box on a design above to continue."}
            </p>
          </div>
          {activeId && (
            <div className={styles.confirmRight}>
              <textarea
                className={styles.textarea}
                placeholder='Optional — e.g. I love this layout but would prefer darker colors and a different font...'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
              {error && <div className={styles.errorBanner}>{error}</div>}
              <button
                onClick={handleSubmit}
                className={styles.confirmBtn}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Confirm my selection →"}
              </button>
            </div>
          )}
        </div>

        {submitted &&
          selectedOption?.clientNotes &&
          activeId === selectedOption?.id && (
            <div className={styles.notesCard}>
              <span className={styles.notesLabel}>Your notes</span>
              <p className={styles.notesText}>{selectedOption.clientNotes}</p>
            </div>
          )}
      </div>
    </>
  );
}
