import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PriorityOption, ProjectOption, Step } from "./types";

const supabase = createClient();

export function useEditTestCase(testCaseId: string | undefined) {
    const router = useRouter();

    // Estados
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [preconditions, setPreconditions] = useState("");
    const [steps, setSteps] = useState<Step[]>([{ action: "", expected: "" }]);
    const [expectedResult, setExpectedResult] = useState("");
    const [status, setStatus] = useState<"draft" | "active">("draft");
    const [priority, setPriority] = useState("medium");
    const [month, setMonth] = useState("");
    const [sprint, setSprint] = useState("");
    const [storyId, setStoryId] = useState<number | null>(null);
    const [projectId, setProjectId] = useState("");
    const [caseNumber, setCaseNumber] = useState<number | null>(null);
    const [createdBy, setCreatedBy] = useState("");
    const [createdAt, setCreatedAt] = useState("");
    const [updatedAt, setUpdatedAt] = useState("");

    const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([]);
    const [priorityOptions, setPriorityOptions] = useState<PriorityOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Funciones para steps
    const addStep = () => setSteps([...steps, { action: "", expected: "" }]);
    const updateStep = (index: number, field: "action" | "expected", value: string) => {
        const newSteps = [...steps];
        newSteps[index][field] = value;
        setSteps(newSteps);
    };

    // Cargar datos iniciales
    useEffect(() => {
        if (!testCaseId) return;

        const fetchData = async () => {
            setIsLoading(true);

            // Proyectos
            const { data: projectsData } = await supabase.from("projects").select("id, name");
            if (projectsData) setProjectOptions(projectsData);

            // Prioridades
            const { data: prioritiesData } = await supabase.rpc("get_bug_priority");
            if (prioritiesData) setPriorityOptions(prioritiesData);

            // Test Case
            const { data: testCase } = await supabase
                .from("test_cases")
                .select("*")
                .eq("id", testCaseId)
                .single();

            if (testCase) {
                setTitle(testCase.title || "");
                setDescription(testCase.description || "");
                setPreconditions(testCase.preconditions || "");
                setSteps(testCase.steps ? JSON.parse(testCase.steps) : [{ action: "", expected: "" }]);
                setExpectedResult(testCase.expected_result || "");
                setStatus(testCase.status || "draft");
                setPriority(testCase.priority || "medium");
                setMonth(testCase.month || "");
                setSprint(testCase.sprint || "");
                setStoryId(testCase.story_id ?? null);
                setProjectId(testCase.project_id || "");
                setCaseNumber(testCase.case_number ?? null);
                setCreatedBy(testCase.users?.name || "");
                setCreatedAt(testCase.created_at || "");
                setUpdatedAt(testCase.updated_at || "");
            }

            setIsLoading(false);
        };

        fetchData();
    }, [testCaseId]);

    // Guardar cambios
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!testCaseId) return;

        setIsLoading(true);
        setError(null);

        try {
            const { data: authData } = await supabase.auth.getUser();
            const user = authData?.user;
            if (!user) throw new Error("Usuario no autenticado");

            const currentValues = {
                project_id: projectId,
                title,
                description,
                preconditions,
                steps: JSON.stringify(steps),
                expected_result: expectedResult,
                status,
                priority,
                month,
                sprint,
                story_id: storyId,
            };

            const { error: updateError } = await supabase
                .from("test_cases")
                .update(currentValues)
                .eq("id", testCaseId);

            if (updateError) throw updateError;

            router.push(`/test-cases/${testCaseId}`);
        } catch (err: any) {
            setError(err.message || "Error al actualizar");
        } finally {
            setIsLoading(false);
        }
    };

    return {
        title,
        setTitle,
        description,
        setDescription,
        preconditions,
        setPreconditions,
        steps,
        addStep,
        updateStep,
        expectedResult,
        setExpectedResult,
        status,
        setStatus,
        priority,
        setPriority,
        month,
        setMonth,
        sprint,
        setSprint,
        storyId,
        setStoryId,
        projectId,
        setProjectId,
        caseNumber,
        createdBy,
        createdAt,
        updatedAt,
        projectOptions,
        priorityOptions,
        isLoading,
        error,
        handleUpdate,
    };
}
