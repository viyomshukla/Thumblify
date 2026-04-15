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

// ===== SSE Helper — parses text/event-stream from fetch =====
async function consumeSSE(
  url: string,
  fetchOpts: RequestInit,
  onPreview: (preview: any) => void,
  onDone: (info: any) => void,
  onError: (msg: string) => void,
) {
  const res = await fetch(url, fetchOpts);
  if (!res.body) { onError('No response body'); return; }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE messages are separated by double newlines
    const parts = buffer.split('\n\n');
    buffer = parts.pop() || ''; // keep incomplete chunk

    for (const part of parts) {
      const line = part.replace(/^data:\s*/, '').trim();
      if (!line) continue;
      try {
        const parsed = JSON.parse(line);

        if (parsed.preview) {
          onPreview(parsed.preview);
        } else if (parsed.done) {
          onDone(parsed);
        } else if (parsed.error) {
          onError(parsed.error);
        }
        // modelError events are informational — we just skip them on the client
      } catch {
        // ignore non-JSON lines
      }
    }
  }
}

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
  save: (data: any) => api.post('/thumbnail/save', data),
  
  // YouTube APIs
  analyzeYoutube: (youtubeUrl: string) => 
    api.post('/youtube/analyze', { youtubeUrl }),
    
  improveYoutube: (data: any) => 
    api.post('/youtube/improve', data),

  // ===== SSE Streaming Functions =====

  /** Stream text-mode generation via SSE */
  generateStream: (
    data: FormData,
    onPreview: (preview: any) => void,
    onDone: (info: any) => void,
    onError: (msg: string) => void,
  ) => {
    return consumeSSE(`${API_URL}/thumbnail/generate`, {
      method: 'POST',
      body: data,
      credentials: 'include' as RequestCredentials,
    }, onPreview, onDone, onError);
  },

  /** Stream YouTube improve generation via SSE */
  improveYoutubeStream: (
    data: any,
    onPreview: (preview: any) => void,
    onDone: (info: any) => void,
    onError: (msg: string) => void,
  ) => {
    return consumeSSE(`${API_URL}/youtube/improve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include' as RequestCredentials,
    }, onPreview, onDone, onError);
  },
};

// User APIs
export const userAPI = {
  getThumbnails: () => api.get('/user/thumbnails'),
  getThumbnail: (id: string) => api.get(`/user/thumbnails/${id}`),
  getCredits: () => api.get('/user/credits'),
};

// Chat APIs
export const chatAPI = {
  sendMessage: (message: string, conversationHistory?: any[], currentStep?: string, thumbnailData?: any) => 
    api.post('/chat/message', { message, conversationHistory, currentStep, thumbnailData }),
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