/**
 * 웹 ↔ 앱 브리지.
 *
 * 봉투는 양방향 모두 `{ type, payload }`다. `type`은 메시지 표식, `payload`는 메시지별 본문이다.
 * 화면은 JSON 파싱·`type` 분기·주입 스크립트를 모르고, 받을 때는 `type`별 핸들러만 넘기고
 * 보낼 때는 `sendBridgeMessage`만 부른다.
 *
 * 웹 → 앱: 웹은 `window.ReactNativeWebView.postMessage(JSON.stringify({ type, payload }))`로 보낸다.
 * 앱 → 웹: 앱은 웹뷰의 `window`에 `streamapp` CustomEvent를 쏘고 `detail`에 봉투를 싣는다.
 *   `webViewRef.postMessage`는 쓰지 않는다 — 이벤트가 iOS는 `window`, Android는 `document`에 걸려
 *   웹이 양쪽을 들어야 하고, 다른 출처의 `message` 이벤트와 섞인다.
 *
 * 메시지 추가 절차 (웹 → 앱):
 *   1. `messages/<이름>.ts`에 type 상수 · payload 인터페이스 · `(payload: unknown) => T | null` 파서
 *      type은 `영역.동작`으로 짓는다(예: `navigation.push`). `safeAreaColors`는 이 규칙 전에 생긴
 *      이름이라 그대로 둔다
 *   2. 아래 `parsers`에 한 줄 등록 — 나머지 타입은 여기서 파생된다
 *   3. 화면의 `dispatchBridgeMessage` 핸들러에 항목 추가
 *   4. stream-client-web에 같은 type 상수·같은 payload 필드로 송신부 작성 (PR을 서로 링크)
 *
 * 메시지 추가 절차 (앱 → 웹):
 *   1. `messages/<이름>.ts`에 type 상수 · payload 인터페이스
 *   2. 아래 `BridgeOutgoingMessages`에 한 줄 등록
 *   3. stream-client-web에 같은 type·payload로 수신부 작성 (PR을 서로 링크)
 */

import type { WebView } from "react-native-webview";

import {
  NAVIGATION_BACK_GUARD_MESSAGE_TYPE,
  NAVIGATION_BACK_REQUESTED_MESSAGE_TYPE,
  NAVIGATION_CLOSE_MESSAGE_TYPE,
  NAVIGATION_NAVIGATE_MESSAGE_TYPE,
  NAVIGATION_POP_MESSAGE_TYPE,
  NAVIGATION_PUSH_MESSAGE_TYPE,
  NAVIGATION_REPLACE_MESSAGE_TYPE,
  type NavigationBackRequestedPayload,
  type NavigationButton,
  type NavigationNavigatePayload,
  parseNavigationBackGuardPayload,
  parseNavigationClosePayload,
  parseNavigationPopPayload,
  parseNavigationScreenPayload,
} from "@/features/webview/bridge/messages/navigation";
import {
  parseSafeAreaColorsPayload,
  SAFE_AREA_COLORS_MESSAGE_TYPE,
} from "@/features/webview/bridge/messages/safeAreaColors";

// 파서는 형식이 안 맞으면 `null`을 돌려준다. 던지지 않는다 — onMessage는 WebView 안의 어떤
// 스크립트든 부를 수 있어, 이상한 값은 오류가 아니라 "우리 메시지가 아님"으로 다룬다.
const parsers = {
  [SAFE_AREA_COLORS_MESSAGE_TYPE]: parseSafeAreaColorsPayload,
  [NAVIGATION_PUSH_MESSAGE_TYPE]: parseNavigationScreenPayload,
  [NAVIGATION_REPLACE_MESSAGE_TYPE]: parseNavigationScreenPayload,
  [NAVIGATION_POP_MESSAGE_TYPE]: parseNavigationPopPayload,
  [NAVIGATION_CLOSE_MESSAGE_TYPE]: parseNavigationClosePayload,
  [NAVIGATION_BACK_GUARD_MESSAGE_TYPE]: parseNavigationBackGuardPayload,
} satisfies Record<string, (payload: unknown) => unknown>;

type BridgeMessageType = keyof typeof parsers;
type BridgePayload<K extends BridgeMessageType> = NonNullable<ReturnType<(typeof parsers)[K]>>;

export type BridgeHandlers = Partial<{
  [K in BridgeMessageType]: (payload: BridgePayload<K>) => void;
}>;

function isBridgeMessageType(type: unknown): type is BridgeMessageType {
  return typeof type === "string" && Object.hasOwn(parsers, type);
}

/**
 * WebView `onMessage` 원문을 받아, 아는 메시지이고 핸들러가 있으면 부른다.
 * 모르는 메시지·형식 불일치는 조용히 버린다 — 웹이 다른 용도로 postMessage를 쓸 수 있다.
 */
export function dispatchBridgeMessage(data: string, handlers: BridgeHandlers): void {
  let message: unknown;

  try {
    message = JSON.parse(data);
  } catch {
    // JSON이 아니면 우리 메시지가 아니다.
    return;
  }

  if (typeof message !== "object" || message === null) {
    return;
  }

  const { type, payload } = message as Record<string, unknown>;

  if (!isBridgeMessageType(type)) {
    return;
  }

  const parsed = parsers[type](payload);

  if (parsed === null) {
    return;
  }

  // 레지스트리 키로 좁혀진 type과 그 파서 결과는 짝이 맞지만, TS는 인덱스 접근에서 이 상관관계를
  // 추적하지 못한다. 핸들러 쪽 시그니처는 BridgeHandlers로 보장되므로 여기서만 넓힌다.
  const handler = handlers[type] as ((payload: unknown) => void) | undefined;
  handler?.(parsed);
}

// 앱 → 웹으로 보내는 메시지의 type ↔ payload 짝. 받는 쪽 검증은 웹이 하므로 여기서는 타입만 묶는다.
interface BridgeOutgoingMessages {
  [NAVIGATION_BACK_REQUESTED_MESSAGE_TYPE]: NavigationBackRequestedPayload;
  [NAVIGATION_NAVIGATE_MESSAGE_TYPE]: NavigationNavigatePayload;
}

// 웹이 앱 메시지를 받는 CustomEvent 이름. 바꾸면 stream-client-web의 수신부도 같이 바꿔야 한다.
const APP_TO_WEB_EVENT = "streamapp";

/** 웹뷰에 메시지를 보낸다. 웹뷰가 없으면(오류 화면으로 내려가 있는 등) 아무것도 하지 않는다. */
export function sendBridgeMessage<K extends keyof BridgeOutgoingMessages>(
  webView: WebView | null,
  type: K,
  payload: BridgeOutgoingMessages[K],
): void {
  // JSON은 그대로 JS 식이라 스크립트에 끼워 넣어도 따옴표·줄바꿈이 깨지지 않는다. 끝의 `true;`는
  // 주입 스크립트가 값을 남기지 않으면 iOS에서 조용히 실패하는 걸 막는 react-native-webview 관례다.
  const detail = JSON.stringify({ payload, type });
  webView?.injectJavaScript(
    `window.dispatchEvent(new CustomEvent(${JSON.stringify(APP_TO_WEB_EVENT)}, { detail: ${detail} })); true;`,
  );
}

/**
 * 웹에 알리는 셸 정보. 페이지가 뜰 때 `window.__STREAM_SHELL__`로 넣는다.
 * 웹은 이걸 보고 ① 브리지 네비게이션을 써도 되는지(없으면 옛 앱이라 react-router로만 움직인다)
 * ② 앱이 헤더 버튼을 그리는지(그리면 자기 헤더에서 그 버튼을 뺀다) 판단한다.
 * 필드 이름은 stream-client-web과 맞춰야 한다.
 */
export interface ShellInfo {
  /** 앱이 `navigation.*` 메시지를 처리한다는 표시. 값은 계약 버전이다. */
  navigation: 1;
  /** 탭 화면 웹뷰(`root`)인지, 스택에 쌓인 웹뷰(`stack`)인지. */
  screen: "root" | "stack";
  /** 앱이 웹 헤더 위에 겹쳐 그린 버튼. 없으면 `null`. */
  button: NavigationButton | null;
}

/** 셸 정보를 웹뷰에 넣는 스크립트. `injectedJavaScriptBeforeContentLoaded`에 넘긴다. */
export function createShellScript(info: ShellInfo): string {
  return `window.__STREAM_SHELL__ = ${JSON.stringify(info)}; true;`;
}
