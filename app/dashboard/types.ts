export interface UserProfile {
    id: string;
    full_name: string;
    email: string;
    role: "admin" | "lead" | "tester";
    is_active: boolean;
}
