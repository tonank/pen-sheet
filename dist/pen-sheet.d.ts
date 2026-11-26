export interface PenImage {
  id: string;
  png: string;
  box: [number, number, number, number];
  figureOmitted?: boolean;
}

export interface PenFieldSubmission {
  id: string;
  label: string;
  typed?: string;
  images: PenImage[];
}

export interface PenSubmission {
  title: string;
  pageText: string;
  lang?: string;
  feedbackLang?: string;
  dispute?: string;
  items: PenFieldSubmission[];
}

export interface RedPenMark {
  image?: string;
  kind: "tick" | "cross" | "circle" | "underline" | "question";
  x: number;
  y: number;
  w: number;
  h: number;
  note?: string;
}

export interface FieldGrade {
  verdict?: "correct" | "partial" | "incorrect" | "blank" | "";
  badge?: string;
  points?: number;
  readAs?: string;
  readUnsure?: boolean;
  comment?: string;
  feedback?: string;
  nudge?: string;
  solution?: string;
  correctAnswer?: string;
  nextTime?: string;
  met?: number[];
  marks?: RedPenMark[];
}

export interface GradeResponse {
  summary?: string;
  markdown?: string;
  grades?: Record<string, FieldGrade>;
  questions?: Array<FieldGrade & { id: string }>;
  reply?: string;
}

export type GradingMode = "coach" | "free" | "strict";
export type GraderProvider = "auto" | "openai" | "anthropic" | "gemini" | "endpoint";

export interface PenSheetConfig {
  endpoint?: string | null;
  headers?: Record<string, string> | null;
  agentName?: string | null;
  timeoutMs?: number;
  mode?: GradingMode | null;
  prompt?: string | null;
  provider?: GraderProvider | null;
  apiKey?: string | null;
  model?: string | null;
  maxImagesPerCall?: number | null;
  grader?: ((payload: { content: unknown[]; submission: PenSubmission | null; expects: unknown }) => Promise<GradeResponse | string> | GradeResponse | string) | null;
}

export interface GradeResult {
  grades: Record<string, FieldGrade>;
  summary: string;
  markdown?: string;
  marks: Record<string, unknown[]>;
  elapsedSeconds?: number;
}

export interface AttemptRecord {
  at: string;
  earned: number;
  possible: number;
  pct: number;
  correct: number;
  total: number;
  elapsedSeconds?: number;
}

export interface PenSheetAPI {
  configure(opts: PenSheetConfig): PenSheetConfig;
  canGrade(): boolean;
  handIn(): Promise<GradeResult | null>;
  reopen(): void;
  freshRetake(): boolean;
  retryMissed(): void;
  studyNotes(): string;
  followUpPrompt(): string;
  attempts(): AttemptRecord[];
  toggleFocus(on?: boolean): boolean;
  openScratchpad(): void;
  openManualReview(): void;
  exportState(): Record<string, unknown>;
  importState(input: string | Record<string, unknown>): boolean;
  downloadBackup(): void;
  downloadBooxPdf(): Promise<Blob | null>;
  gradeFiles(files: FileList | File[]): Promise<GradeResult | null>;
  exportForAI(): Promise<Array<{ q: { id: string; points: number; showPoints?: boolean; rubric?: string[] }; label: string; typed?: string; confidence?: "guess" | "unsure" | "sure"; inks: PenImage[] }> | null>;
  openGraderSetup(): void;
  ask(prompt: string): Promise<string>;
  fields(): Array<{ q: { id: string; points: number; showPoints?: boolean; rubric?: string[] }; label: string; typed?: string; confidence?: "guess" | "unsure" | "sure"; inks: PenImage[] }>;
  InkPad: unknown;
  tools: { tool: string; color: string; size: number; fingers: string; scratchOut: boolean; penSeen: boolean };
}

export declare const PenSheet: PenSheetAPI;
export declare const PenInput: PenSheetAPI;
export default PenSheet;

declare global {
  interface Window {
    PenSheet?: PenSheetAPI;
    PenInput?: PenSheetAPI;
    penSheetConfig?: Pick<PenSheetConfig, "endpoint" | "headers" | "agentName" | "mode" | "prompt" | "provider" | "apiKey" | "model">;
  }
}
