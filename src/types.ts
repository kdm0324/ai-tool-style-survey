export type ResultKey = "architect" | "maker" | "researcher" | "operator" | "curator";

export type SurveyOption = {
  id: string;
  label: string;
  scores: Partial<Record<ResultKey, number>>;
};

export type SurveyQuestion = {
  id: string;
  text: string;
  options: SurveyOption[];
};

export type SurveyResult = {
  title: string;
  headline: string;
  description: string;
  strengths: string[];
  nextStep: string;
};

export type SurveyData = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  questions: SurveyQuestion[];
  results: Record<ResultKey, SurveyResult>;
  shareText: string;
};
