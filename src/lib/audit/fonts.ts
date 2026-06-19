// lib/audit/fonts.ts
// Registers the Fonts & Footers type system for @react-pdf/renderer (server-side).
//
// react-pdf can't drive variable-font axes, so these are STATIC cuts baked from
// your real brand fonts:
//   • Display → Roboto Flex pinned to opsz144 / wght700 / wdth81 (+ your parametric
//               values YOPQ72, YTUC760, etc.) — your exact heading recipe
//   • Body    → Roboto pinned to wght450 (regular) and wght550 (medium)
//   • Mono    → Geist Mono regular (your upload) + Geist Mono Bold (official, for labels)
//
// Drop the five .ttf files in /public/fonts/pdf, then see the Vercel note at the bottom.

import { Font } from "@react-pdf/renderer";
import path from "path";

const DIR = path.join(process.cwd(), "public", "fonts", "pdf");
const f = (n: string) => path.join(DIR, n);

let registered = false;
export function registerAuditFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: "Display",
    fonts: [{ src: f("RobotoFlexii-Display.ttf"), fontWeight: 700 }],
  });
  Font.register({
    family: "Body",
    fonts: [
      { src: f("Roboto-Regular.ttf"), fontWeight: 400 },
      { src: f("Roboto-Medium.ttf"), fontWeight: 500 },
    ],
  });
  Font.register({
    family: "Mono",
    fonts: [
      { src: f("GeistMono-Regular.ttf"), fontWeight: 400 },
      { src: f("GeistMono-Bold.ttf"), fontWeight: 700 },
    ],
  });

  Font.registerHyphenationCallback((w) => [w]);
}

/*
  VERCEL NOTE — files in /public are not always traced into a serverless function.
  Make sure the TTFs ship with the audit route by adding to next.config.js:

    experimental: {
      outputFileTracingIncludes: {
        "/api/audit": ["./public/fonts/pdf/**"],
      },
    },
*/
