export interface GlobalSearchStudentResult {
  id: number;
  name: string;
  email: string;
  major: string;
}

export interface GlobalSearchDoctorResult {
  id: number;
  name: string;
  email: string;
  specialization: string;
}

export interface GlobalSearchResponse {
  students: GlobalSearchStudentResult[];
  doctors: GlobalSearchDoctorResult[];
}
