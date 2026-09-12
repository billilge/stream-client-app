# stream-client-app

국민대학교 소프트웨어융합대학 통합 플랫폼 'STREAM' 앱 (Expo + React Native + TypeScript).

화면 UI는 [stream-client-web](https://github.com/billilge/stream-client-web)이 전담한다. 이 저장소는 그 웹을 WebView로 띄우는 **네이티브 셸**이다. 앞으로 푸시 알림, 토큰 저장처럼 웹이 할 수 없는 기능을 네이티브에서 맡는다.

## 개발 환경

- Node: `.nvmrc` 참고 (`nvm use`)
- 패키지 매니저: [pnpm](https://pnpm.io/) — Corepack으로 관리한다 (`corepack enable` 후 `pnpm install`만 실행하면 `packageManager` 필드에 고정된 버전이 자동으로 쓰인다)

```bash
corepack enable
pnpm install
cp .env.example .env.local   # 웹 주소를 자기 환경에 맞게 채운다
pnpm start
```

### 웹 주소 설정

WebView가 띄울 주소는 `.env.local`의 `EXPO_PUBLIC_WEB_URL`로 주입한다. 이 파일은 git에 올리지 않는다.

로컬 개발 중에는 `stream-client-web`의 dev 서버를 가리킨다. **`localhost`는 쓸 수 없다** — 기기에서 `localhost`는 기기 자신을 가리키므로 개발 PC에 닿지 않는다. 개발 PC의 LAN IP를 쓰고, 기기와 PC가 같은 네트워크에 있어야 한다.

```bash
ipconfig getifaddr en0   # macOS에서 LAN IP 확인
```

```
EXPO_PUBLIC_WEB_URL=http://192.168.0.2:5173
```

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `pnpm start` | Expo 개발 서버 실행 |
| `pnpm ios` | iOS 시뮬레이터에서 실행 |
| `pnpm android` | Android 에뮬레이터에서 실행 |
| `pnpm web` | 웹에서 실행 |
| `pnpm lint` | Biome lint |
| `pnpm format` | Biome로 포맷 적용 |
| `pnpm check` | Biome lint + format 검증 |

## 구조

```
src/
├─ app/                  expo-router 라우팅 껍데기
├─ features/webview/     WebView 셸 화면
├─ constants/            설정 상수
└─ utils/                공용 유틸
```

컨벤션은 `docs/conventions/` 참고.
