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

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Auth endpoints
  login: async (formData: LoginData) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
      credentials: 'include'
    });
    const data = await response.json();
    
    // Store token for mobile
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    
    return { response, data };
  },

  register: async (formData: SignupData) => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
      credentials: 'include'
    });
    const data = await response.json();
    
    // Store token for mobile
    if (data.token) {
      localStorage.setItem('authToken', data.token);
    }
    
    return { response, data };
  },

  googleLogin: () => {
    window.location.href = `${API_URL}/auth/google/login`;
  },

  getAuthStatus: async () => {
    const token = localStorage.getItem('authToken');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}/auth/status`, {
      credentials: 'include',
      headers
    });
    return await response.json();
  },

  logout: async () => {
    localStorage.removeItem('authToken');
    const response = await fetch(`${API_URL}/auth/logout`, {
      credentials: 'include'
    });
    return await response.json();
  },

  // Notes endpoints
  getNotes: async () => {
    const token = localStorage.getItem('authToken');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}/notes`, { 
      credentials: 'include',
      headers
    });
    return await response.json();
  },

  toggleFavorite: async (noteId: string) => {
    const token = localStorage.getItem('authToken');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}/notes/${noteId}/favorite`, {
      method: 'POST',
      credentials: 'include',
      headers
    });
    return await response.json();
  },

  updateNote: async (noteId: string, title: string) => {
    const response = await fetch(`${API_URL}/notes/${noteId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ title })
    });
    return await response.json();
  },

  deleteNote: async (noteId: string) => {
    const token = localStorage.getItem('authToken');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}/notes/${noteId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers
    });
    return await response.json();
  },

  exportPdf: async (noteId: string) => {
    const token = localStorage.getItem('authToken');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}/notes/${noteId}/export-pdf`, {
      credentials: 'include',
      headers
    });
    if (!response.ok) throw new Error('Export failed');
    return response.blob();
  },

  // Folders endpoints
  getFolders: async () => {
    const token = localStorage.getItem('authToken');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}/folders`, { 
      credentials: 'include',
      headers
    });
    return await response.json();
  },

  createFolder: async (name: string) => {
    const response = await fetch(`${API_URL}/folders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ name })
    });
    return await response.json();
  },

  renameFolder: async (folderId: string, name: string) => {
    const response = await fetch(`${API_URL}/folders/${folderId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ name })
    });
    return await response.json();
  },

  deleteFolder: async (folderId: string) => {
    const token = localStorage.getItem('authToken');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}/folders/${folderId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers
    });
    return await response.json();
  },

  addNotesToFolder: async (folderId: string, noteIds: string[]) => {
    const response = await fetch(`${API_URL}/folders/${folderId}/notes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ note_ids: noteIds })
    });
    return await response.json();
  },

  // Transcription & Notes Generation
  transcribeAudio: async (audioBlob: Blob, method: 'whisper' | 'google' = 'whisper') => {
    const token = localStorage.getItem('authToken');
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('method', method);

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/transcribe`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers
    });
    return await response.json();
  },

  generateNotes: async (transcript: string) => {
    const response = await fetch(`${API_URL}/generate-notes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ transcript })
    });
    return await response.json();
  },

  pushToGoogleDocs: async (notes: string, title: string, noteId?: string) => {
    const response = await fetch(`${API_URL}/push-to-docs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ notes, title, note_id: noteId })
    });
    return await response.json();
  }
};

export { API_URL };