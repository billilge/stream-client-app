/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // WDS(원티드 디자인 시스템) 시맨틱 토큰 — @wanteddev/wds-theme 3.12.0 라이트 테마 값.
      // 웹은 WDS 패키지를 그대로 쓰고, 앱은 네이티브로 그리는 데 필요한 것만 옮겨 둔다.
      colors: {
        label: {
          normal: "#171719",
        },
      },
    },
  },
  plugins: [],
};
