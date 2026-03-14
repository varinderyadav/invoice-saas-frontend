import api from "./axios";

export async function getClients() {
  const response = await api.get("clients/");
  return response.data;
}

export async function createClient(payload) {
  const response = await api.post("clients/", payload);
  return response.data;
}

export async function updateClient(id, payload) {
  const response = await api.patch(`clients/${id}/`, payload);
  return response.data;
}

export async function deleteClient(id) {
  const response = await api.delete(`clients/${id}/`);
  return response.data;
}
