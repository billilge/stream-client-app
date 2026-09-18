# 로컬 실행 가이드

> 이 앱은 `stream-client-web`을 WebView로 띄우는 셸이다. 따라서 **웹 서버와 앱을 함께 띄워야** 화면이 보인다.

---

## 1. 준비

```bash
corepack enable
pnpm install
cp .env.example .env.local
```

`.env.local`의 `EXPO_PUBLIC_WEB_URL`에 웹 주소를 넣는다. **실행 환경마다 주소가 다르다** — 아래 표 참고.

| 실행 환경 | 웹 주소 | 비고 |
| --- | --- | --- |
| iOS 시뮬레이터 | `http://localhost:5173` | 시뮬레이터가 맥의 네트워크를 그대로 쓴다 |
| Android 에뮬레이터 | `http://10.0.2.2:5173` | `10.0.2.2`가 호스트 PC의 `localhost`에 매핑된다 |
| 실제 기기 (Expo Go) | `http://{개발 PC의 LAN IP}:5173` | 기기와 PC가 같은 네트워크에 있어야 한다 |

LAN IP 확인:

```bash
ipconfig getifaddr en0   # 유선이면 en1 등 다른 인터페이스일 수 있다
```

## 2. 웹 서버 띄우기

별도 터미널에서 `stream-client-web`을 실행한다.

```bash
cd ../stream-client-web
pnpm dev
```

**실제 기기로 볼 때는 `--host`가 필요하다.** Vite dev 서버는 기본적으로 `localhost`에만 바인딩해서 다른 기기에서 닿지 않는다.

```bash
pnpm dev --host
```

## 3. 앱 실행

```bash
pnpm start      # QR 코드가 뜬다
pnpm ios        # iOS 시뮬레이터로 바로 실행
pnpm android    # Android 에뮬레이터로 바로 실행
pnpm web        # 브라우저에서 실행
```

`.env.local`을 고쳤으면 **Expo 개발 서버를 재시작해야 반영된다.** `EXPO_PUBLIC_*` 값은 번들 시점에 주입되기 때문이다.

---

## 실행 환경별 준비물

### 실제 기기 (권장 — 준비물이 가장 적다)

기기에 **Expo Go** 앱만 설치하면 된다 (App Store / Play Store). `react-native-webview`는 Expo Go에 포함되어 있어 별도 네이티브 빌드가 필요 없다.

1. `pnpm start`
2. 터미널의 QR 코드를 스캔 — iOS는 기본 카메라 앱, Android는 Expo Go 앱 안에서
3. 기기와 PC가 같은 와이파이에 있어야 한다

### iOS 시뮬레이터

**Xcode가 필요하다** (App Store에서 설치, 용량이 크고 시간이 오래 걸린다). Command Line Tools만으로는 시뮬레이터가 없다.

```bash
xcode-select -p                          # /Applications/Xcode.app/... 이 나와야 한다
xcrun simctl list devices available      # 사용 가능한 시뮬레이터 목록
pnpm ios
```

`xcode-select -p`가 `/Library/Developer/CommandLineTools`를 가리키면 Xcode 설치 후 아래를 실행한다.

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

### Android 에뮬레이터

**Android Studio가 필요하다.** 설치 후 Device Manager에서 가상 기기(AVD)를 하나 만든다.

```bash
emulator -list-avds   # 만든 AVD 목록
pnpm android
```

### 웹 (`pnpm web`)

브라우저에서 `react-native-web`으로 렌더링된다. 화면 확인용으로는 쓸 수 있지만 **하드웨어 백 버튼, 외부 링크 처리 같은 네이티브 동작은 검증되지 않는다.** 최종 확인은 기기나 시뮬레이터에서 한다.

---

## 확인할 것

셸이 제대로 동작하는지 보려면 아래를 확인한다.

- [ ] 웹 화면이 뜨는가
- [ ] 로드 중 스피너가 보이고, 로드되면 사라지는가
- [ ] Bottom Nav로 화면을 옮긴 뒤 **Android 하드웨어 백 버튼**이 앱 종료가 아니라 웹 뒤로 가기로 동작하는가 (Android 전용)
- [ ] 네트워크를 끊고 앱을 다시 열면 오류 화면과 `다시 시도` 버튼이 뜨는가
- [ ] 외부 도메인 링크가 웹뷰 안이 아니라 시스템 브라우저로 열리는가

> 현재 웹의 `ScreenLayout`이 `375x812` 고정 프레임이라 화면이 꽉 차지 않고 가운데 정렬된 채 여백이 생긴다. 알려진 사항이며 web 레포에서 별도로 대응한다.

---

## 잘 안 될 때

| 증상 | 원인 / 해결 |
| --- | --- |
| "웹 주소가 설정되지 않았습니다" 화면 | `.env.local`에 `EXPO_PUBLIC_WEB_URL`이 없다. 채운 뒤 Expo 서버를 **재시작**한다 |
| "페이지를 불러오지 못했습니다" 화면 | 웹 dev 서버가 꺼져 있거나, 주소가 실행 환경과 맞지 않는다(위 표 확인) |
| 실제 기기에서만 안 닿는다 | 웹을 `pnpm dev --host`로 띄웠는지, 기기와 PC가 같은 네트워크인지, 맥 방화벽이 막고 있지 않은지 확인 |
| `.env.local`을 고쳤는데 그대로다 | `EXPO_PUBLIC_*`은 번들 시점에 주입된다. Expo 개발 서버를 재시작한다 |
| LAN IP가 자꾸 바뀐다 | 공유기가 DHCP로 새 IP를 준 것이다. `ipconfig getifaddr en0`로 다시 확인해 `.env.local`을 갱신한다 |

> 로컬 `http://` 접속은 Expo Go에서 동작한다. 나중에 자체 개발 빌드(EAS)로 넘어가면 iOS ATS 예외 설정이 필요할 수 있다.
