import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0f766e",
          hover: "#115e59",
        },
        surface: {
          DEFAULT: "#ffffff",
          muted: "#f0fdfa",
        },
        text: {
          DEFAULT: "#16302d",
          muted: "#4b6662",
        },
        border: "#b9d6d1",
        success: "#166534",
        danger: "#b91c1c",
      },
      borderRadius: {
        control: "0.75rem",
      },
      boxShadow: {
        card: "0 18px 45px -24px rgb(15 118 110 / 0.35)",
      },
    },
  },
  plugins: [],
} satisfies Config;
