import { router, Stack, useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useState } from "react";
import { BackHandler, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WEB_URL } from "@/constants/config";
import { sendBridgeMessage } from "@/features/webview/bridge/bridge";
import {
  isNavigationButton,
  isPath,
  NAVIGATION_NAVIGATE_MESSAGE_TYPE,
  type NavigationButton,
} from "@/features/webview/bridge/messages/navigation";
import { DEFAULT_SAFE_AREA_COLORS } from "@/features/webview/bridge/messages/safeAreaColors";
import HeaderButton from "@/features/webview/components/HeaderButton";
import ShellWebView from "@/features/webview/components/ShellWebView";
import WebViewMessage from "@/features/webview/components/WebViewMessage";
import { rootWebViewRef, toStackHref } from "@/features/webview/stackNavigation";
import { getOrigin } from "@/utils/url";

// X는 이 화면만이 아니라 스택을 전부 닫는다. 루트(탭 화면)는 있던 화면 그대로 보인다.
function closeStack() {
  router.dismissAll();
}

/**
 * 스택에 쌓이는 웹 화면(상세·신청서·신청 결과). 웹이 `navigation.push`로 연다.
 *
 * 화면마다 웹뷰를 새로 띄워 네이티브 전환 애니메이션과 iOS 스와이프 뒤로가기를 얻는다.
 * 헤더 바·제목은 웹이 그리고, 앱은 그 위에 ←/X 버튼만 겹쳐 그린다(HeaderButton 참고).
 */
export default function StackWebViewScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ button?: string; path?: string }>();
  const [safeAreaColors, setSafeAreaColors] = useState(DEFAULT_SAFE_AREA_COLORS);

  // expo-router는 라우트를 앱 스킴 링크(streamclientapp://stack?path=...)로도 열어 준다. 웹이 보낸
  // 값만 들어온다고 볼 수 없어서 브리지 메시지와 같은 기준으로 다시 확인한다. 경로가 `/`로 시작해야
  // origin 뒤에 붙였을 때 `@host` 같은 값으로 다른 호스트를 가리키지 못한다.
  const origin = getOrigin(WEB_URL);
  const url = origin !== "" && isPath(params.path) ? `${origin}${params.path}` : null;
  const button: NavigationButton | null = isNavigationButton(params.button) ? params.button : null;

  // 열 수 없는 주소면 안내만 띄우고, 빠져나갈 수 있게 ←는 항상 둔다.
  const visibleButton = url === null ? "back" : button;

  // X만 있는 화면(신청 결과)은 나가는 길이 X와 웹의 하단 버튼뿐이다. 안드로이드 백 버튼은 X와 같이
  // 스택을 닫는다. 보일 때만 걸어서, 위에 다른 스택 화면이 있으면 그 화면이 백 버튼을 받는다.
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android" || visibleButton !== "close") {
        return;
      }

      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        closeStack();
        return true;
      });

      return () => subscription.remove();
    }, [visibleButton]),
  );

  const handleButtonPress = useCallback(
    (pressed: NavigationButton) => {
      if (pressed === "back") {
        navigation.goBack();
        return;
      }
      closeStack();
    },
    [navigation],
  );

  const handleRetry = useCallback(() => {
    // 루트와 같은 이유로, 다시 띄우는 웹이 색을 알려줄 때까지는 기본값으로 돌아간다.
    setSafeAreaColors(DEFAULT_SAFE_AREA_COLORS);
  }, []);

  return (
    // 세이프에어리어 스트립은 루트(WebViewScreen)와 같은 방식으로 칠한다.
    <View className="flex-1">
      {/* X만 있는 화면은 스와이프 뒤로가기도 끈다. */}
      <Stack.Screen options={{ gestureEnabled: visibleButton !== "close" }} />
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
              "navigation.close": ({ path }) => {
                closeStack();
                if (path !== undefined) {
                  sendBridgeMessage(rootWebViewRef.current, NAVIGATION_NAVIGATE_MESSAGE_TYPE, {
                    path,
                  });
                }
              },
              // 이 화면의 navigation으로 닫아야, 메시지를 늦게 보낸 아래 화면이 맨 위 화면을 닫지 않는다.
              "navigation.pop": () => navigation.goBack(),
              "navigation.push": (screen) => router.push(toStackHref(screen)),
              "navigation.replace": (screen) => router.replace(toStackHref(screen)),
              safeAreaColors: setSafeAreaColors,
            }}
            onRetry={handleRetry}
            shell={{ button, navigation: 1, screen: "stack" }}
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
