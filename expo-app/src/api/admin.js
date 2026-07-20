import client from "./client";

const adminApi = {
  dashboard: () => client.get("/admin/dashboard"),
  users: (params = {}) => client.get("/admin/users", { params }),
  showUser: (id) => client.get(`/admin/users/${id}`),
  banUser: (id) => client.post(`/admin/users/${id}/ban`),
  unbanUser: (id) => client.post(`/admin/users/${id}/unban`),
  reels: (params = {}) => client.get("/admin/reels", { params }),
  posts: (params = {}) => client.get("/admin/posts", { params }),
  stories: (params = {}) => client.get("/admin/stories", { params }),
  reports: (params = {}) => client.get("/admin/reports", { params }),
  resolveReport: (id, status = "resolved") =>
    client.put(`/admin/reports/${id}`, { status }),
  removeContent: (type, id) => client.delete(`/admin/content/${type}/${id}`),
  analytics: () => client.get("/admin/analytics"),
  notifications: (message, userId = null) =>
    client.post("/admin/notifications", { message, user_id: userId }),
  roles: () => client.get("/admin/roles"),
  permissions: () => client.get("/admin/permissions"),
  settings: () => client.get("/admin/settings"),
  updateSetting: (key, value) => client.put("/admin/settings", { key, value }),
  logs: (params = {}) => client.get("/admin/logs", { params }),
  badWords: () => client.get("/admin/bad-words"),
  addBadWord: (word) => client.post("/admin/bad-words", { word }),
  deleteBadWord: (id) => client.delete(`/admin/bad-words/${id}`),
};

export default adminApi;
