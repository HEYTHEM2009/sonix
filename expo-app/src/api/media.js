import client from "./client";

/**
 * Media Security Service for the client side.
 * Handles signed URL generation, prefetching, and memory management.
 */

/**
 * Get a signed URL for a media path.
 */
export async function getSignedUrl(path) {
  try {
    const res = await client.post("/media/sign", { path });
    return res.data.url;
  } catch (e) {
    // Fallback to direct URL
    return `${IMAGE_BASE}${path}`;
  }
}

/**
 * Get signed URLs for multiple paths (batch).
 */
export async function getSignedUrls(paths) {
  try {
    const res = await client.post("/media/sign-batch", { paths });
    return res.data.urls;
  } catch (e) {
    // Fallback to direct URLs
    const { IMAGE_BASE } = require("./client");
    const urls = {};
    paths.forEach((p) => (urls[p] = `${IMAGE_BASE}${p}`));
    return urls;
  }
}

/**
 * Prefetch media into cache.
 * Returns cached URLs for instant access.
 */
const prefetchCache = new Map();

export async function prefetchMedia(paths) {
  const uncached = paths.filter((p) => !prefetchCache.has(p));

  if (uncached.length === 0) {
    return paths.map((p) => prefetchCache.get(p));
  }

  const urls = await getSignedUrls(uncached);
  uncached.forEach((p) => {
    if (urls[p]) prefetchCache.set(p, urls[p]);
  });

  return paths.map((p) => prefetchCache.get(p));
}

/**
 * Clear prefetch cache for memory management.
 */
export function clearPrefetchCache() {
  prefetchCache.clear();
}

/**
 * Prefetch next story media (images/videos).
 */
export async function prefetchNextStories(stories, currentIndex) {
  const { IMAGE_BASE } = require("./client");
  const nextIndex = currentIndex + 1;
  if (nextIndex >= stories.length) return;

  const nextStory = stories[nextIndex];
  if (!nextStory) return;

  const mediaPath =
    nextStory.type === "video" ? nextStory.video : nextStory.image;
  if (!mediaPath) return;

  // Only prefetch images (videos are too large)
  if (nextStory.type !== "video") {
    try {
      const url = `${IMAGE_BASE}${mediaPath}`;
      await Image.prefetch(url);
    } catch (e) {
      // Prefetch failed, not critical
    }
  }
}

/**
 * Get MIME type from file extension.
 */
export function getMimeType(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  const mimeMap = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
  };
  return mimeMap[ext] || "application/octet-stream";
}

/**
 * Check if a path is a video.
 */
export function isVideo(path) {
  if (!path) return false;
  const ext = path.split(".").pop().toLowerCase();
  return ["mp4", "mov", "webm", "avi"].includes(ext);
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

import { Image } from "react-native";
import { IMAGE_BASE } from "./client";
