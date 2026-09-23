import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { BackHandler, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { WebViewNavigation } from "react-native-webview";
import { WEB_URL } from "@/constants/config";
import type { ShellInfo } from "@/features/webview/bridge/bridge";
import { DEFAULT_SAFE_AREA_COLORS } from "@/features/webview/bridge/messages/safeAreaColors";
import ShellWebView from "@/features/webview/components/ShellWebView";
import WebViewMessage from "@/features/webview/components/WebViewMessage";
import { rootWebViewRef, toStackHref } from "@/features/webview/stackNavigation";

// 탭 화면 웹뷰에는 앱 버튼이 없다. 하단 탭으로 오가는 화면이라 뒤로가기를 두지 않는다.
const ROOT_SHELL: ShellInfo = { button: null, navigation: 1, screen: "root" };

export default function WebViewScreen() {
  const insets = useSafeAreaInsets();
  const [canGoBack, setCanGoBack] = useState(false);
  const [safeAreaColors, setSafeAreaColors] = useState(DEFAULT_SAFE_AREA_COLORS);

  // 안드로이드 하드웨어 백 버튼은 기본적으로 앱을 종료한다. 웹 히스토리가 남아 있으면 뒤로 보낸다.
  // 루트가 보일 때만 건다 — 리스너는 나중에 등록된 것부터 불리는데, 루트 리스너가 스택 화면 위에서도
  // 살아 있으면 스택 화면을 닫지 않고 가려진 루트 웹뷰가 대신 뒤로 간다.
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") {
        return;
      }

      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        if (!canGoBack) {
          return false;
        }
        rootWebViewRef.current?.goBack();
        return true;
      });

      return () => subscription.remove();
    }, [canGoBack]),
  );

  const handleRetry = useCallback(() => {
    // 다시 띄우는 웹이 색을 알려줄 때까지는 기본값으로 돌아간다 — 실패 직전 화면 색이 남으면
    // 엉뚱한 화면 위에 그 색 스트립이 얹힌다.
    setSafeAreaColors(DEFAULT_SAFE_AREA_COLORS);
  }, []);

  const handleNavigationStateChange = useCallback((navigation: WebViewNavigation) => {
    setCanGoBack(navigation.canGoBack);
  }, []);

  if (!WEB_URL) {
    return (
      <WebViewMessage
        description=".env.example을 .env.local로 복사한 뒤 EXPO_PUBLIC_WEB_URL을 채우고 앱을 다시 실행해 주세요."
        title="웹 주소가 설정되지 않았습니다"
      />
    );
  }

  return (
    // 세이프에어리어는 네이티브가 담당하고 웹은 주어진 영역을 100%로 채우기만 한다.
    // 위아래 스트립은 맞닿는 웹 화면과 같은 색으로 칠해야 경계선이 보이지 않는데,
    // 위아래 색이 서로 다르고 화면마다도 달라서 SafeAreaView 하나로는 칠할 수 없다.
    // 인셋을 직접 재서 나눠 칠하고, 색은 웹이 알려준 값을 쓴다(safeAreaColors.ts 참고).
    <View className="flex-1">
      <View style={{ backgroundColor: safeAreaColors.top, height: insets.top }} />
      <ShellWebView
        // 웹이 보내는 메시지는 브리지가 가려내고, 여기서는 type별로 무엇을 할지만 적는다.
        handlers={{
          // 하단 탭이 없는 화면(상세·신청서 등)은 웹뷰 안에서 넘기지 않고 스택에 쌓는다.
          "navigation.push": (screen) => router.push(toStackHref(screen)),
          // 웹은 화면 배경이 바뀔 때마다 세이프에어리어 스트립 색을 보낸다.
          safeAreaColors: setSafeAreaColors,
        }}
        onNavigationStateChange={handleNavigationStateChange}
        onRetry={handleRetry}
        ref={rootWebViewRef}
        shell={ROOT_SHELL}
        url={WEB_URL}
      />
      <View style={{ backgroundColor: safeAreaColors.bottom, height: insets.bottom }} />
    </View>
  );
}
