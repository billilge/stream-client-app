/**
 * 웹 → 앱 postMessage 브리지.
 *
 * 웹은 `window.ReactNativeWebView.postMessage(JSON.stringify({ type, payload }))`로 보낸다.
 * `type`은 메시지 표식, `payload`는 메시지별 본문이다. 화면은 JSON 파싱·`type` 분기를 모르고
 * `type`별 핸들러만 넘긴다.
 *
 * 메시지 추가 절차:
 *   1. `messages/<이름>.ts`에 type 상수 · payload 인터페이스 · `(payload: unknown) => T | null` 파서
 *   2. 아래 `parsers`에 한 줄 등록 — 나머지 타입은 여기서 파생된다
 *   3. 화면의 `dispatchBridgeMessage` 핸들러에 항목 추가
 *   4. stream-client-web에 같은 type 상수·같은 payload 필드로 송신부 작성 (PR을 서로 링크)
 */

import {
  parseSafeAreaColorsPayload,
  SAFE_AREA_COLORS_MESSAGE_TYPE,
} from "@/features/webview/bridge/messages/safeAreaColors";

// 파서는 형식이 안 맞으면 `null`을 돌려준다. 던지지 않는다 — onMessage는 WebView 안의 어떤
// 스크립트든 부를 수 있어, 이상한 값은 오류가 아니라 "우리 메시지가 아님"으로 다룬다.
const parsers = {
  [SAFE_AREA_COLORS_MESSAGE_TYPE]: parseSafeAreaColorsPayload,
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
