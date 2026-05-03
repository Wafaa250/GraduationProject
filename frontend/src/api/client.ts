/**
 * Named alias for the shared Axios instance (Bearer token, base URL).
 * Use this when modules expect `apiClient` instead of the default export.
 */
import api from "./axiosInstance";

export const apiClient = api;
