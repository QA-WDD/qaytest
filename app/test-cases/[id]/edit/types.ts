// Tipos de Steps y TestCase
export interface Step {
    action: string;
    expected: string;
}

export interface ProjectOption {
    id: string;
    name: string;
}

export interface PriorityOption {
    priority_value: string;
}

export interface TestCase {
    id: string;
    title: string;
    description?: string;
    preconditions?: string;
    steps: Step[];
    expected_result?: string;
    status: "draft" | "active";
    priority: "low" | "medium" | "high" | "critical";
    month?: string;
    sprint?: string;
    story_id?: number | null;
    project_id: string;
    case_number?: number | null;
    created_at?: string;
    updated_at?: string;
    users?: {
        name: string;
    };
}
