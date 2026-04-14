"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./Faq.module.css";
import LayoutWrapper from "@/components/shared/LayoutWrapper";
import SectionIntro from "@/components/shared/SectionIntro/SectionIntro";
import Arrow from "@/components/shared/icons/Arrow/Arrow";
import { questions, type SectionKey, type QuestionItem } from "@/lib/data";
import Button from "@/components/shared/Button/Button";
import Image from "next/image";
import ServiceIllustration from "../../../../public/images/cadiv.png";

function sectionFromPath(pathname: string): SectionKey {
  if (pathname.startsWith("/pricing")) return "pricing";
  if (pathname.startsWith("/about")) return "about";
  if (pathname.startsWith("/work")) return "work";
  if (pathname.startsWith("/blog")) return "blog";
  if (pathname.startsWith("/contact")) return "contact";
  return "home";
}

const SECTION_META: Record<
  SectionKey,
  { title: string; headingSpan: string; headingRest: string }
> = {
  home: {
    title: "FAQ",
    headingSpan: "Questions teams",
    headingRest: "Ask us the most",
  },
  pricing: {
    title: "Pricing FAQ",
    headingSpan: "Pricing, spelled out",
    headingRest: "with no surprises.",
  },
  about: {
    title: "About FAQ",
    headingSpan: "Who we are",
    headingRest: "and how we work.",
  },
  work: {
    title: "Project & Process FAQ",
    headingSpan: "Process clarity",
    headingRest: "from brief to launch.",
  },
  blog: {
    title: "Content & SEO FAQ",
    headingSpan: "Content that ranks",
    headingRest: "and loads fast.",
  },
  contact: {
    title: "Getting Started FAQ",
    headingSpan: "What we need",
    headingRest: "to get you live.",
  },
};

const SECTION_ORDER: SectionKey[] = [
  "home",
  "pricing",
  "about",
  "work",
  "blog",
  "contact",
];

function bySection(section: SectionKey, list: readonly QuestionItem[]) {
  return list.filter((q) => q.sections.includes(section));
}

export default function Faq() {
  const pathname = usePathname();
  const isAllFaqPage = pathname === "/faqs";
  const currentSection = sectionFromPath(pathname);
  const meta = SECTION_META[currentSection];

  // single expand state; for grouped (/faqs) we namespace the key
  const [openKey, setOpenKey] = useState<string | null>(null);
  const toggle = (k: string) => setOpenKey((prev) => (prev === k ? null : k));

  // Route-specific list (limit to ~ 6 items for non-/faqs pages)
  const routeQuestions = useMemo(() => {
    if (isAllFaqPage) return [] as QuestionItem[];
    return bySection(currentSection, questions);
  }, [currentSection, isAllFaqPage]);

  // Grouped lists for /faqs
  const grouped = useMemo(() => {
    if (!isAllFaqPage) return [];
    return SECTION_ORDER.map((key) => ({
      key,
      meta: SECTION_META[key],
      items: bySection(key, questions),
    })).filter((g) => g.items.length > 0);
  }, [isAllFaqPage]);

  if (!isAllFaqPage) {
    return (
      <section className={styles.container}>
        <LayoutWrapper>
          <div className={styles.content}>
            <div className={styles.top}>
              <div className={styles.dot1} />
              <div className={styles.dot2} />

              <div className={styles.topLeft}>
                <SectionIntro text='Help & oinfo' />
                <h2 className={styles.heading}>
                  <span className={styles.span}>{meta.headingSpan}</span> <br />
                  {meta.headingRest}
                </h2>
              </div>
              <div className={styles.topRight}>
                <p className={styles.copy}>
                  We’ve gathered the most common questions our clients ask about
                  working with us.{" "}
                  <span className={styles.accent}>
                    If you don’t find what you’re looking for, our team is just
                    a message away.
                  </span>
                </p>
              </div>
            </div>

            <div className={styles.bottom}>
              <div className={styles.bottomLeft}>
                <Image
                  src={ServiceIllustration}
                  alt='Illustration of a person sitting at a desk with a laptop, surrounded by question marks, symbolizing FAQs and support.'
                  fill
                  className={styles.img}
                />
              </div>
              <div className={styles.bottomRight}>
                {routeQuestions.map((q, i) => {
                  const k = `${currentSection}-${q.id}-${i}`;
                  const open = openKey === k;
                  return (
                    <div
                      key={q.id}
                      className={
                        open
                          ? `${styles.qaContainer} ${styles.show}`
                          : styles.qaContainer
                      }
                      onClick={() => toggle(k)}
                    >
                      <div className={styles.headingArrowContainer}>
                        <div className={styles.h3Container}>
                          <h3 className={styles.question} lang='en'>
                            {/* <span style={{ marginRight: "3rem" }}>
                              0{i + 1}.
                            </span> */}
                            {q.question}
                          </h3>
                        </div>
                        <div className={styles.arrowContainer}>
                          <Arrow
                            className={open ? styles.iconFlip : styles.icon}
                          />
                        </div>
                      </div>

                      <div
                        className={
                          open
                            ? `${styles.answerContainer} ${styles.show}`
                            : styles.answerContainer
                        }
                      >
                        <p className={styles.answer} lang='en'>
                          {q.answer}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className={styles.bottomii}>
              <div className={styles.bottomiiContent}>
                <div className={styles.bcLeft}>
                  <h3 className={styles.headingii}>
                    Still need <br /> a hand?
                  </h3>
                </div>
                <div className={styles.bcRight}>
                  <p className={styles.copyii}>
                    We’re here to help you find the right setup for your team.
                    If you didn’t find what you were looking for, our success
                    team will point you in the right direction.
                  </p>
                  <div className={styles.btnContainer}>
                    <Button
                      href='https://calendly.com/chris-fontsandfooters/30min'
                      target='_blank'
                      text='Book your discovery call'
                      btnType='accent'
                      arrow
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </LayoutWrapper>
      </section>
    );
  }

  // /faqs: show every section group with in-page anchors
  return (
    <section className={styles.container}>
      <LayoutWrapper>
        {grouped.map((group) => (
          <div
            key={group.key}
            id={`faq-${group.key}`} // anchor target (matches /faqs#faq-<section>)
            className={styles.groupBlock}
            aria-labelledby={`faq-heading-${group.key}`}
          >
            <div className={styles.content}>
              <div className={styles.left}>
                <SectionIntro text={group.meta.title} />
                <h2 id={`faq-heading-${group.key}`} className={styles.heading}>
                  <span className={styles.span}>{group.meta.headingSpan}</span>{" "}
                  <br />
                  {group.meta.headingRest}
                </h2>
                <p className={styles.copy}>
                  Everything about{" "}
                  {group.meta.title.toLowerCase().replace(" faq", "")}—in one
                  place.
                </p>
              </div>

              <div className={styles.right}>
                {group.items.map((q, i) => {
                  const k = `${group.key}-${q.id}-${i}`;
                  const open = openKey === k;
                  return (
                    <div
                      key={q.id}
                      className={styles.qaContainer}
                      onClick={() => toggle(k)}
                    >
                      <div className={styles.headingArrowContainer}>
                        <div className={styles.h3Container}>
                          <h3 className={styles.question} lang='en'>
                            {i + 1}. {q.question}
                          </h3>
                        </div>
                        <div className={styles.arrowContainer}>
                          <Arrow
                            className={open ? styles.iconFlip : styles.icon}
                          />
                        </div>
                      </div>

                      <div
                        className={
                          open
                            ? `${styles.answerContainer} ${styles.show}`
                            : styles.answerContainer
                        }
                      >
                        <p className={styles.answer} lang='en'>
                          {q.answer}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </LayoutWrapper>
    </section>
  );
}
