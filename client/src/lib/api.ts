import axios from "axios";

// ✅ Centralized Axios instance for Django backend
export const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api", // removed trailing slash to avoid double `/api/api`
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // ✅ optional: set true only if backend uses cookies/auth
});
