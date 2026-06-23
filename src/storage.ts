export type SavedSurveyState = {
  answers: Record<string, string>;
  completedAt?: string;
};

function getStorageKey(surveyId: string) {
  return `${surveyId}:v1`;
}

export function loadSurveyState(surveyId: string): SavedSurveyState {
  try {
    const raw = window.localStorage.getItem(getStorageKey(surveyId));
    if (!raw) return { answers: {} };
    const parsed = JSON.parse(raw) as SavedSurveyState;
    return { answers: parsed.answers ?? {}, completedAt: parsed.completedAt };
  } catch {
    return { answers: {} };
  }
}

export function saveSurveyState(surveyId: string, state: SavedSurveyState) {
  window.localStorage.setItem(getStorageKey(surveyId), JSON.stringify(state));
}

export function clearSurveyState(surveyId: string) {
  window.localStorage.removeItem(getStorageKey(surveyId));
}
