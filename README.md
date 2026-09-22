# stream-client-app

국민대학교 소프트웨어융합대학 통합 플랫폼 'STREAM' 앱 (Expo + React Native + TypeScript).

화면 UI는 [stream-client-web](https://github.com/billilge/stream-client-web)이 전담한다. 이 저장소는 그 웹을 WebView로 띄우는 **네이티브 셸**이다. 앞으로 푸시 알림, 토큰 저장처럼 웹이 할 수 없는 기능을 네이티브에서 맡는다.

## 개발 환경

- Node: `.nvmrc` 참고 (`nvm use`)
- 패키지 매니저: [pnpm](https://pnpm.io/) — Corepack으로 관리한다 (`corepack enable` 후 `pnpm install`만 실행하면 `packageManager` 필드에 고정된 버전이 자동으로 쓰인다)

```bash
corepack enable
pnpm install
cp .env.example .env.local   # 웹 주소를 실행 환경에 맞게 채운다
pnpm start
```

### 웹 주소 설정

WebView가 띄울 주소는 `.env.local`의 `EXPO_PUBLIC_WEB_URL`로 주입한다. 이 파일은 git에 올리지 않는다.

**실행 환경마다 가리켜야 하는 주소가 다르다.**

| 실행 환경 | 웹 주소 |
| --- | --- |
| iOS 시뮬레이터 | `http://localhost:5173` |
| Android 에뮬레이터 | `http://10.0.2.2:5173` |
| 실제 기기 (Expo Go) | `http://{개발 PC의 LAN IP}:5173` |

실제 기기에서는 `localhost`가 기기 자신을 가리켜 개발 PC에 닿지 않으므로 LAN IP를 써야 하고, 웹도 `pnpm dev --host`로 띄워야 한다.

웹을 직접 띄우지 않고 앱만 볼 거라면 배포된 dev 환경을 가리켜도 된다 — `https://dev.stream.billilge.site`

자세한 실행 방법·준비물·트러블슈팅은 **[docs/local-development.md](docs/local-development.md)** 참고.

### 배포 빌드의 웹 주소

`.env.local`은 로컬 실행 전용이다. `EXPO_PUBLIC_*`는 런타임이 아니라 **빌드 시점에 번들에 문자열로 박히고**, `.env.local`은 git에 올라가지 않아 EAS 클라우드 빌드에는 존재하지 않는다. 그래서 배포 빌드의 주소는 `eas.json`의 프로필별 `env`로 주입한다.

| 프로필 | `EXPO_PUBLIC_WEB_URL` |
| --- | --- |
| `development` | 주입하지 않음 — 로컬 metro가 `.env.local`을 읽는다 |
| `preview` | `https://dev.stream.billilge.site` |
| `production` | **아직 비어 있음** — 운영 주소가 정해지면 채운다 |

`production`을 비워 둔 값으로 빌드하면 앱이 "웹 주소가 설정되지 않았습니다" 안내 화면을 띄운다. 잘못된 주소로 조용히 배포되는 것보다 낫다고 보고 일부러 채우지 않았다.

번들에 그대로 박히므로 **비밀값은 `EXPO_PUBLIC_*`에 넣지 않는다.** 웹 주소는 공개돼도 되는 값이라 `eas.json`에 평문으로 둔다.

`eas build`를 실제로 돌리려면 `eas init`으로 `app.json`에 `extra.eas.projectId`가 먼저 채워져야 한다.

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

## 문서

- [로컬 실행 가이드](docs/local-development.md)
- [코딩 컨벤션](docs/conventions/coding-style.md)
- [Git 컨벤션](docs/conventions/git-convention.md)
