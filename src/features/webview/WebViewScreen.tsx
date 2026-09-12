import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { WEB_URL } from "@/constants/config";
import WebViewMessage from "@/features/webview/components/WebViewMessage";

// WebView는 서드파티 컴포넌트라 NativeWind의 className이 적용되지 않는다. style로 채운다.
const styles = StyleSheet.create({
  webView: { flex: 1 },
});

export default function WebViewScreen() {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    webViewRef.current?.reload();
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
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
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
    </SafeAreaView>
  );
}
