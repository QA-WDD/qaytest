/* import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserProfile } from "./types";

export const useDashboardData = async (): Promise<{
    user: any;
    userProfile: UserProfile | null;
    projectsCount: number;
    bugsCount: number;
    handleSignOut: () => Promise<void>;
}> => {
    const supabase = await createClient();

    // Usuario autenticado
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) redirect("/auth/login");

    const user = data.user;

    // Perfil usuario
    const { data: userProfile } = await supabase
        .from<'public', UserProfile>("users")
        .select("*")
        .eq("id", user.id)
        .single();

    const { count: projectsCount } = await supabase
        .from("project_members")
        .select<"id", { id: string }>("id", { count: "exact", head: true })
        .eq("user_id", user.id);

    const { count: bugsCount } = await supabase
        .from("bugs")
        .select<"id", { id: string }>("id", { count: "exact", head: true })
        .eq("reported_by", user.id);


    // Función cerrar sesión
    const handleSignOut = async () => {
        "use server";
        const supabase = await createClient();
        await supabase.auth.signOut();
        redirect("/auth/login");
    };


    return {
        user,
        userProfile: userProfile || null,
        projectsCount: projectsCount || 0,
        bugsCount: bugsCount || 0,
        handleSignOut
    };

};
 */