import {
	type UseMutationOptions,
	type UseQueryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";

// ──────────────────────────────────────────────────────────────────────────────
// Transport
// ──────────────────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
export const api = axios.create({ baseURL: API_BASE });

export function setToken(token?: string) {
	if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
	else delete api.defaults.headers.common["Authorization"];
}

// Optional: basic 401 handling (adjust to your auth flow)
api.interceptors.response.use(
	(r) => r,
	(err) => {
		if (err?.response?.status === 401) {
			// e.g. redirect to login / clear token, etc.
			localStorage.removeItem("token");
			setToken(undefined);
			window.location.reload();
		}
		return Promise.reject(err);
	},
);

export const Data = {
	get: async <T>(url: string): Promise<T> => {
		const res = await api.get<T>(url);
		return res.data;
	}
}