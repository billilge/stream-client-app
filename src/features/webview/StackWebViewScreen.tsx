import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WEB_URL } from "@/constants/config";
import {
  isNavigationButton,
  isPath,
  type NavigationButton,
} from "@/features/webview/bridge/messages/navigation";
import { DEFAULT_SAFE_AREA_COLORS } from "@/features/webview/bridge/messages/safeAreaColors";
import HeaderButton from "@/features/webview/components/HeaderButton";
import ShellWebView from "@/features/webview/components/ShellWebView";
import WebViewMessage from "@/features/webview/components/WebViewMessage";
import { getOrigin } from "@/utils/url";

/**
 * 스택에 쌓이는 웹 화면(상세·신청서·신청 결과). 웹이 `navigation.push`로 연다.
 *
 * 화면마다 웹뷰를 새로 띄워 네이티브 전환 애니메이션과 iOS 스와이프 뒤로가기를 얻는다.
 * 헤더 바·제목은 웹이 그리고, 앱은 그 위에 ←/X 버튼만 겹쳐 그린다(HeaderButton 참고).
 */
export default function StackWebViewScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ button?: string; path?: string }>();
  const [safeAreaColors, setSafeAreaColors] = useState(DEFAULT_SAFE_AREA_COLORS);

  // expo-router는 라우트를 앱 스킴 링크(streamclientapp://stack?path=...)로도 열어 준다. 웹이 보낸
  // 값만 들어온다고 볼 수 없어서 브리지 메시지와 같은 기준으로 다시 확인한다. 경로가 `/`로 시작해야
  // origin 뒤에 붙였을 때 `@host` 같은 값으로 다른 호스트를 가리키지 못한다.
  const origin = getOrigin(WEB_URL);
  const url = origin !== "" && isPath(params.path) ? `${origin}${params.path}` : null;
  const button: NavigationButton | null = isNavigationButton(params.button) ? params.button : null;

  const handleButtonPress = useCallback((pressed: NavigationButton) => {
    if (pressed === "back") {
      router.back();
      return;
    }
    // X는 이 화면만이 아니라 스택을 전부 닫는다. 루트(탭 화면)는 있던 화면 그대로 보인다.
    router.dismissAll();
  }, []);

  const handleRetry = useCallback(() => {
    // 루트와 같은 이유로, 다시 띄우는 웹이 색을 알려줄 때까지는 기본값으로 돌아간다.
    setSafeAreaColors(DEFAULT_SAFE_AREA_COLORS);
  }, []);

  // 열 수 없는 주소면 안내만 띄우고, 빠져나갈 수 있게 ←는 항상 둔다.
  const visibleButton = url === null ? "back" : button;

  return (
    // 세이프에어리어 스트립은 루트(WebViewScreen)와 같은 방식으로 칠한다.
    <View className="flex-1">
      <View style={{ backgroundColor: safeAreaColors.top, height: insets.top }} />
      <View className="flex-1">
        {url === null ? (
          <WebViewMessage
            description="주소가 올바르지 않아 화면을 띄우지 않았습니다."
            title="페이지를 열 수 없습니다"
          />
        ) : (
          <ShellWebView
            handlers={{
              safeAreaColors: setSafeAreaColors,
            }}
            onRetry={handleRetry}
            url={url}
          />
        )}
        {/* 웹뷰보다 뒤에 둬야 위에 겹친다. 버튼이 없는 화면(null)은 웹이 직접 그린다. */}
        {visibleButton !== null && (
          <HeaderButton button={visibleButton} onPress={() => handleButtonPress(visibleButton)} />
        )}
      </View>
      <View style={{ backgroundColor: safeAreaColors.bottom, height: insets.bottom }} />
    </View>
  );
}
