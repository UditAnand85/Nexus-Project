/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F5F5F1",
        panel: "#FFFFFF",
        ink: "#1A1D2B",
        inksoft: "#5D6472",
        line: "#E3E4DE",
        primary: "#2C3B8F",
        primarydark: "#212C6B",
        primarysoft: "#EBEDF9",
        go: "#1F9D6B",
        gosoft: "#E4F4EC",
        hold: "#C98A22",
        holdsoft: "#FBF0DD",
        stop: "#C24C3F",
        stopsoft: "#FBE9E6"
      },
      fontFamily: {
        serif: ['Fraunces', 'serif'],
        sans: ['"Work Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      }
    },
  },
  plugins: [],
}
