/**
 * 세이프에어리어 스트립 색 — stream-client-web이 postMessage로 알려준다.
 *
 * 앱은 WebView 안의 DOM을 볼 수 없다(별도 저장소·별도 배포라 앱 안에 웹 코드가 없고,
 * WebView는 픽셀만 보여준다). 그래서 어떤 화면이 무슨 배경인지는 웹이 말해주는 수밖에 없다.
 *
 * 예전에는 이 색을 tailwind.config.js에 hex로 복사해 뒀는데, 웹에서 화면마다 배경이
 * 달라지면서(web#50) 흰 배경 화면에서 회색 띠가 보였다. 웹만 배포돼도 조용히 어긋나는
 * 구조라 값을 앱이 들고 있지 않도록 바꿨다.
 *
 * 송신부: stream-client-web의 `src/components/ui/useNativeSafeAreaColors.ts`.
 * 표식 문자열과 필드 이름은 양쪽이 맞춰야 한다.
 */

const SAFE_AREA_COLORS_MESSAGE_TYPE = "safeAreaColors";

export interface SafeAreaColors {
  bottom: string;
  top: string;
}

// 웹이 색을 알려주기 전(로딩 중)과, 이 기능이 없는 옛 웹이 물렸을 때 쓰는 값.
// stream-client-web의 WDS 배경 토큰 기본값이다 — 어디까지나 폴백이고, 웹이 말해주면 덮인다.
export const DEFAULT_SAFE_AREA_COLORS: SafeAreaColors = {
  bottom: "#FFFFFF",
  top: "#F7F7F8",
};

// onMessage는 WebView 안의 어떤 스크립트든 보낼 수 있다. 색 자리에 이상한 값이 들어와
// 스트립이 검게 칠해지는 일이 없도록 표기를 확인하고 통과시킨다.
const CSS_COLOR_PATTERN = /^#[0-9a-f]{3,8}$|^rgba?\([\d\s.,%/]+\)$/i;

function isColor(value: unknown): value is string {
  return typeof value === "string" && CSS_COLOR_PATTERN.test(value);
}

/** 웹이 보낸 원문에서 스트립 색을 꺼낸다. 이 앱이 아는 메시지가 아니면 `null`. */
export function parseSafeAreaColorsMessage(data: string): SafeAreaColors | null {
  let payload: unknown;

  try {
    payload = JSON.parse(data);
  } catch {
    // JSON이 아니면 우리 메시지가 아니다. 웹이 다른 용도로 postMessage를 쓸 수 있으므로
    // 오류로 다루지 않고 흘려보낸다.
    return null;
  }

  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const { bottom, top, type } = payload as Record<string, unknown>;

  if (type !== SAFE_AREA_COLORS_MESSAGE_TYPE || !isColor(top) || !isColor(bottom)) {
    return null;
  }

  return { bottom, top };
}
