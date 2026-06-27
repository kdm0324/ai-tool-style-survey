import { useEffect, useMemo, useState } from "react";
import aiSurveyJson from "./data/ai-tool-style.json";
import faithSurveyJson from "./data/faith-style.json";
import {
  buildAnonymousResultPayload,
  downloadAnonymousResultCsv,
  hasAnalyticsEndpoint,
  submitAnonymousResult,
} from "./analytics";
import { clearSurveyState, loadSurveyState, saveSurveyState } from "./storage";
import type { ResultKey, SurveyData } from "./types";

type SurveyKey = "ai-tool-style" | "faith-style";

type SurveyConfig = {
  key: SurveyKey;
  path: string;
  survey: SurveyData;
  badge: string;
  landingTitle: string;
  landingDescription: string;
  startLabel: string;
  coreTitle: string;
  coreSubtitle: string;
  visualTags: Record<ResultKey, string>;
  archetypeNames: Record<ResultKey, string>;
  resultBadge: string;
  strengthsTitle: string;
  nextStepTitle: string;
  scoreTitle: string;
  footerBrand: string;
};

const SURVEYS: Record<SurveyKey, SurveyConfig> = {
  "ai-tool-style": {
    key: "ai-tool-style",
    path: "/ai-tool-style",
    survey: aiSurveyJson as SurveyData,
    badge: "AI Collaboration Style Test",
    landingTitle: "나는 어떤 방식으로 AI와 협업할까?",
    landingDescription:
      "AI 도구를 업무에 도입하는 고유한 성향을 진단합니다. 8개의 질문을 통해 핵심 강점과 맞춤형 액션 플랜을 즉시 확인해보세요.",
    startLabel: "성향 분석 시작하기",
    coreTitle: "AI",
    coreSubtitle: "WORKFLOW",
    visualTags: {
      architect: "Architect",
      maker: "Maker",
      researcher: "Researcher",
      operator: "Operator",
      curator: "Curator",
    },
    archetypeNames: {
      architect: "Architect",
      maker: "Maker",
      researcher: "Researcher",
      operator: "Operator",
      curator: "Curator",
    },
    resultBadge: "ANALYSIS REPORT",
    strengthsTitle: "핵심 강점",
    nextStepTitle: "다음 추천 액션",
    scoreTitle: "유형별 매치 스코어",
    footerBrand: "AI-Tool-Style",
  },
  "faith-style": {
    key: "faith-style",
    path: "/faith-style",
    survey: faithSurveyJson as SurveyData,
    badge: "Faith Style Reflection",
    landingTitle: "나는 어떤 방식으로 신앙을 살아낼까?",
    landingDescription:
      "말씀, 기도, 섬김, 묵상, 공동체 안에서 내가 자연스럽게 힘을 얻는 방식을 살펴봅니다. 8개의 질문을 통해 지금의 신앙 스타일과 이번 주 작은 실천을 확인해보세요.",
    startLabel: "신앙 스타일 확인하기",
    coreTitle: "FAITH",
    coreSubtitle: "STYLE",
    visualTags: {
      architect: "말씀",
      maker: "섬김",
      researcher: "묵상",
      operator: "기도",
      curator: "공동체",
    },
    archetypeNames: {
      architect: "Word",
      maker: "Service",
      researcher: "Reflection",
      operator: "Prayer",
      curator: "Community",
    },
    resultBadge: "REFLECTION REPORT",
    strengthsTitle: "핵심 강점",
    nextStepTitle: "이번 주 작은 실천",
    scoreTitle: "유형별 매치 스코어",
    footerBrand: "Faith Style Survey",
  },
};

const SURVEY_KEYS = Object.keys(SURVEYS) as SurveyKey[];

function getSurveyKeyFromPath() {
  const segments = window.location.pathname.split("/").filter(Boolean);
  return SURVEY_KEYS.find((key) => segments.includes(key)) ?? null;
}

function getBasePath() {
  const segments = window.location.pathname.split("/").filter(Boolean);
  const surveyIndex = segments.findIndex((segment) => SURVEY_KEYS.includes(segment as SurveyKey));
  if (surveyIndex >= 0) {
    return `/${segments.slice(0, surveyIndex).join("/")}`;
  }

  return segments.length > 0 ? `/${segments[0]}` : "";
}

function getSurveyUrl(key: SurveyKey) {
  return `${getBasePath()}${SURVEYS[key].path}`;
}

function calculateResult(survey: SurveyData, answers: Record<string, string>) {
  const scores: Record<ResultKey, number> = {
    architect: 0,
    maker: 0,
    researcher: 0,
    operator: 0,
    curator: 0,
  };

  for (const question of survey.questions) {
    const selectedId = answers[question.id];
    const option = question.options.find((item) => item.id === selectedId);
    if (!option) continue;

    for (const [key, value] of Object.entries(option.scores)) {
      scores[key as ResultKey] += value ?? 0;
    }
  }

  const resultKey = (Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "architect") as ResultKey;
  return { resultKey, scores, result: survey.results[resultKey] };
}

const ARCHETYPE_STYLES: Record<
  ResultKey,
  { color: string; gradient: string; shadow: string }
> = {
  architect: {
    color: "var(--cyan)",
    gradient: "linear-gradient(135deg, rgba(56, 227, 255, 0.2) 0%, rgba(90, 160, 255, 0.05) 100%)",
    shadow: "0 8px 32px rgba(56, 227, 255, 0.15)",
  },
  maker: {
    color: "var(--green)",
    gradient: "linear-gradient(135deg, rgba(98, 232, 183, 0.2) 0%, rgba(90, 160, 255, 0.05) 100%)",
    shadow: "0 8px 32px rgba(98, 232, 183, 0.15)",
  },
  researcher: {
    color: "var(--violet)",
    gradient: "linear-gradient(135deg, rgba(182, 156, 255, 0.2) 0%, rgba(90, 160, 255, 0.05) 100%)",
    shadow: "0 8px 32px rgba(182, 156, 255, 0.15)",
  },
  operator: {
    color: "var(--amber)",
    gradient: "linear-gradient(135deg, rgba(255, 203, 90, 0.2) 0%, rgba(90, 160, 255, 0.05) 100%)",
    shadow: "0 8px 32px rgba(255, 203, 90, 0.15)",
  },
  curator: {
    color: "var(--rose)",
    gradient: "linear-gradient(135deg, rgba(255, 120, 139, 0.2) 0%, rgba(90, 160, 255, 0.05) 100%)",
    shadow: "0 8px 32px rgba(255, 120, 139, 0.15)",
  },
};

function SurveyHub() {
  return (
    <main className="app-shell">
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />
      <div className="bg-glow bg-glow-3" />

      <header className="app-header">
        <div className="header-inner">
          <span className="logo-badge">Survey Lab</span>
          <h1 className="main-title">스타일 테스트 모음</h1>
          <p className="main-subtitle">가볍게 공유할 수 있는 자기 탐색형 설문을 한곳에 모읍니다.</p>
        </div>
      </header>

      <div className="content-container">
        <section className="landing-card card-glow">
          <div className="landing-details">
            <h2>어떤 테스트를 해볼까요?</h2>
            <p className="landing-desc">
              각 설문은 브라우저에만 응답을 저장합니다. 로그인, 서버 저장, 개인정보 수집은 없습니다.
            </p>

            <div className="survey-link-grid">
              {SURVEY_KEYS.map((key) => {
                const config = SURVEYS[key];
                return (
                  <a key={key} className="survey-link-card" href={getSurveyUrl(key)}>
                    <span>{config.badge}</span>
                    <strong>{config.survey.title}</strong>
                    <p>{config.survey.subtitle}</p>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SurveyPage({ config }: { config: SurveyConfig }) {
  const survey = config.survey;
  const [answers, setAnswers] = useState<Record<string, string>>(() => loadSurveyState(survey.id).answers);
  const [isStarted, setIsStarted] = useState<boolean>(() => {
    const saved = loadSurveyState(survey.id);
    return saved.answers && Object.keys(saved.answers).length > 0;
  });
  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = loadSurveyState(survey.id);
    const len = Object.keys(saved.answers ?? {}).length;
    return Math.min(len, survey.questions.length - 1);
  });
  const [copied, setCopied] = useState(false);
  const [statsConsent, setStatsConsent] = useState(false);
  const [statsMessage, setStatsMessage] = useState("");
  const [isSubmittingStats, setIsSubmittingStats] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const isComplete = answeredCount === survey.questions.length;
  const currentQuestion = survey.questions[currentIndex];
  const progress = Math.round((answeredCount / survey.questions.length) * 100);
  const resultState = useMemo(() => calculateResult(survey, answers), [answers, survey]);
  const anonymousPayload = useMemo(
    () =>
      buildAnonymousResultPayload({
        survey,
        resultKey: resultState.resultKey,
        scores: resultState.scores,
      }),
    [resultState.resultKey, resultState.scores, survey],
  );

  useEffect(() => {
    document.title = survey.title;
  }, [survey.title]);

  useEffect(() => {
    saveSurveyState(survey.id, {
      answers,
      completedAt: isComplete ? new Date().toISOString() : undefined,
    });
  }, [answers, isComplete, survey.id]);

  function startSurvey() {
    setIsStarted(true);
    setAnswers({});
    setCurrentIndex(0);
    setCopied(false);
  }

  function selectAnswer(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    setCopied(false);

    const nextIndex = Math.min(currentIndex + 1, survey.questions.length - 1);
    if (currentIndex < survey.questions.length - 1) {
      window.setTimeout(() => setCurrentIndex(nextIndex), 220);
    }
  }

  function resetSurvey() {
    clearSurveyState(survey.id);
    setAnswers({});
    setCurrentIndex(0);
    setIsStarted(false);
    setCopied(false);
    setStatsConsent(false);
    setStatsMessage("");
    setIsSubmittingStats(false);
  }

  async function shareResult() {
    const text = survey.shareText.replace("{resultTitle}", resultState.result.title);
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: survey.title, text, url });
        return;
      } catch {
        // Fallback to clipboard if share cancelled.
      }
    }

    await navigator.clipboard.writeText(`${text}\n${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  async function saveAnonymousStats() {
    if (!statsConsent) {
      setStatsMessage("익명 통계 제공에 동의하면 저장할 수 있습니다.");
      return;
    }

    setIsSubmittingStats(true);
    setStatsMessage("");

    try {
      const result = await submitAnonymousResult(anonymousPayload);
      setStatsMessage(result.message);
    } catch {
      setStatsMessage("저장 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmittingStats(false);
    }
  }

  const maxScore = useMemo(() => {
    const values = Object.values(resultState.scores);
    return Math.max(...values, 1);
  }, [resultState.scores]);

  return (
    <main className="app-shell">
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />
      <div className="bg-glow bg-glow-3" />

      <header className={`app-header ${isStarted && !isComplete ? "compact" : ""}`}>
        <div className="header-inner">
          <a className="home-link" href={getBasePath() || "/"}>← 전체 테스트</a>
          <span className="logo-badge">{config.badge}</span>
          <h1 className="main-title">{survey.title}</h1>
          {!isStarted && <p className="main-subtitle">{survey.subtitle}</p>}
        </div>
      </header>

      <div className="content-container">
        {!isStarted && answeredCount === 0 ? (
          <section className="landing-card card-glow">
            <div className="landing-hero-visual">
              <div className="visual-circle circle-1">
                <span className="visual-tag tag-arch">{config.visualTags.architect}</span>
              </div>
              <div className="visual-circle circle-2">
                <span className="visual-tag tag-maker">{config.visualTags.maker}</span>
              </div>
              <div className="visual-circle circle-3">
                <span className="visual-tag tag-res">{config.visualTags.researcher}</span>
              </div>
              <div className="visual-circle circle-4">
                <span className="visual-tag tag-op">{config.visualTags.operator}</span>
              </div>
              <div className="visual-circle circle-5">
                <span className="visual-tag tag-cur">{config.visualTags.curator}</span>
              </div>
              <div className="visual-core">
                <strong>{config.coreTitle}</strong>
                <span>{config.coreSubtitle}</span>
              </div>
            </div>

            <div className="landing-details">
              <h2>{config.landingTitle}</h2>
              <p className="landing-desc">{config.landingDescription}</p>

              <button className="start-btn pulse-effect" onClick={startSurvey}>
                {config.startLabel}
                <span className="arrow-icon">→</span>
              </button>

              <div className="feature-chips">
                <div className="chip">
                  <span className="chip-icon">⏱️</span>
                  <span>소요시간 3분</span>
                </div>
                <div className="chip">
                  <span className="chip-icon">💾</span>
                  <span>응답은 기기에만 저장</span>
                </div>
                <div className="chip">
                  <span className="chip-icon">📊</span>
                  <span>5가지 결과 유형</span>
                </div>
              </div>
            </div>
          </section>
        ) : !isComplete ? (
          <section className="survey-panel card-glow">
            <div className="panel-header">
              <div className="progress-container">
                <div className="progress-meta">
                  <span className="progress-label">테스트 진행률</span>
                  <span className="progress-percent">{progress}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="question-indicator">
                <span>QUESTION</span>
                <strong>{currentIndex + 1} / {survey.questions.length}</strong>
              </div>
            </div>

            <div className="question-content">
              <h2 className="question-text">{currentQuestion.text}</h2>

              <div className="options-grid">
                {currentQuestion.options.map((option, index) => {
                  const letter = ["A", "B", "C", "D"][index] ?? "•";
                  const isSelected = answers[currentQuestion.id] === option.id;
                  return (
                    <button
                      key={option.id}
                      className={`option-card ${isSelected ? "selected" : ""}`}
                      onClick={() => selectAnswer(currentQuestion.id, option.id)}
                    >
                      <span className="option-letter">{letter}</span>
                      <span className="option-label">{option.label}</span>
                      {isSelected && <span className="option-check">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="panel-actions">
              {answeredCount > 0 && (
                <button className="reset-btn-link" onClick={resetSurvey}>
                  처음부터 다시 하기
                </button>
              )}
              <span className="save-status">🔒 모든 응답은 실시간으로 저장됩니다.</span>
            </div>
          </section>
        ) : (
          <section className="result-panel card-glow">
            <div className="result-header-badge">
              <span>{config.resultBadge}</span>
            </div>

            <div
              className="result-profile-card"
              style={{
                background: ARCHETYPE_STYLES[resultState.resultKey].gradient,
                boxShadow: ARCHETYPE_STYLES[resultState.resultKey].shadow,
                border: `1px solid ${ARCHETYPE_STYLES[resultState.resultKey].color}33`,
              }}
            >
              <div className="profile-badge" style={{ color: ARCHETYPE_STYLES[resultState.resultKey].color }}>
                {config.archetypeNames[resultState.resultKey]}
              </div>
              <h2 className="profile-title">{resultState.result.title}</h2>
              <p className="profile-headline">{resultState.result.headline}</p>
              <div className="profile-divider" style={{ background: ARCHETYPE_STYLES[resultState.resultKey].color }} />
              <p className="profile-desc">{resultState.result.description}</p>
            </div>

            <div className="result-details-grid">
              <div className="detail-card">
                <h3 className="detail-title">{config.strengthsTitle}</h3>
                <ul className="strength-list">
                  {resultState.result.strengths.map((strength, index) => (
                    <li key={index} className="strength-item">
                      <span className="bullet" style={{ color: ARCHETYPE_STYLES[resultState.resultKey].color }}>✦</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="detail-card highlight-border" style={{ borderColor: `${ARCHETYPE_STYLES[resultState.resultKey].color}44` }}>
                <h3 className="detail-title">{config.nextStepTitle}</h3>
                <p className="next-step-text">{resultState.result.nextStep}</p>
              </div>
            </div>

            <div className="chart-container">
              <h3 className="chart-title">{config.scoreTitle}</h3>
              <div className="score-bars">
                {Object.entries(resultState.scores)
                  .sort((a, b) => b[1] - a[1])
                  .map(([key, value]) => {
                    const isWinner = key === resultState.resultKey;
                    const typeKey = key as ResultKey;
                    const style = ARCHETYPE_STYLES[typeKey];
                    const pct = Math.max(12, Math.round((value / maxScore) * 100));

                    return (
                      <div key={key} className={`score-bar-row ${isWinner ? "winner" : ""}`}>
                        <div className="bar-info">
                          <span className="bar-name">{survey.results[typeKey].title}</span>
                          <span className="bar-value">{value}점</span>
                        </div>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{
                              width: `${pct}%`,
                              background: style.color,
                              boxShadow: `0 0 12px ${style.color}55`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="analytics-panel">
              <div className="analytics-copy">
                <h3>익명 통계 제공</h3>
                <p>
                  이름, 이메일, 연락처 없이 설문 ID, 결과 유형, 점수, 완료 시각만 저장합니다.
                  {hasAnalyticsEndpoint()
                    ? " 현재 서버 통계 저장소로 전송할 수 있습니다."
                    : " 현재 서버 저장소가 없어 이 브라우저에만 저장됩니다."}
                </p>
              </div>

              <label className="consent-row">
                <input
                  type="checkbox"
                  checked={statsConsent}
                  onChange={(event) => {
                    setStatsConsent(event.target.checked);
                    setStatsMessage("");
                  }}
                />
                <span>익명 결과를 통계 개선 목적으로 저장하는 데 동의합니다.</span>
              </label>

              <div className="analytics-actions">
                <button className="stats-save-btn" onClick={saveAnonymousStats} disabled={isSubmittingStats}>
                  {isSubmittingStats ? "저장 중..." : "익명 결과 저장"}
                </button>
                <button className="csv-download-btn" onClick={() => downloadAnonymousResultCsv(anonymousPayload)}>
                  CSV 다운로드
                </button>
              </div>

              {statsMessage && <p className="stats-message">{statsMessage}</p>}
            </div>

            <div className="result-actions">
              <button className="share-btn pulse-effect" onClick={shareResult}>
                결과 공유하기
              </button>
              <button className="restart-btn" onClick={resetSurvey}>
                다시 테스트하기
              </button>
            </div>

            {copied && (
              <div className="toast-notification">
                <span>📋 공유 텍스트와 링크가 복사되었습니다!</span>
              </div>
            )}
          </section>
        )}
      </div>

      <footer className="app-footer-info">
        <p>{survey.description}</p>
        <p className="footer-sub">© {new Date().getFullYear()} {config.footerBrand}. 응답은 기기 로컬 스토리지에만 저장됩니다.</p>
      </footer>
    </main>
  );
}

function App() {
  const surveyKey = getSurveyKeyFromPath();

  if (!surveyKey) {
    return <SurveyHub />;
  }

  return <SurveyPage config={SURVEYS[surveyKey]} />;
}

export default App;
