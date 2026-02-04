import axios from 'axios';

// ✅ CORRECTION : On met juste l'adresse du serveur (sans /api à la fin)
const api = axios.create({
  baseURL: 'http://127.0.0.1:5000', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour le token (Code existant conservé)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;

    const storedSession = localStorage.getItem('ensa_pfe_session_v4');
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        if (session?.id_user) config.headers['X-User-Id'] = String(session.id_user);
        if (session?.role) config.headers['X-User-Role'] = String(session.role);
      } catch (e) { console.warn(e); }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export default api;