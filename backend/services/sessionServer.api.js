import axios from "axios";

const BASE_URL = "http://localhost:4000/sessions";
const BASE_URL_MESSAGE = "http://localhost:4000/sessions";

export const createRemoteSession = (sessionId) => {
  return axios.post(`${BASE_URL}/create`, { id: sessionId });
};

export const getRemoteSessionStatus = (sessionId) => {
  return axios.get(`${BASE_URL}/status/${sessionId}`);
};

export const deleteRemoteSession = (sessionId) => {
  return axios.delete(`${BASE_URL}/delete/${sessionId}`);
};

export const listRemoteSessions = () => {
  return axios.get(`${BASE_URL}/list`);
};

export const retryRemoteSession = (sessionId) => {
  return axios.post(`${BASE_URL}/retrysession`, { id: sessionId });
};

export const sendMessageApi = (payload) => {
  return axios.post(`${BASE_URL_MESSAGE}/send`, payload);
};

export const bulkMessageApi = (payload) => {
  return axios.post(`${BASE_URL_MESSAGE}/bulk`, payload);
};