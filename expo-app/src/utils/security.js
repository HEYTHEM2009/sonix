import client from "../api/client";

// Minimal security helpers for user block/unblock relations.
// These wrap the backend endpoints and never throw — failures are swallowed
// so the UI can degrade gracefully.

export async function blockUser(userId) {
  try {
    const res = await client.post(`/users/${userId}/block`);
    return res?.data ?? { blocked: true };
  } catch (e) {
    return { blocked: false, error: true };
  }
}

export async function unblockUser(userId) {
  try {
    const res = await client.post(`/users/${userId}/unblock`);
    return res?.data ?? { blocked: false };
  } catch (e) {
    return { blocked: true, error: true };
  }
}

// Determines whether a blocking relationship exists between two user ids.
// Falls back to local knowledge if the request fails; callers should treat
// an `unknown: true` result as "do not assume either state".
export async function isBlockedRelation(aId, bId) {
  try {
    const res = await client.get(`/users/${bId}/block-status`);
    const blockedByThem = !!res?.data?.blocked_by;
    const blockedByMe = !!res?.data?.blocked;
    return { blocked: blockedByMe || blockedByThem, blockedByMe, blockedByThem };
  } catch (e) {
    return { blocked: false, unknown: true };
  }
}
