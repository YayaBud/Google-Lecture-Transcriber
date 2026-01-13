const API_URL = import.meta.env.VITE_API_URL || 'https://google-lecture-transcriber-production.up.railway.app';

console.log('🌐 API URL configured:', API_URL);

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
    console.log('💾 Storing token in localStorage');
    localStorage.setItem(TOKEN_KEY, token);
    console.log('✅ Token stored successfully');
  },
  get(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    console.log('🔍 Getting token from localStorage:', token ? '✅ Found' : '❌ Not found');
    return token;
  },
  remove() {
    console.log('🗑️ Removing token from localStorage');
    localStorage.removeItem(TOKEN_KEY);
    console.log('✅ Token removed');
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
    console.log('🔑 Authorization header added');
  } else {
    console.log('⚠️ No token available for Authorization header');
  }
  
  return headers;
}

// ✅ Helper for authenticated requests
async function authFetch(url: string, options: RequestInit = {}) {
  const token = tokenManager.get();
  console.log('📡 Making authenticated request to:', url);
  console.log('🔐 Token available:', !!token);
  
  const config: RequestInit = {
    ...options,
    credentials: 'include',
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {})
    }
  };
  
  try {
    const response = await fetch(url, config);
    console.log(`📥 Response from ${url}:`, response.status, response.statusText);
    
    if (response.status === 401) {
      console.error('❌ 401 Unauthorized - Token expired or invalid');
      tokenManager.remove();
      
      if (!window.location.pathname.includes('/login')) {
        console.log('🔄 Redirecting to login...');
        window.location.href = '/login';
      }
      throw new Error('Authentication required');
    }
    
    return response;
  } catch (error) {
    console.error('❌ Network error during authFetch:', error);
    throw error;
  }
}

export const api = {
  // Auth endpoints
  async register(data: RegisterData) {
    console.log('📝 Registering user:', data.email);
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      const json = await response.json();
      console.log('📥 Register response:', json);
      
      if (json.token) {
        console.log('✅ Token received from registration');
        tokenManager.set(json.token);
      } else {
        console.warn('⚠️ No token in registration response');
      }
      
      return { response, data: json };
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw error;
    }
  },

  async login(data: LoginData) {
    console.log('🔐 Logging in user:', data.email);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      const json = await response.json();
      console.log('📥 Login response:', json);
      
      if (json.token) {
        console.log('✅ Token received from login');
        tokenManager.set(json.token);
      } else {
        console.warn('⚠️ No token in login response');
      }
      
      return { response, data: json };
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  },

  async logout() {
    console.log('👋 Logging out...');
    try {
      const response = await authFetch(`${API_URL}/auth/logout`);
      tokenManager.remove();
      console.log('✅ Logout successful');
      return await response.json();
    } catch (error) {
      console.error('❌ Logout error:', error);
      tokenManager.remove();
      throw error;
    }
  },

  async getAuthStatus() {
    console.log('🔍 Checking auth status...');
    try {
      const response = await authFetch(`${API_URL}/auth/status`);
      const data = await response.json();
      console.log('📥 Auth status:', data);
      return data;
    } catch (error) {
      console.error('❌ Auth status check failed:', error);
      throw error;
    }
  },

  googleLogin() {
    console.log('🔐 Redirecting to Google OAuth...');
    window.location.href = `${API_URL}/auth/google/login`;
  },

  // Notes endpoints
  async getNotes() {
    console.log('📚 Fetching notes...');
    try {
      const response = await authFetch(`${API_URL}/notes`);
      const data = await response.json();
      console.log('✅ Notes fetched:', data.notes?.length || 0);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch notes:', error);
      throw error;
    }
  },

  async getNote(noteId: string) {
    console.log('📄 Fetching note:', noteId);
    try {
      const response = await authFetch(`${API_URL}/notes/${noteId}`);
      const data = await response.json();
      console.log('✅ Note fetched:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch note:', error);
      throw error;
    }
  },

  async createNote(title: string, preview: string) {
    console.log('➕ Creating note:', title);
    try {
      const response = await authFetch(`${API_URL}/notes`, {
        method: 'POST',
        body: JSON.stringify({ title, preview })
      });
      const data = await response.json();
      console.log('✅ Note created:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to create note:', error);
      throw error;
    }
  },

  async updateNote(noteId: string, title: string) {
    console.log('✏️ Updating note:', noteId);
    try {
      const response = await authFetch(`${API_URL}/notes/${noteId}`, {
        method: 'PUT',
        body: JSON.stringify({ title })
      });
      const data = await response.json();
      console.log('✅ Note updated:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to update note:', error);
      throw error;
    }
  },

  async deleteNote(noteId: string) {
    console.log('🗑️ Deleting note:', noteId);
    try {
      const response = await authFetch(`${API_URL}/notes/${noteId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      console.log('✅ Note deleted:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to delete note:', error);
      throw error;
    }
  },

  async toggleFavorite(noteId: string) {
    console.log('⭐ Toggling favorite:', noteId);
    try {
      const response = await authFetch(`${API_URL}/notes/${noteId}/favorite`, {
        method: 'POST'
      });
      const data = await response.json();
      console.log('✅ Favorite toggled:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to toggle favorite:', error);
      throw error;
    }
  },

  async pushToGoogleDocs(noteId: string, notes: string, title: string) {
    console.log('📤 Pushing to Google Docs:', { noteId, title });
    try {
      const response = await authFetch(`${API_URL}/push-to-docs`, {
        method: 'POST',
        body: JSON.stringify({ noteid: noteId, notes, title })
      });
      const data = await response.json();
      console.log('✅ Push to Docs response:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to push to Google Docs:', error);
      throw error;
    }
  },

  // Folders endpoints
  async getFolders() {
    console.log('📁 Fetching folders...');
    try {
      const response = await authFetch(`${API_URL}/folders`);
      const data = await response.json();
      console.log('✅ Folders fetched:', data.folders?.length || 0);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch folders:', error);
      throw error;
    }
  },

  async createFolder(name: string) {
    console.log('➕ Creating folder:', name);
    try {
      const response = await authFetch(`${API_URL}/folders`, {
        method: 'POST',
        body: JSON.stringify({ name, note_ids: [] })
      });
      const data = await response.json();
      console.log('✅ Folder created:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to create folder:', error);
      throw error;
    }
  },

  async renameFolder(folderId: string, name: string) {
    console.log('✏️ Renaming folder:', folderId);
    try {
      const response = await authFetch(`${API_URL}/folders/${folderId}`, {
        method: 'PUT',
        body: JSON.stringify({ name })
      });
      const data = await response.json();
      console.log('✅ Folder renamed:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to rename folder:', error);
      throw error;
    }
  },

  async deleteFolder(folderId: string) {
    console.log('🗑️ Deleting folder:', folderId);
    try {
      const response = await authFetch(`${API_URL}/folders/${folderId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      console.log('✅ Folder deleted:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to delete folder:', error);
      throw error;
    }
  },

  async addNotesToFolder(folderId: string, noteIds: string[]) {
    console.log('📌 Adding notes to folder:', folderId, noteIds);
    try {
      const response = await authFetch(`${API_URL}/folders/${folderId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note_ids: noteIds })
      });
      const data = await response.json();
      console.log('✅ Notes added to folder:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to add notes to folder:', error);
      throw error;
    }
  }
};
