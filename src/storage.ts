export type SavedSurveyState = {
  answers: Record<string, string>;
  completedAt?: string;
};

const storageKey = "ai-tool-style-survey:v1";

export function loadSurveyState(): SavedSurveyState {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return { answers: {} };
    const parsed = JSON.parse(raw) as SavedSurveyState;
    return { answers: parsed.answers ?? {}, completedAt: parsed.completedAt };
  } catch {
    return { answers: {} };
  }
}

export function saveSurveyState(state: SavedSurveyState) {
  window.localStorage.setItem(storageKey, JSON.stringify(state));
}

export function clearSurveyState() {
  window.localStorage.removeItem(storageKey);
}
