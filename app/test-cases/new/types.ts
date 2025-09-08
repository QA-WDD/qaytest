export type Step = { action: string; expected: string };
export type Project = { id: string; name: string };

export interface TestCaseForm {
  title: string;
  description: string;
  preconditions: string;
  steps: Step[];
  status: "draft" | "active";
  priority: "low" | "medium" | "high" | "critical";
  month?: string;
  sprint?: string;
  storyId?: number | null;
  projectId: string;
}
