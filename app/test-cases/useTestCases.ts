import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Project, TestCasesPageProps } from "./type";

// Función principal para obtener datos y manejar lógica de negocio
export default async function useTestCasesPage(searchParams: TestCasesPageProps["searchParams"]) {
    const { project: selectedProjectId, status: filterStatus } = await searchParams;
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) redirect("/auth/login");

    // Obtener proyectos del usuario
    const { data: userProjects } = await supabase
        .from("project_members")
        .select(`
      project_id,
      projects (id, name)
    `)
        .eq("user_id", data.user.id);

    const projects: Project[] =
        userProjects
            ?.map((up) => {
                const proj = up.projects;
                return Array.isArray(proj) ? (proj[0] as Project) : (proj as Project);
            })
            .filter((p): p is Project => !!p) || [];

    // Redirecciones
    if (!selectedProjectId && projects.length === 0) return { projects: [], redirect: "/projects" };
    if (!selectedProjectId && projects.length > 0) redirect(`/test-cases?project=${projects[0].id}`);

    // Obtener casos de prueba filtrados
    let query = supabase
        .from("test_cases")
        .select(`
      *,
      users!test_cases_created_by_fkey(full_name)
    `)
        .eq("project_id", selectedProjectId)
        .order("created_at", { ascending: false });

    if (filterStatus && filterStatus !== "all") query = query.eq("status", filterStatus);

    const { data: testCases } = await query;

    const currentProject = projects.find((p) => p.id === selectedProjectId);

    // Funciones auxiliares para colores
    const getStatusColor = (status: string) => {
        switch (status) {
            case "active": return "bg-green-100 text-green-800 border-green-200";
            case "draft": return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "deprecated": return "bg-red-100 text-red-800 border-red-200";
            case "closed": return "bg-gray-300 text-gray-800 border-gray-400";
            default: return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "critical": return "bg-red-100 text-red-800 border-red-200";
            case "high": return "bg-orange-100 text-orange-800 border-orange-200";
            case "medium": return "bg-blue-100 text-blue-800 border-blue-200";
            case "low": return "bg-gray-100 text-gray-800 border-gray-200";
            default: return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    return { projects, testCases, currentProject, selectedProjectId, filterStatus, getStatusColor, getPriorityColor };
}
