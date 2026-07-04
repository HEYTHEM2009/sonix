import { create } from "zustand";

/**
 * Story State Machine
 * Controls story playback, memory management, and prefetching.
 *
 * States:
 * - IDLE: No story is playing
 * - PLAYING: Story is actively playing
 * - PAUSED: Story is paused (long press)
 * - LOADING: Story is loading
 * - ERROR: Story failed to load
 * - TRANSITIONING: Moving between stories
 */

const STORY_STATES = {
  IDLE: "IDLE",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  LOADING: "LOADING",
  ERROR: "ERROR",
  TRANSITIONING: "TRANSITIONING",
};

/**
 * Memory management for video elements.
 * Tracks which stories have been viewed and cleans up resources.
 */
const useStoryStore = create((set, get) => ({
  // State
  state: STORY_STATES.IDLE,
  currentIndex: 0,
  stories: [],
  viewedIds: new Set(),
  prefetchQueue: [],
  memoryUsage: 0,

  // Actions
  setStories: (stories) =>
    set({
      stories,
      currentIndex: 0,
      viewedIds: new Set(),
      state: STORY_STATES.IDLE,
    }),

  play: (index) => {
    const { stories } = get();
    if (index >= 0 && index < stories.length) {
      set({
        state: STORY_STATES.PLAYING,
        currentIndex: index,
      });
    }
  },

  pause: () => set({ state: STORY_STATES.PAUSED }),

  resume: () => set({ state: STORY_STATES.PLAYING }),

  advance: () => {
    const { currentIndex, stories, viewedIds } = get();
    const nextIndex = currentIndex + 1;

    if (nextIndex >= stories.length) {
      set({ state: STORY_STATES.IDLE });
      return false;
    }

    // Mark current as viewed
    const newViewedIds = new Set(viewedIds);
    if (stories[currentIndex]) {
      newViewedIds.add(stories[currentIndex].id);
    }

    set({
      state: STORY_STATES.TRANSITIONING,
      currentIndex: nextIndex,
      viewedIds: newViewedIds,
    });

    // Transition to playing after a brief delay
    setTimeout(() => {
      set({ state: STORY_STATES.PLAYING });
    }, 150);

    return true;
  },

  goBack: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) {
      set({
        state: STORY_STATES.TRANSITIONING,
        currentIndex: currentIndex - 1,
      });

      setTimeout(() => {
        set({ state: STORY_STATES.PLAYING });
      }, 150);

      return true;
    }
    return false;
  },

  setError: (error) =>
    set({
      state: STORY_STATES.ERROR,
      error,
    }),

  clearError: () =>
    set({
      state: STORY_STATES.IDLE,
      error: null,
    }),

  // Memory management
  cleanup: () => {
    set({
      state: STORY_STATES.IDLE,
      currentIndex: 0,
      stories: [],
      viewedIds: new Set(),
      prefetchQueue: [],
    });
  },

  // Prefetch management
  addToPrefetchQueue: (storyId) => {
    const { prefetchQueue } = get();
    if (!prefetchQueue.includes(storyId)) {
      set({ prefetchQueue: [...prefetchQueue, storyId] });
    }
  },

  removeFromPrefetchQueue: (storyId) => {
    const { prefetchQueue } = get();
    set({
      prefetchQueue: prefetchQueue.filter((id) => id !== storyId),
    });
  },

  // Getters
  getCurrentStory: () => {
    const { stories, currentIndex } = get();
    return stories[currentIndex] || null;
  },

  hasNext: () => {
    const { currentIndex, stories } = get();
    return currentIndex < stories.length - 1;
  },

  hasPrevious: () => {
    const { currentIndex } = get();
    return currentIndex > 0;
  },

  isViewed: (storyId) => {
    const { viewedIds } = get();
    return viewedIds.has(storyId);
  },

  getProgress: () => {
    const { currentIndex, stories } = get();
    if (stories.length === 0) return 0;
    return ((currentIndex + 1) / stories.length) * 100;
  },
});

export { STORY_STATES, useStoryStore };
