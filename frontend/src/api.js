const API_BASE = "http://127.0.0.1:8000/api";

export const uploadAudio = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  
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
