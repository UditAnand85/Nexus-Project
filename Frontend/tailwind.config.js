/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F3F4F1",
        panel: "#FFFFFF",
        ink: "#1B2430",
        inksoft: "#5B6472",
        line: "#DADFDC",
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
