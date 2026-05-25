import api from "./axiosInstance";

export type SearchStudentHit = {
  id: number;
  name: string;
  email: string;
  major: string;
};

export type SearchDoctorHit = {
  id: number;
  name: string;
  email: string;
  specialization: string;
};

export type SearchResponse = {
  students: SearchStudentHit[];
  doctors: SearchDoctorHit[];
};

/** GET /api/search?query= */
export async function searchPlatform(query: string): Promise<SearchResponse> {
  const term = query.trim();
  if (!term) {
    return { students: [], doctors: [] };
  }
  const { data } = await api.get<SearchResponse>("/search", { params: { query: term } });
  return {
    students: Array.isArray(data?.students) ? data.students : [],
    doctors: Array.isArray(data?.doctors) ? data.doctors : [],
  };
}
