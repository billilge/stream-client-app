/**
 * 스택 화면 이동 — stream-client-web이 postMessage로 알려준다.
 *
 * 하단 탭이 없는 화면(상세·신청서·신청 결과)은 웹뷰 안에서 넘기지 않고 앱 스택에 새 웹뷰로
 * 쌓는다. 네이티브 전환 애니메이션과 iOS 스와이프 뒤로가기는 앱 화면이어야 생기기 때문이다.
 * 헤더 바·제목은 웹이 그대로 그리고, 앱은 그 위에 ←/X 버튼만 겹쳐 그린다 — 웹뷰가 뜨기 전이나
 * 오류가 났을 때도 나갈 수 있게. 어디로 갈지·어떤 버튼을 둘지는 웹 라우트가 알고 있으므로
 * 웹이 정해서 보내고, 앱은 받은 대로 스택만 움직인다.
 *
 * 송신부: stream-client-web (아직 없음 — 웹 쪽 이슈에서 작성한다).
 * 표식 문자열과 payload 필드 이름은 양쪽이 맞춰야 한다.
 */

/** 스택에 화면을 새로 쌓는다. */
export const NAVIGATION_PUSH_MESSAGE_TYPE = "navigation.push";
/** 지금 스택 화면을 바꿔 끼운다. 제출이 끝난 신청서처럼 돌아가면 안 되는 화면을 치울 때 쓴다. */
export const NAVIGATION_REPLACE_MESSAGE_TYPE = "navigation.replace";
/** 지금 스택 화면을 닫는다. */
export const NAVIGATION_POP_MESSAGE_TYPE = "navigation.pop";
/** 스택을 전부 닫고 루트(탭 화면)로 돌아간다. */
export const NAVIGATION_CLOSE_MESSAGE_TYPE = "navigation.close";
/** 뒤로가기를 막을지 알린다. 작성 중인 신청서처럼 나가기 전에 웹이 확인해야 하는 화면에서 켠다. */
export const NAVIGATION_BACK_GUARD_MESSAGE_TYPE = "navigation.backGuard";

/**
 * 앱이 웹 헤더 위에 겹쳐 그리는 버튼.
 * `back`은 왼쪽 ←(이 화면만 닫기), `close`는 오른쪽 X(스택 전체 닫기).
 */
export type NavigationButton = "back" | "close";

/** push·replace 공통 — 스택에 올릴 화면. */
export interface NavigationScreenPayload {
  /** 웹 경로(`/events/1/apply`). 앱이 `WEB_URL`의 origin에 붙여 웹뷰 주소를 만든다. */
  path: string;
  /** `null`이면 앱은 버튼을 그리지 않고 웹이 직접 그린다. 행사 상세처럼 이미지 위에 ←를 띄우는 화면. */
  button: NavigationButton | null;
}

export type NavigationPopPayload = Record<string, never>;

export interface NavigationClosePayload {
  /** 있으면 스택을 닫은 뒤 루트 웹뷰를 이 경로로 보낸다. 없으면 루트는 있던 화면 그대로다. */
  path?: string;
}

export interface NavigationBackGuardPayload {
  /** 켜져 있으면 ←·스와이프·안드로이드 백을 막고, 나갈지는 웹에 물어본다. */
  enabled: boolean;
}

// 웹은 경로만 보낸다. 웹뷰에 띄울 주소의 origin은 앱이 WEB_URL로 정하고, 웹은 그 안의 경로만
// 고른다. `//host`·`/\host`는 URL로 풀면 다른 호스트를 가리키게 되므로 경로로 치지 않는다.
const PATH_PATTERN = /^\/(?![/\\])/;

export function isPath(value: unknown): value is string {
  return typeof value === "string" && PATH_PATTERN.test(value);
}

export function isNavigationButton(value: unknown): value is NavigationButton {
  return value === "back" || value === "close";
}

// 선택 필드는 아예 없거나, 있으면 형식이 맞아야 한다.
function isOptional<T>(
  value: unknown,
  isType: (value: unknown) => value is T,
): value is T | undefined {
  return value === undefined || isType(value);
}

// payload는 필드가 없어도 항상 객체로 온다(`{}`). 객체가 아니면 우리 메시지가 아니다.
function toRecord(payload: unknown): Record<string, unknown> | null {
  return typeof payload === "object" && payload !== null
    ? (payload as Record<string, unknown>)
    : null;
}

/** push·replace payload에서 올릴 화면을 꺼낸다. 형식이 맞지 않으면 `null`. */
export function parseNavigationScreenPayload(payload: unknown): NavigationScreenPayload | null {
  const record = toRecord(payload);

  if (record === null) {
    return null;
  }

  const { button, path } = record;

  // 버튼을 빠뜨린 것과 "앱 버튼 없음"을 구분한다 — 없음은 `null`로 적어 보내야 한다.
  if (!isPath(path) || (button !== null && !isNavigationButton(button))) {
    return null;
  }

  return { button, path };
}

/** pop payload를 확인한다. 실어 오는 값은 없다. 형식이 맞지 않으면 `null`. */
export function parseNavigationPopPayload(payload: unknown): NavigationPopPayload | null {
  return toRecord(payload) === null ? null : {};
}

/** close payload에서 루트가 돌아갈 경로를 꺼낸다. 형식이 맞지 않으면 `null`. */
export function parseNavigationClosePayload(payload: unknown): NavigationClosePayload | null {
  const record = toRecord(payload);

  if (record === null) {
    return null;
  }

  const { path } = record;

  if (!isOptional(path, isPath)) {
    return null;
  }

  return { path };
}

/** backGuard payload에서 가드를 켤지 꺼낸다. 형식이 맞지 않으면 `null`. */
export function parseNavigationBackGuardPayload(
  payload: unknown,
): NavigationBackGuardPayload | null {
  const record = toRecord(payload);

  if (record === null) {
    return null;
  }

  const { enabled } = record;

  if (typeof enabled !== "boolean") {
    return null;
  }

  return { enabled };
}
