export const API_BASE = "/api";

export const uploadAudio = async (file, task = "transcribe") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("task", task);
  
  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
  
  return await response.json();
};

export const fetchHistory = async () => {
  const response = await fetch(`${API_BASE}/interactions`);
  if (!response.ok) {
    throw new Error(`Failed to fetch history: ${response.statusText}`);
  }
  return await response.json();
};

export const deleteInteraction = async (id) => {
  const response = await fetch(`${API_BASE}/interactions/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to delete: ${response.statusText}`);
  }
  return await response.json();
};
