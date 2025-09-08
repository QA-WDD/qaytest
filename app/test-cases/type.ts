export interface TestCasesPageProps {
  searchParams: Promise<{ project?: string; status?: string }>;
}

export interface Project {
  id: string;
  name: string;
}

export interface TestCase {
  id: string;
  title: string;
  description?: string;
  status: "draft" | "active" | "deprecated" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  case_number: number;
  created_at: string;
  users?: {
    full_name: string;
  };
}
