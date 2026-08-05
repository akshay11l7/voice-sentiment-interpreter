export const API_BASE = "/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { "Authorization": `Bearer ${token}` } : {};
};

export const login = async (email, password) => {
  const formData = new URLSearchParams();
  formData.append("username", email); // OAuth2 expects username
  formData.append("password", password);

  const response = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Login failed");
  }

  return await response.json();
};

export const register = async (name, email, password) => {
  const response = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ full_name: name, email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Registration failed");
  }

  return await response.json();
};

export const uploadAudio = async (file, task = "transcribe") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("task", task);
  
  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }
  
  return await response.json();
};

export const fetchHistory = async () => {
  const response = await fetch(`${API_BASE}/interactions`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch history: ${response.statusText}`);
  }
  return await response.json();
};

export const deleteInteraction = async (id) => {
  const response = await fetch(`${API_BASE}/interactions/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to delete: ${response.statusText}`);
  }
  return await response.json();
};

export const getAuditLogs = async () => {
  const response = await fetch(`${API_BASE}/logs`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
  }
  return await response.json();
};
