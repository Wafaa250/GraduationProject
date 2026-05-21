/** Types aligned with the Lovable student-course-hub contract (string IDs). */

export type AiMode = "student" | "doctor";

export type AvailabilityStatus =
  | "available"
  | "pending"
  | "already_teammate"
  | "unavailable";

export interface HubEnrolledCourseSection {
  sectionId: string;
  sectionName: string;
}

export interface HubEnrolledCourse {
  courseId: string;
  name: string;
  code: string;
  semester: string;
  doctorId: string;
  doctorName: string;
  section: HubEnrolledCourseSection;
}

export interface HubCourseSectionSchedule {
  sectionId: string;
  sectionName: string;
  schedule: string;
  room: string;
}

export interface HubCourseDetail {
  courseId: string;
  name: string;
  code: string;
  semester: string;
  createdAt: string;
  doctorId: string;
  doctorName: string;
  mySectionId: string;
  mySectionName: string;
  sections: HubCourseSectionSchedule[];
}

export interface HubRosterStudent {
  studentId: string;
  name: string;
  universityId: string;
  university: string;
  major: string;
  email: string;
  enrolledAt: string;
  sectionId: string;
}

export interface HubCourseProject {
  id: string;
  courseId: string;
  title: string;
  description: string;
  teamSize: number;
  applyToAllSections: boolean;
  allowCrossSectionTeams: boolean;
  aiMode: AiMode;
  createdAt: string;
  sections: string[];
  hasTeam: boolean;
}

export interface HubManualStudent {
  id: string;
  name: string;
  email: string;
  skills: string[];
  sectionName: string;
  avatar?: string;
  bio: string;
  hasPendingRequest: boolean;
  isAlreadyInTeam: boolean;
  availabilityStatus: AvailabilityStatus;
  availabilityReason?: string;
}

export interface HubAiRecommendation {
  studentId: string;
  name: string;
  email: string;
  avatar?: string;
  sectionName: string;
  skills: string[];
  bio: string;
  matchScore: number;
  matchReason: string;
  hasPendingRequest: boolean;
  isAlreadyInTeam: boolean;
  availabilityStatus: AvailabilityStatus;
  availabilityReason?: string;
}

export interface HubTeamInvitation {
  invitationId: string;
  projectId: string;
  projectTitle: string;
  courseId: string;
  courseName: string;
  senderId: string;
  senderName: string;
  senderSection: string;
  senderSkills: string[];
  message: string;
  invitedAt: string;
}

export interface HubChatMessage {
  id: string;
  teamId?: string;
  sectionId?: string;
  senderUserId: string;
  senderName: string;
  text: string;
  sentAt: string;
}

export interface HubApiError {
  status: number;
  message: string;
}
