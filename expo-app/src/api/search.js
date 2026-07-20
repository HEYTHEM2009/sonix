import client from "./client";

/**
 * Search API service. Covers users, reels, posts, stories, hashtags, audio and trends.
 */
const searchApi = {
  suggestions: (q = "", params = {}) =>
    client.get("/search/suggestions", { params: { ...params, q } }),
  users: (q, params = {}) => client.get("/search/users", { params: { ...params, q } }),
  reels: (q, params = {}) => client.get("/search/reels", { params: { ...params, q } }),
  posts: (q, params = {}) => client.get("/search/posts", { params: { ...params, q } }),
  stories: (q, params = {}) => client.get("/search/stories", { params: { ...params, q } }),
  hashtags: (q, params = {}) => client.get("/search/hashtags", { params: { ...params, q } }),
  audio: (q, params = {}) => client.get("/search/audio", { params: { ...params, q } }),
  trending: (params = {}) => client.get("/search/trending", { params }),
};

export default searchApi;
