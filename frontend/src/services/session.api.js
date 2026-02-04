import axios from "@/lib/axios"; // your configured axios instance

export const createSessionApi = (sessionId) =>
  axios.post("/session", { sessionId });

export const deleteSessionApi = (sessionId) =>
  axios.delete(`/session/${sessionId}`);

export const getSessionStatusApi = (sessionId) =>
  axios.get(`/session/${sessionId}/status`);

export const listAllSessionsApi = () =>
  axios.get("/session");

export const listUserSessionsApi = () =>
  axios.get("/session/user");

export const reconnectSessionApi = (sessionId) =>
  axios.post(`/session/${sessionId}/reconnect`);
