import { API_BASE_URL } from '../config';

async function fetchJson(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText} at ${endpoint}`);
  }
  return response.json();
}

export const api = {
  getSegments: () => fetchJson('/api/segments'),
  getProjects: () => fetchJson('/api/projects'),
  getLayers: () => fetchJson('/api/layers'),
  getStatus: () => fetchJson('/api/status'),
  getSupportMatrix: () => fetchJson('/api/support-matrix'),
  getCategories: () => fetchJson('/api/categories'),
  
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchJson('/api/upload', {
      method: 'POST',
      body: formData
    });
  },
  
  downloadFile: () => fetchJson('/api/download')
};
