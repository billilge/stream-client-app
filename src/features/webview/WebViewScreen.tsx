import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Linking, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView, type WebViewMessageEvent, type WebViewNavigation } from "react-native-webview";
import type { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";
import { WEB_URL } from "@/constants/config";
import { dispatchBridgeMessage } from "@/features/webview/bridge/bridge";
import { DEFAULT_SAFE_AREA_COLORS } from "@/features/webview/bridge/messages/safeAreaColors";
import WebViewMessage from "@/features/webview/components/WebViewMessage";
import { isSameOrigin } from "@/utils/url";

// WebView는 서드파티 컴포넌트라 NativeWind의 className이 적용되지 않는다. style로 채운다.
const styles = StyleSheet.create({
  webView: { flex: 1 },
});

export default function WebViewScreen() {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
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
    setHasError(false);
    setIsLoading(true);
    // 다시 띄우는 웹이 색을 알려줄 때까지는 기본값으로 돌아간다 — 실패 직전 화면 색이 남으면
    // 엉뚱한 화면 위에 그 색 스트립이 얹힌다.
    setSafeAreaColors(DEFAULT_SAFE_AREA_COLORS);
    webViewRef.current?.reload();
  }, []);

  const handleNavigationStateChange = useCallback((navigation: WebViewNavigation) => {
    setCanGoBack(navigation.canGoBack);
  }, []);

  // 웹이 보내는 메시지는 브리지가 가려내고, 여기서는 type별로 무엇을 할지만 적는다.
  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    dispatchBridgeMessage(event.nativeEvent.data, {
      // 웹은 화면 배경이 바뀔 때마다 세이프에어리어 스트립 색을 보낸다.
      safeAreaColors: setSafeAreaColors,
    });
  }, []);

  // 서비스 바깥 주소는 웹뷰 안에서 열지 않고 시스템 브라우저·기본 앱으로 넘긴다.
  const handleShouldStartLoad = useCallback((request: ShouldStartLoadRequest) => {
    const { url } = request;

    if (url.startsWith("about:") || isSameOrigin(url, WEB_URL)) {
      return true;
    }

    const open =
      url.startsWith("http://") || url.startsWith("https://")
        ? WebBrowser.openBrowserAsync(url)
        : Linking.openURL(url);

    open.catch((error) => {
      console.warn(`외부 링크를 열지 못했습니다: ${url}`, error);
    });

    return false;
  }, []);

  if (!WEB_URL) {
    return (
      <WebViewMessage
        description=".env.example을 .env.local로 복사한 뒤 EXPO_PUBLIC_WEB_URL을 채우고 앱을 다시 실행해 주세요."
        title="웹 주소가 설정되지 않았습니다"
      />
    );
  }

  if (hasError) {
    return (
      <WebViewMessage
        description="네트워크 연결을 확인한 뒤 다시 시도해 주세요."
        onRetry={handleRetry}
        title="페이지를 불러오지 못했습니다"
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
      <View className="flex-1">
        <WebView
          onError={() => setHasError(true)}
          // 이미지·스크립트 같은 하위 리소스 실패까지 오류 화면으로 넘기지 않도록 본문 요청만 본다.
          onHttpError={({ nativeEvent }) => {
            if (nativeEvent.url === WEB_URL) {
              setHasError(true);
            }
          }}
          onLoadEnd={() => setIsLoading(false)}
          onLoadStart={() => setIsLoading(true)}
          onMessage={handleMessage}
          onNavigationStateChange={handleNavigationStateChange}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          ref={webViewRef}
          source={{ uri: WEB_URL }}
          style={styles.webView}
        />
        {isLoading && (
          <View className="absolute inset-0 items-center justify-center bg-white">
            <ActivityIndicator size="large" />
          </View>
        )}
      </View>
      <View style={{ backgroundColor: safeAreaColors.bottom, height: insets.bottom }} />
    </View>
  );
}
