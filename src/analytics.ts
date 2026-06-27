import type { ResultKey, SurveyData } from "./types";

export type AnonymousResultPayload = {
  surveyId: string;
  resultKey: ResultKey;
  resultTitle: string;
  scores: Record<ResultKey, number>;
  answeredCount: number;
  completedAt: string;
  schemaVersion: 1;
};

type SubmitResult =
  | { status: "sent"; message: string }
  | { status: "saved-local"; message: string };

const ANALYTICS_STORAGE_KEY = "anonymous-survey-results:v1";

const analyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined;

export function buildAnonymousResultPayload(params: {
  survey: SurveyData;
  resultKey: ResultKey;
  scores: Record<ResultKey, number>;
  completedAt?: string;
}): AnonymousResultPayload {
  return {
    surveyId: params.survey.id,
    resultKey: params.resultKey,
    resultTitle: params.survey.results[params.resultKey].title,
    scores: params.scores,
    answeredCount: params.survey.questions.length,
    completedAt: params.completedAt ?? new Date().toISOString(),
    schemaVersion: 1,
  };
}

function loadLocalResults() {
  try {
    const raw = window.localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AnonymousResultPayload[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalResult(payload: AnonymousResultPayload) {
  const previous = loadLocalResults();
  window.localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify([...previous, payload]));
}

export async function submitAnonymousResult(payload: AnonymousResultPayload): Promise<SubmitResult> {
  if (analyticsEndpoint) {
    await fetch(analyticsEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return {
      status: "sent",
      message: "익명 결과를 통계 저장소로 전송했습니다.",
    };
  }

  saveLocalResult(payload);
  return {
    status: "saved-local",
    message: "서버 저장소가 아직 없어 이 브라우저에 익명 결과를 저장했습니다.",
  };
}

function escapeCsvValue(value: unknown) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(payloads: AnonymousResultPayload[]) {
  const headers = [
    "surveyId",
    "resultKey",
    "resultTitle",
    "architect",
    "maker",
    "researcher",
    "operator",
    "curator",
    "answeredCount",
    "completedAt",
    "schemaVersion",
  ];

  const rows = payloads.map((payload) => [
    payload.surveyId,
    payload.resultKey,
    payload.resultTitle,
    payload.scores.architect,
    payload.scores.maker,
    payload.scores.researcher,
    payload.scores.operator,
    payload.scores.curator,
    payload.answeredCount,
    payload.completedAt,
    payload.schemaVersion,
  ]);

  return [headers, ...rows].map((row) => row.map(escapeCsvValue).join(",")).join("\n");
}

export function downloadAnonymousResultCsv(payload: AnonymousResultPayload) {
  const csv = toCsv([payload]);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `${payload.surveyId}-${payload.resultKey}-anonymous-result.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export function hasAnalyticsEndpoint() {
  return Boolean(analyticsEndpoint);
}
