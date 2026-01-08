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
    return { response, data: json };
  },

  async logout() {
    const response = await fetch(`${API_URL}/auth/logout`, {
      credentials: 'include'
    });
    return await response.json();
  },

  async getAuthStatus() {
    const response = await fetch(`${API_URL}/auth/status`, {
      credentials: 'include'
    });
    return await response.json();
  },

  googleLogin() {
    window.location.href = `${API_URL}/auth/google/login`;
  },

  // Notes endpoints
  async getNotes() {
    const response = await fetch(`${API_URL}/notes`, {
      credentials: 'include'
    });
    return await response.json();
  },

  async createNote(title: string, preview: string) {
    const response = await fetch(`${API_URL}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title, preview })
    });
    return await response.json();
  },

  async updateNote(noteId: string, title: string) {
    const response = await fetch(`${API_URL}/notes/${noteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title })
    });
    return await response.json();
  },

  async deleteNote(noteId: string) {
    const response = await fetch(`${API_URL}/notes/${noteId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return await response.json();
  },

  async toggleFavorite(noteId: string) {
    const response = await fetch(`${API_URL}/notes/${noteId}/favorite`, {
      method: 'POST',
      credentials: 'include'
    });
    return await response.json();
  },

  // Folders endpoints
  async getFolders() {
    const response = await fetch(`${API_URL}/folders`, {
      credentials: 'include'
    });
    return await response.json();
  },

  async createFolder(name: string) {
    const response = await fetch(`${API_URL}/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, note_ids: [] })
    });
    return await response.json();
  },

  async renameFolder(folderId: string, name: string) {
    const response = await fetch(`${API_URL}/folders/${folderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name })
    });
    return await response.json();
  },

  async deleteFolder(folderId: string) {
    const response = await fetch(`${API_URL}/folders/${folderId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    return await response.json();
  },

  async addNotesToFolder(folderId: string, noteIds: string[]) {
    const response = await fetch(`${API_URL}/folders/${folderId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ note_ids: noteIds })
    });
    return await response.json();
  }
};
