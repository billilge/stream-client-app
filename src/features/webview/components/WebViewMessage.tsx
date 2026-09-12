import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface WebViewMessageProps {
  title: string;
  description: string;
  /** 있으면 재시도 버튼을 노출한다. */
  onRetry?: () => void;
}

/** 웹을 띄우지 못했을 때 웹뷰 대신 보여주는 안내 화면. */
export default function WebViewMessage({ title, description, onRetry }: WebViewMessageProps) {
  return (
    <SafeAreaView className="flex-1 items-center justify-center gap-2 bg-white px-6">
      <Text className="font-semibold text-base text-black">{title}</Text>
      <Text className="text-center text-neutral-500 text-sm">{description}</Text>
      {onRetry && (
        <Pressable
          accessibilityRole="button"
          className="mt-4 rounded-lg bg-black px-5 py-3 active:opacity-70"
          onPress={onRetry}
        >
          <View>
            <Text className="font-semibold text-sm text-white">다시 시도</Text>
          </View>
        </Pressable>
      )}
    </SafeAreaView>
  );
}
