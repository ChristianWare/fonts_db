"use client";

/* eslint-disable @next/next/no-img-element */
import styles from "./ParallaxImageLarge.module.css";
import { useEffect, useRef } from "react";
import { useLenis } from "lenis/react";
import { StaticImageData } from "next/image";

const lerp = (start: number, end: number, factor: number) =>
  start + (end - start) * factor;

interface ParallaxImageProps {
  src: string | StaticImageData;
  alt: string;
}

interface BoundsRect {
  top: number;
  bottom: number;
}

export default function ParallaxImageLarge({ src, alt }: ParallaxImageProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const bounds = useRef<BoundsRect | null>(null);
  const currentTranslateY = useRef<number>(0);
  const targetTranslateY = useRef<number>(0);
  const rafid = useRef<number | null>(null);

  useEffect(() => {
    const updateBounds = () => {
      if (imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        bounds.current = {
          top: rect.top + window.scrollY,
          bottom: rect.bottom + window.scrollY,
        };
      }
    };

    updateBounds();
    window.addEventListener("resize", updateBounds);
    window.addEventListener("scroll", updateBounds);

    const animate = () => {
      if (imageRef.current) {
        currentTranslateY.current = lerp(
          currentTranslateY.current,
          targetTranslateY.current,
          0.1
        );

        if (
          Math.abs(currentTranslateY.current - targetTranslateY.current) > 0.01
        ) {
          imageRef.current.style.transform = `translateY(${currentTranslateY.current}px) scale(1.5)`;
        }
      }
      rafid.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", updateBounds);
      window.removeEventListener("scroll", updateBounds);
      if (rafid.current !== null) {
        cancelAnimationFrame(rafid.current);
      }
    };
  }, []);

  useLenis(({ scroll }) => {
    if (!bounds.current) return;
    const relativeScroll = scroll - bounds.current.top;
    targetTranslateY.current = relativeScroll * 0.2;
  });

  return (
    <div className={styles.imgContainer}>
      <img
        ref={imageRef}
        src={typeof src === "string" ? src : src.src}
        alt={alt}
        style={{
          willChange: "transform",
          transform: "translateY(0) scale(1.5)",
        }}
        className={styles.img}
      />
    </div>
  );
}
