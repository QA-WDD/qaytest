"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Step, Project, TestCaseForm } from "./types";
import { useRouter, useSearchParams } from "next/navigation";

export const useNewTestCase = () => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [preconditions, setPreconditions] = useState("");
    const [steps, setSteps] = useState<Step[]>([{ action: "", expected: "" }]);
    const [status, setStatus] = useState<"draft" | "active">("draft");
    const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
    const [month, setMonth] = useState("");
    const [sprint, setSprint] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState("");
    const [storyId, setStoryId] = useState<number | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();
    const projectFromUrl = searchParams.get("project");

    useEffect(() => {
        const loadProjects = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: userProjects } = await supabase
                    .from("project_members")
                    .select(`project_id, projects(id, name)`)
                    .eq("user_id", user.id);

                const projectsList: Project[] =
                    userProjects
                        ?.map((up: any) => {
                            const proj = up.projects;
                            return Array.isArray(proj) ? proj[0] : proj;
                        })
                        .filter((p): p is Project => !!p) || [];

                setProjects(projectsList);

                if (projectFromUrl && projectsList.find((p) => p.id === projectFromUrl)) {
                    setSelectedProject(projectFromUrl);
                } else if (projectsList.length > 0) {
                    setSelectedProject(projectsList[0].id);
                }
            }
        };

        loadProjects();
    }, [projectFromUrl]);

    const addStep = () => setSteps([...steps, { action: "", expected: "" }]);

    const updateStep = (index: number, field: keyof Step, value: string) => {
        const newSteps = [...steps];
        newSteps[index][field] = value;
        setSteps(newSteps);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuario no autenticado");
            if (!selectedProject) throw new Error("Debe seleccionar un proyecto");

            const payload: TestCaseForm = {
                projectId: selectedProject,
                title,
                description,
                preconditions,
                steps,
                status,
                priority,
                month,
                sprint,
                storyId,
            };

            const { data: testCase, error: testCaseError } = await supabase
                .from("test_cases")
                .insert({
                    project_id: payload.projectId,
                    title: payload.title,
                    description: payload.description,
                    preconditions: payload.preconditions,
                    steps: JSON.stringify(payload.steps),
                    status: payload.status,
                    priority: payload.priority,
                    month: payload.month,
                    sprint: payload.sprint,
                    story_id: payload.storyId,
                    created_by: user.id,
                })
                .select()
                .single();

            if (testCaseError) throw testCaseError;
            router.push(`/test-cases/${testCase.id}`);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error al crear el caso de prueba");
        } finally {
            setIsLoading(false);
        }
    };

    return {
        title, setTitle,
        description, setDescription,
        preconditions, setPreconditions,
        steps, addStep, updateStep,
        status, setStatus,
        priority, setPriority,
        month, setMonth,
        sprint, setSprint,
        error, isLoading,
        projects, selectedProject, setSelectedProject,
        storyId, setStoryId,
        handleSubmit,
    };
};
