# Survey Lab

가볍게 공유할 수 있는 자기 탐색형 정적 웹 설문 모음이다.

## Scope

- React + Vite
- 설문 데이터는 `src/data/*.json`
- `/ai-tool-style`: AI 도구 활용 성향 테스트
- `/faith-style`: 신앙 스타일 테스트
- 응답과 결과는 설문별 브라우저 `localStorage`에 저장
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

현재는 GitHub Pages source가 `main / root`로 동작하는 경우에도 바로 보이도록, `npm run build` 결과의 `index.html`과 `assets/`를 루트에 함께 커밋한다.

배포 URL은 보통 아래 형식이다.

```text
https://<github-username>.github.io/<repo-name>/
```

현재 repo 이름이 `ai-tool-style-survey`라면 URL은 다음과 같다.

```text
https://<github-username>.github.io/ai-tool-style-survey/
https://<github-username>.github.io/ai-tool-style-survey/ai-tool-style/
https://<github-username>.github.io/ai-tool-style-survey/faith-style/
```

실제 username과 repo 공개 여부는 GitHub에서 직접 확인해야 한다.

## Change Survey Content

새 설문을 추가하려면 `src/data/*.json`에 설문 데이터를 추가하고 `src/App.tsx`의 `SURVEYS`에 경로와 화면 문구를 등록한다.

## Privacy

서버 전송이 없다. 저장되는 값은 현재 브라우저의 localStorage에만 남는다. 사용자가 `다시 시작`을 누르면 저장된 응답이 삭제된다.
