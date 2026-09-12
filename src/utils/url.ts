/**
 * URL에서 origin(`scheme://host:port`)만 뽑는다.
 *
 * RN에 내장된 `URL` 구현은 불완전해 `origin`/`hostname`을 신뢰할 수 없으므로 직접 파싱한다.
 * 형식을 알아볼 수 없으면 빈 문자열을 돌려준다.
 */
export function getOrigin(url: string): string {
  const matched = url.match(/^[a-zA-Z][\w+.-]*:\/\/[^/?#]*/);
  return matched ? matched[0].toLowerCase() : "";
}

/** 두 URL이 같은 origin인지 판단한다. 어느 한쪽이라도 파싱되지 않으면 false다. */
export function isSameOrigin(a: string, b: string): boolean {
  const originA = getOrigin(a);
  return originA !== "" && originA === getOrigin(b);
}
