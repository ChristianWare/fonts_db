"use client";

import React, {
  useRef,
  useLayoutEffect,
  useState,
  MutableRefObject,
} from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  MotionValue,
  useVelocity,
  useAnimationFrame,
} from "framer-motion";
import styles from "./ScrollVelocity.module.css";

function useElementWidth(ref: MutableRefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const update = (): void => {
      if (ref.current) setWidth(ref.current.offsetWidth);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [ref]);

  return width;
}

/** Wrap a value so it stays in the `[min, max)` interval. */
const wrap = (min: number, max: number, v: number): number => {
  const range = max - min;
  const mod = (((v - min) % range) + range) % range;
  return mod + min;
};

/* ------------------------------------------------------------------ */
/*  Prop types                                                        */
/* ------------------------------------------------------------------ */

export interface VelocityMapping {
  input: [number, number];
  output: [number, number];
}

export interface ScrollVelocityProps {
  /** Optional ref to your scrollable container (default = `window`). */
  scrollContainerRef?: React.RefObject<HTMLElement>;
  /** The text lines that will scroll. */
  texts: string[];
  /** Base pixels / sec each copy travels (positive = left→right). */
  velocity?: number;
  /** Extra class applied to every `<span>` that holds the text. */
  className?: string;
  /** Damping fed to `useSpring` (smoothing). */
  damping?: number;
  /** Stiffness fed to `useSpring` (smoothing). */
  stiffness?: number;
  /** How many copies of each string appear in the strip. */
  numCopies?: number;
  /** Map raw scroll velocity → motion multiplier. */
  velocityMapping?: VelocityMapping;
  /** Class for the outer parallax wrapper. */
  parallaxClassName?: string;
  /** Class for the `<motion.div>` scroller. */
  scrollerClassName?: string;
  /** Inline style for the parallax wrapper. */
  parallaxStyle?: React.CSSProperties;
  /** Inline style for the scroller. */
  scrollerStyle?: React.CSSProperties;
}

type VelocityTextProps = Omit<ScrollVelocityProps, "texts"> & {
  /** Text rendered inside each <span>. */
  children: React.ReactNode;
  /** Signed pixels-per-second for this row. */
  baseVelocity: number;
};

/* ------------------------------------------------------------------ */
/*  VelocityText                                                      */
/* ------------------------------------------------------------------ */

function VelocityText({
  children,
  baseVelocity,
  scrollContainerRef,
  className = "",
  damping = 50,
  stiffness = 400,
  numCopies = 6,
  velocityMapping = { input: [0, 1000], output: [0, 5] },
  parallaxClassName = styles.parallax,
  scrollerClassName = styles.scroller,
  parallaxStyle,
  scrollerStyle,
}: VelocityTextProps): React.JSX.Element {
  /* -------------------------------------------------------------- */
  /*  Scroll velocity → multiplier                                  */
  /* -------------------------------------------------------------- */

  const baseX = useMotionValue(0);

  const { scrollY } = useScroll(
    scrollContainerRef ? { container: scrollContainerRef } : undefined,
  );
  const rawVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(rawVelocity, { damping, stiffness });

  const velocityFactor: MotionValue<number> = useTransform(
    smoothVelocity,
    velocityMapping.input,
    velocityMapping.output,
    { clamp: false },
  );

  /* -------------------------------------------------------------- */
  /*  Width-aware wrapping                                          */
  /* -------------------------------------------------------------- */

  const copyRef = useRef<HTMLSpanElement | null>(null);
  const copyWidth = useElementWidth(copyRef);

  const x: MotionValue<string> = useTransform(baseX, (v) =>
    copyWidth === 0 ? "0px" : `${wrap(-copyWidth, 0, v)}px`,
  );

  /* -------------------------------------------------------------- */
  /*  Per-frame move                                                */
  /* -------------------------------------------------------------- */

  const directionFactor = useRef<number>(1);

  useAnimationFrame((_t, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);

    const factor = velocityFactor.get();
    directionFactor.current = factor < 0 ? -1 : factor > 0 ? 1 : 0;

    moveBy += directionFactor.current * moveBy * factor;
    baseX.set(baseX.get() + moveBy);
  });

  /* -------------------------------------------------------------- */
  /*  Markup                                                        */
  /* -------------------------------------------------------------- */

  const spans = Array.from({ length: numCopies }, (_, i) => (
    <span
      key={i}
      className={`${className} h1`}
      ref={i === 0 ? copyRef : undefined}
      /* The nbsp at the end keeps words from butting up */
    >
      {children}&nbsp;
    </span>
  ));

  return (
    <div className={parallaxClassName} style={parallaxStyle}>
      <motion.div className={scrollerClassName} style={{ x, ...scrollerStyle }}>
        {spans}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ScrollVelocity (export)                                           */
/* ------------------------------------------------------------------ */

export const ScrollVelocity: React.FC<ScrollVelocityProps> = ({
  scrollContainerRef,
  texts,
  velocity = 100,
  className = "",
  damping = 50,
  stiffness = 400,
  numCopies = 6,
  velocityMapping = { input: [0, 1000], output: [0, 5] },
  parallaxClassName = styles.parallax,
  scrollerClassName = styles.scroller,
  parallaxStyle,
  scrollerStyle,
}) => {
  return (
    <section className={styles.container}>
      {texts.map((text, idx) => (
        <VelocityText
          key={idx}
          baseVelocity={idx % 2 === 0 ? velocity : -velocity}
          scrollContainerRef={scrollContainerRef}
          className={className}
          damping={damping}
          stiffness={stiffness}
          numCopies={numCopies}
          velocityMapping={velocityMapping}
          parallaxClassName={parallaxClassName}
          scrollerClassName={scrollerClassName}
          parallaxStyle={parallaxStyle}
          scrollerStyle={scrollerStyle}
        >
          {text}
        </VelocityText>
      ))}
    </section>
  );
};

export default ScrollVelocity;
