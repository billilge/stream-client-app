/**
 * 웹뷰로 띄울 stream-client-web 주소.
 *
 * 개발 중에는 실행 환경(시뮬레이터·에뮬레이터·실제 기기)마다 가리켜야 하는 주소가 달라
 * 커밋에 박을 수 없으므로 `.env.local`의 `EXPO_PUBLIC_WEB_URL`로 주입한다.
 * 환경별 주소는 `docs/local-development.md` 참고.
 */
export const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? "";
