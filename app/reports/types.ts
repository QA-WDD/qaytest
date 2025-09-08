export interface ProjectStats {
    id: string;
    name: string;
    total_bugs: number;
    open_bugs: number;
    resolved_bugs: number;
    total_test_cases: number;
    active_test_cases: number;
    closed_test_cases: number;
    passed_tests: number;
    failed_tests: number;
    pending_tests: number;
    success_rate: number;
}

export interface BugTrend {
    date: string;
    created: number;
    resolved: number;
}
