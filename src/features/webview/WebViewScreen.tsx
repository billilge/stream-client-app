import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import { WEB_URL } from "@/constants/config";

// WebView는 서드파티 컴포넌트라 NativeWind의 className이 적용되지 않는다. style로 채운다.
const styles = StyleSheet.create({
  webView: { flex: 1 },
});

export default function WebViewScreen() {
  if (!WEB_URL) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-2 bg-white px-6">
        <Text className="font-semibold text-base text-black">웹 주소가 설정되지 않았습니다</Text>
        <Text className="text-center text-neutral-500 text-sm">
          .env.example을 .env.local로 복사한 뒤 EXPO_PUBLIC_WEB_URL을 채우고 앱을 다시 실행해
          주세요.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <View className="flex-1">
        <WebView source={{ uri: WEB_URL }} style={styles.webView} />
      </View>
    </SafeAreaView>
  );
}
