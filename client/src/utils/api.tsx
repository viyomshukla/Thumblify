import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // This sends cookies automatically
});

// ✅ OPTIONAL: Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Authentication failed - session expired');
      // Optionally redirect to login
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  verify: () => api.get('/auth/verify'),
};

// Thumbnail APIs
export const thumbnailAPI = {
  generate: (data: FormData | any) => {
    if (data instanceof FormData) {
      return api.post('/thumbnail/generate', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.post('/thumbnail/generate', data);
  },
  delete: (id: string) => api.delete(`/thumbnail/delete/${id}`),
  
  // YouTube APIs
  analyzeYoutube: (youtubeUrl: string) => 
    api.post('/youtube/analyze', { youtubeUrl }),
    
  improveYoutube: (data: any) => 
    api.post('/youtube/improve', data),
};

// User APIs
export const userAPI = {
  getThumbnails: () => api.get('/user/thumbnails'),
  getThumbnail: (id: string) => api.get(`/user/thumbnails/${id}`),
  getCredits: () => api.get('/user/credits'),
};

// Chat APIs
export const chatAPI = {
  sendMessage: (message: string, conversationHistory?: any[]) => 
    api.post('/chat/message', { message, conversationHistory }),
};
// WhatsApp APIs
export const whatsappAPI = {
  connect: (phoneNumber: string) => 
    api.post('/whatsapp/connect', { phoneNumber }),
  
  disconnect: () => 
    api.post('/whatsapp/disconnect'),
  
  getStatus: () => 
    api.get('/whatsapp/status'),
};

export default api;