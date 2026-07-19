// Pure validation helpers for message composition.

export const MAX_MESSAGE_LENGTH = 4000;

// Returns null when the text is valid, otherwise a translation key string.
export function validateMessage(text) {
  if (text == null) return "messageEmpty";
  const trimmed = text.trim();
  if (trimmed.length === 0) return "messageEmpty";
  if (text.length > MAX_MESSAGE_LENGTH) return "messageTooLong";
  return null;
}

// Flood guard: returns true when a send is allowed.
// `lastSentTs` is the epoch ms of the previous send (null if none).
export function floodGuard(lastSentTs, minGapMs = 300) {
  if (lastSentTs == null) return true;
  const now = Date.now();
  return now - lastSentTs >= minGapMs;
}
