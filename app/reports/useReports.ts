import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { ProjectStats, BugTrend } from "./types";

export const useReports = () => {
    const [projects, setProjects] = useState<ProjectStats[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>("all");
    const [bugTrends, setBugTrends] = useState<BugTrend[]>([]);
    const [loading, setLoading] = useState(true);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        fetchReportsData();
    }, [selectedProject]);

    const fetchReportsData = async () => {
        try {
            const { data: projectsData, error: projectsError } = await supabase
                .from("projects")
                .select("id, name");
            if (projectsError) throw projectsError;

            const { data: bugsData } = await supabase
                .from("bugs")
                .select("id, status, project_id, created_at, updated_at");

            const { data: testCasesData } = await supabase
                .from("test_cases")
                .select("id, project_id, status");

            const { data: executionsData } = await supabase
                .from("test_executions")
                .select("id, status, project_id");

            const projectStats: ProjectStats[] =
                projectsData?.map((project) => {
                    const projectBugs = bugsData?.filter((b) => b.project_id === project.id) || [];
                    const projectCases = testCasesData?.filter((c) => c.project_id === project.id) || [];
                    const projectExecs = executionsData?.filter((e) => e.project_id === project.id) || [];

                    const closedTestCases = projectCases.filter((c) =>
                        ["closed", "resuelto"].includes(c.status.toLowerCase())
                    ).length;

                    const activeTestCases = projectCases.length - closedTestCases;

                    const passedTests = projectExecs.filter((e) => e.status === "pasado").length;
                    const failedTests = projectExecs.filter((e) => e.status === "fallido").length;
                    const executedTests = passedTests + failedTests;
                    const successRate =
                        executedTests > 0 ? Math.round((passedTests / executedTests) * 100) : 0;

                    return {
                        id: project.id,
                        name: project.name,
                        total_bugs: projectBugs.length,
                        open_bugs: projectBugs.filter((b) =>
                            ["open", "in_progress"].includes(b.status.toLowerCase())
                        ).length,
                        resolved_bugs: projectBugs.filter((b) =>
                            ["resolved", "closed"].includes(b.status.toLowerCase())
                        ).length,
                        total_test_cases: projectCases.length,
                        active_test_cases: activeTestCases,
                        closed_test_cases: closedTestCases,
                        passed_tests: passedTests,
                        failed_tests: failedTests,
                        pending_tests: projectExecs.filter((e) => e.status === "pendiente").length,
                        success_rate: successRate,
                    };
                }) || [];

            setProjects(projectStats);

            // Tendencias de bugs últimos 30 días
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const trendsMap = new Map<string, { created: number; resolved: number }>();

            bugsData?.filter((bug) => new Date(bug.created_at) >= thirtyDaysAgo)
                .forEach((bug) => {
                    const createdDate = new Date(bug.created_at).toISOString().split("T")[0];
                    const current = trendsMap.get(createdDate) || { created: 0, resolved: 0 };
                    current.created += 1;

                    if (["resolved", "closed"].includes(bug.status.toLowerCase())) {
                        const resolvedDate = new Date(bug.updated_at).toISOString().split("T")[0];
                        const resolvedCurrent = trendsMap.get(resolvedDate) || { created: 0, resolved: 0 };
                        resolvedCurrent.resolved += 1;
                        trendsMap.set(resolvedDate, resolvedCurrent);
                    }

                    trendsMap.set(createdDate, current);
                });

            const trends = Array.from(trendsMap.entries())
                .map(([date, data]) => ({ date, ...data }))
                .sort((a, b) => a.date.localeCompare(b.date));

            setBugTrends(trends);
        } catch (error) {
            console.error("Error fetching reports data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Al final del hook useReports

    const aggregatedStats = projects.reduce(
        (acc, project) => ({
            total_bugs: acc.total_bugs + project.total_bugs,
            open_bugs: acc.open_bugs + project.open_bugs,
            resolved_bugs: acc.resolved_bugs + project.resolved_bugs,
            total_test_cases: acc.total_test_cases + project.total_test_cases,
            active_test_cases: acc.active_test_cases + project.active_test_cases,
            closed_test_cases: acc.closed_test_cases + project.closed_test_cases,
            passed_tests: acc.passed_tests + project.passed_tests,
            failed_tests: acc.failed_tests + project.failed_tests,
            pending_tests: acc.pending_tests + project.pending_tests,
            success_rate:
                acc.total_bugs + acc.total_test_cases + project.total_bugs + project.total_test_cases > 0
                    ? Math.round(
                        ((acc.resolved_bugs + project.resolved_bugs + (acc.closed_test_cases + project.closed_test_cases)) /
                            (acc.total_bugs + acc.total_test_cases + project.total_bugs + project.total_test_cases)) *
                        100
                    )
                    : 0,
        }),
        {
            total_bugs: 0,
            open_bugs: 0,
            resolved_bugs: 0,
            total_test_cases: 0,
            active_test_cases: 0,
            closed_test_cases: 0,
            passed_tests: 0,
            failed_tests: 0,
            pending_tests: 0,
            success_rate: 0,
        }
    );

    return { projects, selectedProject, setSelectedProject, bugTrends, loading, aggregatedStats };

};
