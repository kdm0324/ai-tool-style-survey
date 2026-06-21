import { useEffect, useMemo, useState } from "react";
import surveyJson from "./data/survey.json";
import { clearSurveyState, loadSurveyState, saveSurveyState } from "./storage";
import type { ResultKey, SurveyData } from "./types";

const survey = surveyJson as SurveyData;

function calculateResult(answers: Record<string, string>) {
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
  { name: string; color: string; gradient: string; shadow: string }
> = {
  architect: {
    name: "Architect",
    color: "var(--cyan)",
    gradient: "linear-gradient(135deg, rgba(56, 227, 255, 0.2) 0%, rgba(90, 160, 255, 0.05) 100%)",
    shadow: "0 8px 32px rgba(56, 227, 255, 0.15)",
  },
  maker: {
    name: "Maker",
    color: "var(--green)",
    gradient: "linear-gradient(135deg, rgba(98, 232, 183, 0.2) 0%, rgba(90, 160, 255, 0.05) 100%)",
    shadow: "0 8px 32px rgba(98, 232, 183, 0.15)",
  },
  researcher: {
    name: "Researcher",
    color: "var(--violet)",
    gradient: "linear-gradient(135deg, rgba(182, 156, 255, 0.2) 0%, rgba(90, 160, 255, 0.05) 100%)",
    shadow: "0 8px 32px rgba(182, 156, 255, 0.15)",
  },
  operator: {
    name: "Operator",
    color: "var(--amber)",
    gradient: "linear-gradient(135deg, rgba(255, 203, 90, 0.2) 0%, rgba(90, 160, 255, 0.05) 100%)",
    shadow: "0 8px 32px rgba(255, 203, 90, 0.15)",
  },
  curator: {
    name: "Curator",
    color: "var(--rose)",
    gradient: "linear-gradient(135deg, rgba(255, 120, 139, 0.2) 0%, rgba(90, 160, 255, 0.05) 100%)",
    shadow: "0 8px 32px rgba(255, 120, 139, 0.15)",
  },
};

function App() {
  const [answers, setAnswers] = useState<Record<string, string>>(() => loadSurveyState().answers);
  const [isStarted, setIsStarted] = useState<boolean>(() => {
    const saved = loadSurveyState();
    return saved.answers && Object.keys(saved.answers).length > 0;
  });
  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = loadSurveyState();
    const len = Object.keys(saved.answers ?? {}).length;
    return Math.min(len, survey.questions.length - 1);
  });
  const [copied, setCopied] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const isComplete = answeredCount === survey.questions.length;
  const currentQuestion = survey.questions[currentIndex];
  const progress = Math.round((answeredCount / survey.questions.length) * 100);
  const resultState = useMemo(() => calculateResult(answers), [answers]);

  useEffect(() => {
    saveSurveyState({
      answers,
      completedAt: isComplete ? new Date().toISOString() : undefined,
    });
  }, [answers, isComplete]);

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
    clearSurveyState();
    setAnswers({});
    setCurrentIndex(0);
    setIsStarted(false);
    setCopied(false);
  }

  async function shareResult() {
    const text = survey.shareText.replace("{resultTitle}", resultState.result.title);
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: survey.title, text, url });
        return;
      } catch {
        // Fallback to clipboard if share cancelled
      }
    }

    await navigator.clipboard.writeText(`${text}\n${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
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
          <span className="logo-badge">AI Collaboration Style Test</span>
          <h1 className="main-title">{survey.title}</h1>
          {!isStarted && <p className="main-subtitle">{survey.subtitle}</p>}
        </div>
      </header>

      <div className="content-container">
        {!isStarted && answeredCount === 0 ? (
          <section className="landing-card card-glow">
            <div className="landing-hero-visual">
              <div className="visual-circle circle-1">
                <span className="visual-tag tag-arch">Architect</span>
              </div>
              <div className="visual-circle circle-2">
                <span className="visual-tag tag-maker">Maker</span>
              </div>
              <div className="visual-circle circle-3">
                <span className="visual-tag tag-res">Researcher</span>
              </div>
              <div className="visual-circle circle-4">
                <span className="visual-tag tag-op">Operator</span>
              </div>
              <div className="visual-circle circle-5">
                <span className="visual-tag tag-cur">Curator</span>
              </div>
              <div className="visual-core">
                <strong>AI</strong>
                <span>WORKFLOW</span>
              </div>
            </div>

            <div className="landing-details">
              <h2>나는 어떤 방식으로 AI와 협업할까?</h2>
              <p className="landing-desc">
                AI 도구를 업무에 도입하는 고유한 성향을 진단합니다.
                8개의 질문을 통해 핵심 강점과 맞춤형 액션 플랜을 즉시 확인해보세요.
              </p>
              
              <button className="start-btn pulse-effect" onClick={startSurvey}>
                성향 분석 시작하기
                <span className="arrow-icon">→</span>
              </button>

              <div className="feature-chips">
                <div className="chip">
                  <span className="chip-icon">⏱️</span>
                  <span>소요시간 3분</span>
                </div>
                <div className="chip">
                  <span className="chip-icon">💾</span>
                  <span>로컬 자동 저장</span>
                </div>
                <div className="chip">
                  <span className="chip-icon">📊</span>
                  <span>5대 유형 정밀 매핑</span>
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
              <span>ANALYSIS REPORT</span>
            </div>

            <div 
              className="result-profile-card"
              style={{ 
                background: ARCHETYPE_STYLES[resultState.resultKey].gradient,
                boxShadow: ARCHETYPE_STYLES[resultState.resultKey].shadow,
                border: `1px solid ${ARCHETYPE_STYLES[resultState.resultKey].color}33`
              }}
            >
              <div className="profile-badge" style={{ color: ARCHETYPE_STYLES[resultState.resultKey].color }}>
                {ARCHETYPE_STYLES[resultState.resultKey].name}
              </div>
              <h2 className="profile-title">{resultState.result.title}</h2>
              <p className="profile-headline">{resultState.result.headline}</p>
              <div className="profile-divider" style={{ background: ARCHETYPE_STYLES[resultState.resultKey].color }} />
              <p className="profile-desc">{resultState.result.description}</p>
            </div>

            <div className="result-details-grid">
              <div className="detail-card">
                <h3 className="detail-title">💪 핵심 강점</h3>
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
                <h3 className="detail-title">🚀 다음 추천 액션</h3>
                <p className="next-step-text">{resultState.result.nextStep}</p>
              </div>
            </div>

            <div className="chart-container">
              <h3 className="chart-title">📊 유형별 매치 스코어</h3>
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
                              boxShadow: `0 0 12px ${style.color}55`
                            }} 
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="result-actions">
              <button className="share-btn pulse-effect" onClick={shareResult}>
                결과 공유하기 (클립보드 복사)
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
        <p className="footer-sub">© {new Date().getFullYear()} AI-Tool-Style. 응답은 기기 로컬 스토리지에만 안전하게 저장됩니다.</p>
      </footer>
    </main>
  );
}

export default App;
