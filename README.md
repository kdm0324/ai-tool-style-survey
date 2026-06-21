# AI Tool Style Survey

AI 도구 활용 성향을 알아보는 짧은 정적 웹 설문 MVP다.

## Scope

- React + Vite
- 설문 데이터는 `src/data/survey.json`
- 응답과 결과는 브라우저 `localStorage`에 저장
- 로그인, DB, 개인정보 수집 없음
- GitHub Pages 배포 가능

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## GitHub Pages

repo에 push한 뒤 GitHub에서 Pages source를 `GitHub Actions`로 설정하면 `.github/workflows/deploy.yml`로 배포할 수 있다.

배포 URL은 보통 아래 형식이다.

```text
https://<github-username>.github.io/<repo-name>/
```

현재 repo 이름이 `ai-tool-style-survey`라면 예상 URL은 다음과 같다.

```text
https://<github-username>.github.io/ai-tool-style-survey/
```

실제 username과 repo 공개 여부는 GitHub에서 직접 확인해야 한다.

## Change Survey Content

다른 설문으로 바꾸려면 `src/data/survey.json`의 `questions`, `results`, `shareText`를 수정한다.

## Privacy

서버 전송이 없다. 저장되는 값은 현재 브라우저의 localStorage에만 남는다. 사용자가 `다시 시작`을 누르면 저장된 응답이 삭제된다.
