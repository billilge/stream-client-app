/**
 * 웹뷰로 띄울 stream-client-web 주소.
 *
 * 개발 중에는 개발자마다 로컬 dev 서버 주소가 달라 커밋에 박을 수 없으므로
 * `.env.local`의 `EXPO_PUBLIC_WEB_URL`로 주입한다(`.env.example` 참고).
 * `localhost`는 기기에서 기기 자신을 가리키므로 개발 PC의 LAN IP를 써야 한다.
 */
export const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? "";
