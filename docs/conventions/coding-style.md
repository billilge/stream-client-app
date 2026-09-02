# Coding Style

> TypeScript/React Native 코드 작성 시 지키는 공통 컨벤션.

## TypeScript

- `strict: true`. `any` 금지 — 불가피하면 `unknown` + 좁히기.
- 컴포넌트 props·외부에 노출하는 함수는 타입을 명시한다. 내부 지역 변수는 추론에 맡긴다.
- **객체 형태(컴포넌트 Props 등)는 `interface`**, `type`이어야만 하는 것(유니온·유틸리티 조합·별칭·조건부 타입)만 `type`으로 쓴다.
  - 근거: TS 공식 핸드북의 휴리스틱 — *"use `interface` until you need to use features from `type`"*.
  - 참고: [Handbook — Type Aliases vs Interfaces](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces)

## 네이밍

- 컴포넌트 파일/이름: PascalCase (`UserCard.tsx`).
- 훅: `useXxx`. 일반 함수/변수: camelCase. 상수: `UPPER_SNAKE_CASE`.
- 불리언: `is` / `has` / `should` 접두사.
- 폴더: 도메인명 소문자 또는 kebab-case.

## 폴더 구조

- 기능 기반(feature-based) 구조를 쓴다. `src/app/`(expo-router 라우팅 껍데기)·`src/components/ui/`(공용 UI)·`src/hooks/`·`src/lib/`·`src/utils/`·`src/constants/`는 실제로 내용이 생길 때 만든다 — 빈 폴더를 미리 만들지 않는다.
- 화면 단위 기능이 생기면 `src/features/<기능>/`, 여러 화면이 공유하는 서버 계약(API·쿼리·타입)이 생기면 `src/entities/<도메인>/`을 그때 도입한다.
- 라우팅(`src/app/`)은 껍데기만 둔다 — 화면 로직은 `src/features/<기능>/<Name>Screen.tsx`에 두고 라우트 파일에서 import한다.
- import는 절대경로 `@/`(`./src/*`)를 쓴다. 상대경로는 같은 기능 폴더 내부에서만.
- 그룹 순서: ① 외부 라이브러리 → ② `@/` → ③ 상대경로. 저장 시 Biome의 `organizeImports`가 자동 정렬한다.

## 스타일링 (NativeWind)

- 기본 UI는 `className`(NativeWind/Tailwind)으로 스타일링한다. 복잡한 애니메이션·동적 값처럼 불가피한 경우에만 `StyleSheet`를 병행한다.
- 색상·간격 등 디자인 토큰은 `tailwind.config.js`의 `theme.extend`에 정의해 재사용한다.
- 플랫폼 분기: className 우선 → 불가피하면 `Platform.select` 또는 `*.web.tsx` / `*.native.tsx` 파일 분리.

## 에러 / 비동기

- async는 try/catch 또는 서버 상태 라이브러리(도입 시)의 에러 상태로 다룬다. **빈 catch 금지**.
- 사용자에게 보이는 메시지와 개발 로깅을 구분한다.

## 주석

- "왜"를 적는다. "무엇"은 코드로 드러나게 한다.
- 주변 코드의 주석 밀도·언어를 따른다. 불필요한 주석 금지.

## Lint · Format

- **Biome 단일 도구**로 lint + format + import 정리. ESLint/Prettier는 쓰지 않는다.
- `pnpm check` — 검증만 (커밋·PR 전).
- `pnpm check:fix` — 자동 수정 + 포맷.
- 설정·룰셋: `biome.jsonc` 참고.

## 금지

- `console.log` 커밋 금지 (디버깅 후 제거; `console.info`/`warn`/`error`는 허용 — `biome.jsonc`의 `noConsole` 참고).
- 주석 처리된 죽은 코드 커밋 금지.
- 동일 기능 중복 구현 금지 — 새로 만들기 전에 기존 코드부터 검색한다.
