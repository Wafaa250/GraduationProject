import type { StudentDirectoryProfile } from "@/api/studentDirectoryApi";
import type { StudentMeResponse } from "@/api/meApi";

export function mapDirectoryProfileToMe(profile: StudentDirectoryProfile): StudentMeResponse {
  return {
    role: "student",
    userId: profile.userId,
    profileId: profile.profileId,
    name: profile.name,
    email: profile.email,
    studentId: profile.studentId,
    university: profile.university,
    faculty: profile.faculty,
    major: profile.major,
    academicYear: profile.academicYear,
    gpa: profile.gpa,
    bio: profile.bio,
    availability: profile.availability,
    lookingFor: profile.lookingFor,
    github: profile.github,
    linkedin: profile.linkedin,
    portfolio: profile.portfolio,
    profilePictureBase64: profile.profilePictureBase64,
    languages: profile.languages,
    roles: profile.roles,
    technicalSkills: profile.technicalSkills,
    tools: profile.tools,
    generalSkills: profile.roles,
    majorSkills: profile.technicalSkills,
  };
}
