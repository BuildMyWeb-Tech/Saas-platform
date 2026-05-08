// frontend/src/services/jobCardService.js
import api from "./authService"; // reuse same Axios instance (userid header auto-injected)

export const getJobCards = async (active = 1) => {
  const res = await api.get(`/jobcards?active=${active}`);
  return res.data;
};

export const getJobCardById = async (id) => {
  const res = await api.get(`/jobcards/${id}`);
  return res.data;
};

export const createJobCard = async (data) => {
  const res = await api.post("/jobcards", data);
  return res.data;
};

export const updateJobCard = async (id, data) => {
  const res = await api.put(`/jobcards/${id}`, data);
  return res.data;
};

export const deleteJobCard = async (id) => {
  const res = await api.delete(`/jobcards/${id}?status=0`);
  return res.data;
};

export const restoreJobCard = async (id) => {
  const res = await api.delete(`/jobcards/${id}?status=1`);
  return res.data;
};