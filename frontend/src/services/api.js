const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Base fetch wrapper for API calls with error handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  /* Attach auth token if available */
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `API Error: ${response.status}`);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    if (response.status === 204) return null;
    return await response.json();
  } catch (err) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      console.warn('API unreachable, using offline mode');
      return null;
    }
    throw err;
  }
}

export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint, body) => request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),

  /* Domain-specific endpoints */
  tracks: {
    getAll: (params = '') => request(`/tracks${params}`),
    getById: (id) => request(`/tracks/${id}`),
    getTrending: () => request('/tracks/trending'),
    search: (q) => request(`/tracks/search?q=${encodeURIComponent(q)}`),
    like: (id) => request(`/tracks/${id}/like`, { method: 'POST' }),
    unlike: (id) => request(`/tracks/${id}/unlike`, { method: 'DELETE' }),
  },
  playlists: {
    getAll: () => request('/playlists'),
    getById: (id) => request(`/playlists/${id}`),
    create: (data) => request('/playlists', { method: 'POST', body: JSON.stringify(data) }),
    addTrack: (playlistId, trackId) => request(`/playlists/${playlistId}/tracks`, { method: 'POST', body: JSON.stringify({ trackId }) }),
  },
  artists: {
    getAll: () => request('/artists'),
    getById: (id) => request(`/artists/${id}`),
    follow: (id) => request(`/artists/${id}/follow`, { method: 'POST' }),
  },
  user: {
    getProfile: () => request('/user/profile'),
    updateProfile: (data) => request('/user/profile', { method: 'PUT', body: JSON.stringify(data) }),
    getLibrary: () => request('/user/library'),
    getHistory: () => request('/user/history'),
  },
};

export default api;
