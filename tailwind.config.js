/** @type {import('tailwindcss').Config} */

/** Theme-aware QP token: value comes from the CSS variable (light/dark set in src/index.css). */
const v = (name) => `rgb(var(--qp-${name}) / <alpha-value>)`;

export default {
  darkMode: "class", // kraft-component uses `dark:` variants; we toggle the `dark` class on <html>
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    // REQUIRED: lets Tailwind see classes used inside the component library
    "./node_modules/@quantumphinance/kraft-component/dist/**/*.{mjs,cjs,js}",
  ],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"] },
      colors: {
        // QP brand blue (#2E75B6). Replaces Tailwind's blue so every kraft-component
        // button, chip, stepper, focus ring and link picks up the brand colour.
        blue: {
          50: "#e6f0f9", 100: "#d3e4f5", 200: "#b8d3ec", 300: "#8cbbe6", 400: "#5b9bd5",
          500: "#3d86c6", 600: "#2e75b6", 700: "#1f5a94", 800: "#1a4a7a", 900: "#163d63", 950: "#0f2a45",
        },
        // Theme-aware tokens (no `dark:` pair needed): bg-qp-card, text-qp-mut, border-qp-line …
        qp: {
          page: v("page"),       // app background
          side: v("side"),       // sidebar background (pale blue)
          surface: v("surface"), // logo card, menus, table body
          card: v("card"),       // content cards and KPI tiles
          hover: v("hover"),     // hover on cards / rows
          navon: v("navon"),     // active sidebar item
          search: v("search"),   // header search box, back button
          ink: v("ink"),         // primary text
          mut: v("mut"),         // secondary / muted text
          line: v("line"),       // dividers, title-bar rule
          field: v("field"),     // input borders
          blue: v("blue"),       // brand blue for text, links, accents
          bluetext: v("bluetext"), // text on pale-blue chips
          green: v("green"),     // sidebar tree + letter boxes, success
          amber: v("amber"),     // warning
          red: v("red"),         // danger
          purple: v("purple"),   // in-progress
        },
      },
    },
  },
  plugins: [],
};
