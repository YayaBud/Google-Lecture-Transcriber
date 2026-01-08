// src/lib/api.ts
const API_URL = 'https://google-lecture-transcriber-production.up.railway.app';

interface LoginData {
  email: string;
  password: string;
}

interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const api = {
  // Auth endpoints
  login: async (formData: LoginData) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
      credentials: 'include'
    });
    return { response, data: await response.json() };
  },

  register: async (formData: SignupData) => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    return { response, data: await response.json() };
  },

  googleLogin: () => {
    window.location.href = `${API_URL}/auth/google/login`;
  },

  getAuthStatus: async () => {
    const response = await fetch(`${API_URL}/auth/status`, {
      credentials: 'include'
    });
    return await response.json();
  },

  // Notes endpoints
  getNotes: async () => {
    const response = await fetch(`${API_URL}/notes`, { 
      credentials: 'include' 
    });
    return await response.json();
  },

  toggleFavorite: async (noteId: string) => {
    const response = await fetch(`${API_URL}/notes/${noteId}/favorite`, {
      method: 'POST',
      credentials: 'include'
    });
    return await response.json();
  },

  updateNote: async (noteId: string, title: string) => {
    const response = await fetch(`${API_URL}/notes/${noteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title })
    });
    return await response.json();
  },

  deleteNote: async (noteId: string) => {
    const response = await fetch(`${API_URL}/notes/${noteId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return await response.json();
  },

  // Folders endpoints
  getFolders: async () => {
    const response = await fetch(`${API_URL}/folders`, { 
      credentials: 'include' 
    });
    return await response.json();
  },

  createFolder: async (name: string) => {
    const response = await fetch(`${API_URL}/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name })
    });
    return await response.json();
  },

  renameFolder: async (folderId: string, name: string) => {
    const response = await fetch(`${API_URL}/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name })
    });
    return await response.json();
  },

  deleteFolder: async (folderId: string) => {
    const response = await fetch(`${API_URL}/folders/${folderId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return await response.json();
  },

  addNotesToFolder: async (folderId: string, noteIds: string[]) => {
    const response = await fetch(`${API_URL}/folders/${folderId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ note_ids: noteIds })
    });
    return await response.json();
  },
};

export { API_URL };
