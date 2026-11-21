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
  verdict: "correct" | "partial" | "incorrect" | "blank";
  points?: number;
  readAs?: string;
  readUnsure?: boolean;
  comment?: string;
  correctAnswer?: string;
  nextTime?: string;
  marks?: RedPenMark[];
}

export interface GradeResponse {
  summary?: string;
  grades?: Record<string, FieldGrade>;
  questions?: Array<FieldGrade & { id: string }>;
  reply?: string;
}

export interface PenSheetConfig {
  endpoint?: string | null;
  headers?: Record<string, string> | null;
  agentName?: string | null;
  timeoutMs?: number;
  grader?: ((payload: { content: unknown[]; submission: PenSubmission | null; expects: unknown }) => Promise<GradeResponse | string> | GradeResponse | string) | null;
}

export interface PenSheetAPI {
  configure(opts: PenSheetConfig): PenSheetConfig;
  canGrade(): boolean;
  handIn(): Promise<{ grades: Record<string, FieldGrade>; summary: string; marks: Record<string, unknown[]> } | null>;
  reopen(): void;
  ask(prompt: string): Promise<string>;
  fields(): Array<{ q: { id: string; points: number }; label: string; typed?: string; inks: PenImage[] }>;
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
    penSheetConfig?: Pick<PenSheetConfig, "endpoint" | "headers" | "agentName">;
  }
}
