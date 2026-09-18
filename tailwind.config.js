/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // stream-client-web이 쓰는 WDS 배경 토큰 값을 그대로 옮긴 것.
        // 세이프에어리어 스트립을 웹 화면과 같은 색으로 잇는 용도로만 쓴다.
        // 웹에서 토큰 값이 바뀌면 여기도 함께 맞춰야 한다.
        "web-background-alternative": "#F7F7F8",
        "web-background-normal": "#FFFFFF",
      },
    },
  },
  plugins: [],
};
