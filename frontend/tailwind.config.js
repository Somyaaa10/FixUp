/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        heading: ["Poppins", "sans-serif"],
      },
      colors: {
        // Redesign Palette
        primaryBrown: "#AD7B5D",
        primaryBrownHover: "#8F6248",
        primaryColor: "#AD7B5D",
        primaryHover: "#8F6248",
        mainText: "#202124",
        secondaryText: "#6B7280",
        pageBg: "#F7F7F6",
        cardBg: "#FFFFFF",
        borderColor: "#EAE7E3",
        statusSuccess: "#27865B",
        statusWarning: "#D99A31",
        statusError: "#D84A4A",
        // Shared Black-and-White Dashboard System Tokens
        dashboard: {
          primary: "#111111",
          primaryFg: "#FFFFFF",
          mainBg: "#F5F5F5",
          cardBg: "#FFFFFF",
          textPrimary: "#111111",
          textSecondary: "#525252",
          textMuted: "#737373",
          border: "#E5E5E5",
          hoverBg: "#F5F5F5",
          success: "#16A34A",
          warning: "#D97706",
          error: "#DC2626",
        },
        // Pastel Shades for Service Badges & Statistics
        pastelYellow: "#FEF9E7",
        pastelPeach: "#FDF2F0",
        pastelMint: "#EFFBF5",
        pastelBlue: "#F0F8FF",
        pastelPurple: "#F5F3FF",
        // Legacy fallbacks
        headingColor: "#202124",
        textColor: "#6B7280",
      },
      boxShadow: {
        soft: "0 2px 10px rgba(0, 0, 0, 0.03)",
        card: "0 4px 20px rgba(0, 0, 0, 0.04)",
        floating: "0 10px 30px rgba(0, 0, 0, 0.08)",
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      }
    },
  },
  plugins: [],
};
