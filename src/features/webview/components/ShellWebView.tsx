import * as WebBrowser from "expo-web-browser";
import { type Ref, useCallback, useState } from "react";
import { ActivityIndicator, Linking, StyleSheet, View } from "react-native";
import { WebView, type WebViewNavigation } from "react-native-webview";
import type { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";
import { WEB_URL } from "@/constants/config";
import { type BridgeHandlers, dispatchBridgeMessage } from "@/features/webview/bridge/bridge";
import WebViewMessage from "@/features/webview/components/WebViewMessage";
import { isSameOrigin } from "@/utils/url";

// WebView는 서드파티 컴포넌트라 NativeWind의 className이 적용되지 않는다. style로 채운다.
const styles = StyleSheet.create({
  webView: { flex: 1 },
});

interface ShellWebViewProps {
  /** 띄울 주소. 서비스(`WEB_URL`) 안의 주소다. */
  url: string;
  /** 웹이 보내는 브리지 메시지를 type별로 받는다. */
  handlers: BridgeHandlers;
  onNavigationStateChange?: (navigation: WebViewNavigation) => void;
  /** 오류 화면에서 다시 시도를 눌렀을 때. 화면이 웹에서 받아 둔 상태를 되돌릴 때 쓴다. */
  onRetry?: () => void;
  ref?: Ref<WebView>;
}

/** 서비스 웹을 띄우는 웹뷰. 로딩 표시·오류 화면·외부 링크 처리·브리지 메시지 수신을 맡는다. */
export default function ShellWebView({
  url,
  handlers,
  onNavigationStateChange,
  onRetry,
  ref,
}: ShellWebViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // 오류 화면을 띄우는 동안 WebView는 내려가 있다. 오류를 지우면 새로 마운트되면서 다시 불러온다.
  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    onRetry?.();
  }, [onRetry]);

  // 서비스 바깥 주소는 웹뷰 안에서 열지 않고 시스템 브라우저·기본 앱으로 넘긴다.
  const handleShouldStartLoad = useCallback((request: ShouldStartLoadRequest) => {
    const { url: requestUrl } = request;

    if (requestUrl.startsWith("about:") || isSameOrigin(requestUrl, WEB_URL)) {
      return true;
    }

    const open =
      requestUrl.startsWith("http://") || requestUrl.startsWith("https://")
        ? WebBrowser.openBrowserAsync(requestUrl)
        : Linking.openURL(requestUrl);

    open.catch((error) => {
      console.warn(`외부 링크를 열지 못했습니다: ${requestUrl}`, error);
    });

    return false;
  }, []);

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
    <View className="flex-1">
      <WebView
        onError={() => setHasError(true)}
        // 이미지·스크립트 같은 하위 리소스 실패까지 오류 화면으로 넘기지 않도록 본문 요청만 본다.
        onHttpError={({ nativeEvent }) => {
          if (nativeEvent.url === url) {
            setHasError(true);
          }
        }}
        onLoadEnd={() => setIsLoading(false)}
        onLoadStart={() => setIsLoading(true)}
        onMessage={(event) => dispatchBridgeMessage(event.nativeEvent.data, handlers)}
        onNavigationStateChange={onNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        ref={ref}
        source={{ uri: url }}
        style={styles.webView}
      />
      {isLoading && (
        <View className="absolute inset-0 items-center justify-center bg-white">
          <ActivityIndicator size="large" />
        </View>
      )}
    </View>
  );
}
