import { apiClient } from "./client";
import { getItem } from "@/utils/authStorage";

/** Normalized doctor row for mobile UI (GET /api/me for role doctor). */
export type DoctorMeProfile = {
    role: "doctor";
    userId: number;
    profileId: number;
    name: string;
    email: string;
    specialization: string | null;
    university: string | null;
};

function readNestedString(obj: unknown, ...keys: string[]): string {
    if (!obj || typeof obj !== "object") return "";
    const r = obj as Record<string, unknown>;
    for (const k of keys) {
        const v = r[k];
        if (typeof v === "string") {
            const t = v.trim();
            if (t) return t;
        }
    }
    return "";
}

/**
 * Fetches GET /api/me and maps the doctor payload (nested `user` + `doctorProfile`)
 * to a flat shape used by screens. Falls back to session-stored login fields when needed.
 */
export async function fetchDoctorMeProfile(): Promise<DoctorMeProfile> {
    const { data } = await apiClient.get<unknown>("/me");
    const raw = data as Record<string, unknown>;
    const role = String(raw.role ?? raw.Role ?? "").toLowerCase();
    if (role !== "doctor") {
        throw new Error("This account is not a doctor profile.");
    }

    const profileId = Number(raw.profileId ?? raw.ProfileId);
    const userId = Number(raw.userId ?? raw.UserId);
    if (!Number.isFinite(profileId) || profileId <= 0) {
        throw new Error("Doctor profile not found.");
    }

    const user = raw.user ?? raw.User;
    const doctorProfile = raw.doctorProfile ?? raw.DoctorProfile;

    let name = readNestedString(user, "name", "Name");
    let email = readNestedString(user, "email", "Email");
    if (!name) name = readNestedString(raw, "name", "Name");
    if (!email) email = readNestedString(raw, "email", "Email");

    if (!name) name = ((await getItem("name")) ?? "").trim();
    if (!email) email = ((await getItem("email")) ?? "").trim();

    const specializationRaw = readNestedString(doctorProfile, "specialization", "Specialization");
    const universityRaw = readNestedString(doctorProfile, "university", "University");

    return {
        role: "doctor",
        userId: Number.isFinite(userId) ? userId : 0,
        profileId,
        name: name || "Doctor",
        email,
        specialization: specializationRaw || null,
        university: universityRaw || null,
    };
}
