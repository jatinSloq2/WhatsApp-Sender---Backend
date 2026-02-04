import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const instance = axios.create({
    baseURL: `${API}/api`,
    withCredentials: true, // IMPORTANT: sends HttpOnly cookies
    headers: {
        "Content-Type": "application/json",
    },
});

/**
 * Optional: response interceptor
 * Normalizes backend errors
 */
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        const message =
            error?.response?.data?.message ||
            error?.response?.data?.error?.message ||
            error.message ||
            "Request failed";

        return Promise.reject({
            ...error,
            message,
        });
    }
);

export default instance;
