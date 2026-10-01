import { cssInterop } from "nativewind";
import { Pressable } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { NavigationButton } from "@/features/webview/bridge/messages/navigation";

// 아이콘 path는 @wanteddev/wds-icon 3.12.0의 IconChevronLeft·IconClose를 그대로 옮겼다.
// WDS에는 React Native 패키지가 없어 컴포넌트를 가져다 쓸 수 없다.
// @wanteddev/wds-icon — MIT License, Copyright (c) 2026 Wanted Lab, Inc.
const ICON_PATHS: Record<NavigationButton, string> = {
  back: "M16.1363 3.36297C16.4878 3.71444 16.4878 4.28429 16.1363 4.63576L8.77271 11.9994L16.1363 19.363C16.4878 19.7144 16.4878 20.2843 16.1363 20.6358C15.7848 20.9872 15.215 20.9872 14.8635 20.6358L6.86352 12.6358C6.51205 12.2843 6.51205 11.7144 6.86352 11.363L14.8635 3.36297C15.215 3.0115 15.7848 3.0115 16.1363 3.36297Z",
  close:
    "M4.86349 4.86346C5.21496 4.51199 5.78481 4.51199 6.13628 4.86346L11.9999 10.7271L17.8634 4.86346C18.2149 4.51199 18.7848 4.51199 19.1362 4.86346C19.4877 5.21493 19.4877 5.78478 19.1362 6.13625L13.2726 11.9999L19.1362 17.8635C19.4877 18.2149 19.4877 18.7848 19.1362 19.1363C18.7848 19.4877 18.2149 19.4877 17.8634 19.1363L11.9999 13.2727L6.13628 19.1363C5.78481 19.4877 5.21496 19.4877 4.86349 19.1363C4.51202 18.7848 4.51202 18.2149 4.86349 17.8635L10.7271 11.9999L4.86349 6.13625C4.51202 5.78478 4.51202 5.21493 4.86349 4.86346Z",
};

// 웹 헤더의 aria-label과 같게 둔다.
const ACCESSIBILITY_LABELS: Record<NavigationButton, string> = {
  back: "뒤로가기",
  close: "닫기",
};

// WDS 헤더는 ←를 왼쪽, X를 오른쪽에 둔다.
// 크기·위치는 웹과 픽셀 단위로 맞춰야 해서 px로 적는다. NativeWind는 네이티브에서 1rem을 14px로
// 계산해(`inlineRem`) `left-2`·`h-10` 같은 간격 클래스가 웹의 8px·40px와 달라진다.
const POSITION_CLASS_NAMES: Record<NavigationButton, string> = {
  back: "left-[8px]",
  close: "right-[8px]",
};

// WDS 아이콘은 fill="currentColor"로 글자색을 따른다. 같은 방식으로 className의 글자색 토큰을
// Svg의 color로 넘긴다(NativeWind가 ActivityIndicator의 color를 넘기는 것과 같은 매핑).
const IconSvg = cssInterop(Svg, {
  className: { nativeStyleToProp: { color: true }, target: "style" },
});

interface HeaderButtonProps {
  button: NavigationButton;
  onPress: () => void;
}

/**
 * 스택 화면에서 웹 헤더 위에 겹쳐 그리는 ←/X 버튼.
 *
 * 헤더 바·제목은 웹이 그리고 앱은 버튼만 그린다 — 웹뷰가 뜨기 전이나 오류 화면에서도 나갈 수 있게.
 * 자리·크기·색은 웹 헤더(WDS 3.12.0 `TopNavigation` normal + `TopNavigationButton` icon)에 맞춘다.
 *   - 버튼은 헤더 왼쪽(←)·오른쪽(X) 16px, 위 16px에 놓이는 24px 아이콘이다
 *   - 누르면 아이콘을 가운데 둔 40px 원에 Label/Normal이 9% 불투명도로 깔린다
 * 그래서 40px 버튼을 8px 안쪽에 두면 아이콘이 웹과 같은 자리에 오고, 터치 영역도 눌림 원과 같아진다.
 * 웹 헤더 배치가 바뀌면 여기도 같이 맞춰야 한다.
 *
 * 부모는 웹뷰 영역(위 세이프에어리어 스트립 바로 아래)이고, 웹뷰보다 뒤에 렌더링해 위에 겹친다.
 */
export default function HeaderButton({ button, onPress }: HeaderButtonProps) {
  return (
    <Pressable
      accessibilityLabel={ACCESSIBILITY_LABELS[button]}
      accessibilityRole="button"
      className={`absolute top-[8px] h-[40px] w-[40px] items-center justify-center rounded-full active:bg-label-normal/[0.09] ${POSITION_CLASS_NAMES[button]}`}
      onPress={onPress}
    >
      <IconSvg className="text-label-normal" height={24} viewBox="0 0 24 24" width={24}>
        <Path d={ICON_PATHS[button]} fill="currentColor" />
      </IconSvg>
    </Pressable>
  );
}
