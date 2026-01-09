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

// ✅ STORAGE HELPERS (handles private/incognito mode)
const storeToken = (token: string) => {
  try {
    localStorage.setItem('authToken', token);
    console.log('✅ Token stored in localStorage');
  } catch (e) {
    console.warn('⚠️ localStorage blocked, using sessionStorage');
    sessionStorage.setItem('authToken', token);
  }
};

const getToken = (): string | null => {
  try {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  } catch (e) {
    return sessionStorage.getItem('authToken');
  }
};

const removeToken = () => {
  try {
    localStorage.removeItem('authToken');
  } catch (e) {
    // localStorage blocked
  }
  try {
    sessionStorage.removeItem('authToken');
  } catch (e) {
    // sessionStorage blocked too
  }
};

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = getToken();
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
    console.log('🚀 [API] Starting login request...');
    
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
      credentials: 'include'
    });
    
    console.log('📡 [API] Response status:', response.status);
    console.log('📡 [API] Response OK:', response.ok);
    
    const data = await response.json();
    
    console.log('📱 [API] Login response data:', data);
    console.log('🔑 [API] Token received:', data.token ? `${data.token.substring(0, 20)}...` : 'NONE');
    console.log('✅ [API] Success flag:', data.success);
    console.log('👤 [API] User data:', data.user);
    
    if (data.token) {
      storeToken(data.token);
      const storedToken = getToken();
      console.log('💾 [API] Token stored successfully:', !!storedToken);
      console.log('🔍 [API] Can retrieve token:', storedToken ? `${storedToken.substring(0, 20)}...` : 'FAILED');
    } else {
      console.error('❌ [API] No token in response!');
    }
    
    return { response, data };
  },

  register: async (formData: SignupData) => {
    console.log('🚀 [API] Starting registration...');
    
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
      credentials: 'include'
    });
    const data = await response.json();
    
    console.log('📱 [API] Register response:', data);
    
    if (data.token) {
      storeToken(data.token);
      console.log('✅ [API] Registration token stored');
    }
    
    return { response, data };
  },

  googleLogin: () => {
    console.log('🔄 [API] Redirecting to Google OAuth...');
    window.location.href = `${API_URL}/auth/google/login`;
  },

  getAuthStatus: async () => {
    const token = getToken();
    console.log('🔍 [API] Checking auth status...');
    console.log('🔍 [API] Token exists:', token ? 'YES' : 'NO');
    
    if (token) {
      console.log('🔍 [API] Token preview:', token.substring(0, 30) + '...');
    }
    
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔍 [API] Sending Authorization header');
    } else {
      console.log('⚠️ [API] No token to send');
    }
    
    const response = await fetch(`${API_URL}/auth/status`, {
      credentials: 'include',
      headers
    });
    
    const data = await response.json();
    console.log('🔍 [API] Auth status response:', data);
    
    return data;
  },

  logout: async () => {
    console.log('👋 [API] Logging out...');
    removeToken();
    
    const response = await fetch(`${API_URL}/auth/logout`, {
      credentials: 'include'
    });
    return await response.json();
  },

  // Notes endpoints
  getNotes: async () => {
    const token = getToken();
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
    const token = getToken();
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
    const token = getToken();
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
    const token = getToken();
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
    const token = getToken();
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
    const token = getToken();
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
    const token = getToken();
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
