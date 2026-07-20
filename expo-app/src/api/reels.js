import client from "./client";

/**
 * Reels API service layer. Single source of truth for all reel network calls.
 */
const reelsApi = {
  feed: (params = {}) => client.get("/reels", { params }),
  forYou: (params = {}) => client.get("/reels/foryou", { params }),
  trending: (params = {}) => client.get("/reels/trending", { params }),
  saved: (params = {}) => client.get("/reels/saved", { params }),
  search: (q, params = {}) =>
    client.get("/reels/search", { params: { ...params, q } }),
  byHashtag: (tag, params = {}) =>
    client.get(`/reels/hashtag/${encodeURIComponent(tag)}`, { params }),
  popularHashtags: () => client.get("/reels/hashtags/popular"),
  insights: () => client.get("/reels/insights"),

  // ── Reels Pro ──
  drafts: (params = {}) => client.get("/reels/drafts", { params }),
  scheduled: (params = {}) => client.get("/reels/scheduled", { params }),
  featured: (params = {}) => client.get("/reels/featured", { params }),
  music: (params = {}) => client.get("/reels/music", { params }),
  togglePro: (enabled) => client.post("/reels/pro", { enabled }),

  get: (id) => client.get(`/reels/${id}`),
  create: (formData) =>
    client.post("/reels", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id, data) => client.put(`/reels/${id}`, data),
  remove: (id) => client.delete(`/reels/${id}`),

  toggleLike: (id) => client.post(`/reels/${id}/like`),
  toggleSave: (id) => client.post(`/reels/${id}/save`),
  share: (id, platform) => client.post(`/reels/${id}/share`, { platform }),
  recordView: (id, payload = {}) => client.post(`/reels/${id}/view`, payload),

  comment: (id, data) => client.post(`/reels/${id}/comment`, data),
  likeComment: (commentId) => client.post(`/reel-comments/${commentId}/like`),
  removeComment: (commentId) => client.delete(`/reel-comments/${commentId}`),
};

export default reelsApi;
