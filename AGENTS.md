# AGENTS.md

AI 코딩 에이전트가 이 저장소에서 작업할 때 참고하는 가이드다.

Expo(React Native) + TypeScript 기반 앱/웹 프로젝트.

## 작업 원칙

- 구현 전에 확실하지 않은 것은 반드시 사용자에게 질문한다.
- 요구사항이 여러 방식으로 해석될 수 있으면 임의로 선택하지 말고 선택지를 제시하고 물어본다.
- 컨벤션 문서에 없는 새로운 패턴을 도입해야 할 때, 어디에 둘지 애매할 때도 먼저 확인한다.
- 요청받은 범위만 수정한다. 인접 코드 개선·리팩토링은 임의로 하지 않는다.
- 테스트 코드는 지시하는 사람이 명시적으로 요청하지 않는 이상 작성하지 않는다.

## 코딩 컨벤션

자세한 내용은 `docs/conventions/coding-style.md` 참고. TypeScript strict, 네이밍, 폴더 구조, import 순서, NativeWind 스타일링, Biome lint/format 규칙을 다룬다.

## Git 컨벤션

자세한 내용은 `docs/conventions/git-convention.md` 참고.

- 커밋: `type: 제목` (한글, 마침표 없음). type은 `feat`/`fix`/`refactor`/`docs`/`test`/`chore`/`init`
- 작업 단위별로 커밋을 나눈다
- 커밋 메시지·PR 본문에 `Co-Authored-By: Claude ...`, `Claude-Session: ...` 등 AI 트레일러를 넣지 않는다
- 브랜치: `{type}/#{이슈번호}-{작업내용}`
- PR 제목: `[{Type}/#{이슈번호}] {설명}`, Squash Merge 기본, `main` 직접 push 금지

## 참고 자료

- 아직 채택하지 않은 아키텍처/테스트/툴링 아이디어는 `docs/plans/`에 정리되어 있다 (git에는 올라가지 않음 — `.gitignore` 참고).
