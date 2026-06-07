import axios from "axios";

export function isAxiosStatus(err: unknown, status: number): boolean {
  return axios.isAxiosError(err) && err.response?.status === status;
}
