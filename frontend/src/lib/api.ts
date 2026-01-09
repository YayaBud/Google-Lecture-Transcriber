const API_URL = 'https://google-lecture-transcriber-production.up.railway.app';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// ✅ Token management
const TOKEN_KEY = 'auth_token';

export const tokenManager = {
  set(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  remove() {
    localStorage.removeItem(TOKEN_KEY);
  }
};

// ✅ Helper to get auth headers
function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  const token = tokenManager.get();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// ✅ Helper for authenticated requests
async function authFetch(url: string, options: RequestInit = {}) {
  const token = tokenManager.get();
  
  const config: RequestInit = {
    ...options,
    credentials: 'include', // Still send cookies for desktop
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {})
    }
  };
  
  const response = await fetch(url, config);
  
  // If 401, token might be expired - redirect to login
  if (response.status === 401) {
    tokenManager.remove();
    window.location.href = '/login';
    throw new Error('Authentication required');
  }
  
  return response;
}

export const api = {
  // Auth endpoints
  async register(data: RegisterData) {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    const json = await response.json();
    
    // ✅ Store token if provided
    if (json.token) {
      tokenManager.set(json.token);
    }
    
    return { response, data: json };
  },

  async login(data: LoginData) {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    const json = await response.json();
    
    // ✅ Store token if provided
    if (json.token) {
      tokenManager.set(json.token);
    }
    
    return { response, data: json };
  },

  async logout() {
    const response = await authFetch(`${API_URL}/auth/logout`);
    tokenManager.remove(); // ✅ Clear token on logout
    return await response.json();
  },

  async getAuthStatus() {
    const response = await authFetch(`${API_URL}/auth/status`);
    return await response.json();
  },

  googleLogin() {
    window.location.href = `${API_URL}/auth/google/login`;
  },

  // Notes endpoints
  async getNotes() {
    const response = await authFetch(`${API_URL}/notes`);
    return await response.json();
  },

  async createNote(title: string, preview: string) {
    const response = await authFetch(`${API_URL}/notes`, {
      method: 'POST',
      body: JSON.stringify({ title, preview })
    });
    return await response.json();
  },

  async updateNote(noteId: string, title: string) {
    const response = await authFetch(`${API_URL}/notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify({ title })
    });
    return await response.json();
  },

  async deleteNote(noteId: string) {
    const response = await authFetch(`${API_URL}/notes/${noteId}`, {
      method: 'DELETE'
    });
    return await response.json();
  },

  async toggleFavorite(noteId: string) {
    const response = await authFetch(`${API_URL}/notes/${noteId}/favorite`, {
      method: 'POST'
    });
    return await response.json();
  },

  // Folders endpoints
  async getFolders() {
    const response = await authFetch(`${API_URL}/folders`);
    return await response.json();
  },

  async createFolder(name: string) {
    const response = await authFetch(`${API_URL}/folders`, {
      method: 'POST',
      body: JSON.stringify({ name, note_ids: [] })
    });
    return await response.json();
  },

  async renameFolder(folderId: string, name: string) {
    const response = await authFetch(`${API_URL}/folders/${folderId}`, {
      method: 'PUT',
      body: JSON.stringify({ name })
    });
    return await response.json();
  },

  async deleteFolder(folderId: string) {
    const response = await authFetch(`${API_URL}/folders/${folderId}`, {
      method: 'DELETE'
    });
    return await response.json();
  },

  async addNotesToFolder(folderId: string, noteIds: string[]) {
    const response = await authFetch(`${API_URL}/folders/${folderId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note_ids: noteIds })
    });
    return await response.json();
  }
};