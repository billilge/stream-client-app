import { useCallback, useEffect, useRef, useState } from "react";
import { BackHandler, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { WebView, WebViewNavigation } from "react-native-webview";
import { WEB_URL } from "@/constants/config";
import { DEFAULT_SAFE_AREA_COLORS } from "@/features/webview/bridge/messages/safeAreaColors";
import ShellWebView from "@/features/webview/components/ShellWebView";
import WebViewMessage from "@/features/webview/components/WebViewMessage";

export default function WebViewScreen() {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [safeAreaColors, setSafeAreaColors] = useState(DEFAULT_SAFE_AREA_COLORS);

  // 안드로이드 하드웨어 백 버튼은 기본적으로 앱을 종료한다. 웹 히스토리가 남아 있으면 뒤로 보낸다.
  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!canGoBack) {
        return false;
      }
      webViewRef.current?.goBack();
      return true;
    });

    return () => subscription.remove();
  }, [canGoBack]);

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
          // 웹은 화면 배경이 바뀔 때마다 세이프에어리어 스트립 색을 보낸다.
          safeAreaColors: setSafeAreaColors,
        }}
        onNavigationStateChange={handleNavigationStateChange}
        onRetry={handleRetry}
        ref={webViewRef}
        url={WEB_URL}
      />
      <View style={{ backgroundColor: safeAreaColors.bottom, height: insets.bottom }} />
    </View>
  );
}
