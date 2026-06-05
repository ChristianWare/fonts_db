import type { Appearance } from "@stripe/stripe-js";

export const stripeAppearance: Appearance = {
  theme: "flat",
  variables: {
    colorBackground: "#fff",
    colorText: "#0a0a0a",
    colorDanger: "#c53030",
    fontFamily: '"Roboto", system-ui, sans-serif',
    fontSizeBase: "14px",
    borderRadius: "0",
    colorTextPlaceholder: "#888888",
    colorTextSecondary: "#555555",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      border: "1px solid #d4d4d4",
      boxShadow: "none",
      padding: "11px 14px",
      fontSize: "14px",
      fontFamily: '"Roboto", system-ui, sans-serif',
    },
    ".Input:focus": {
      border: "1px solid #0a0a0a",
      boxShadow: "none",
      outline: "none",
    },
    ".Input::placeholder": {
      color: "#888888",
    },
    ".Label": {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: "14px",
      fontWeight: "400",
      textTransform: "uppercase",
      letterSpacing: "0.07em",
      color: "#555555",
    },
    ".Tab": {
      border: "1px solid #d4d4d4",
      boxShadow: "none",
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: "14px",
    },
    ".Tab--selected": {
      border: "1px solid #0a0a0a",
      boxShadow: "none",
    },
    ".Tab:focus": {
      boxShadow: "none",
      outline: "none",
    },
    ".TabLabel": {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: "14px",
      textTransform: "uppercase",
      letterSpacing: "0.07em",
    },
    ".Block": {
      border: "1px solid #d4d4d4",
      boxShadow: "none",
    },
    ".CheckboxLabel": {
      fontFamily: '"Roboto", system-ui, sans-serif',
      fontSize: "14px",
      color: "#555555",
    },
  },
};
