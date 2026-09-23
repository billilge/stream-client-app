import type { Href } from "expo-router";
import { createRef } from "react";
import type { WebView } from "react-native-webview";
import type { NavigationScreenPayload } from "@/features/webview/bridge/messages/navigation";

/**
 * 루트(탭 화면) 웹뷰. 스택 화면이 닫히면서 루트를 다른 경로로 보낼 때(`navigation.close`의
 * `path`) 스택 화면이 이 웹뷰에 메시지를 보낸다. 루트 웹뷰는 하나뿐이라 모듈에 둔다 — React
 * Navigation이 화면 밖에서 이동할 때 navigationRef를 모듈에 두는 것과 같은 방식이다.
 */
export const rootWebViewRef = createRef<WebView>();

/** 스택 화면 라우트 주소. 앱 버튼이 없으면(`null`) 파라미터에서 뺀다. */
export function toStackHref({ button, path }: NavigationScreenPayload): Href {
  return { params: button === null ? { path } : { button, path }, pathname: "/stack" };
}
