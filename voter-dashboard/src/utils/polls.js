// src/utils/polls.js
const LS_KEY = 'polls_v1';
const VOTED_LIST_KEY = 'voted_polls_v1';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function loadPolls() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('loadPolls error', e);
    return [];
  }
}

export function savePolls(polls) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(polls));
    // also emit an event for other tabs (some browsers dispatch storage automatically)
    window.dispatchEvent(new Event('polls-updated'));
  } catch (e) {
    console.error('savePolls error', e);
  }
}

export function newPoll({ title, options }) {
  return {
    id: 'poll-' + uid(),
    title,
    createdAt: new Date().toISOString(),
    options: options.map((label) => ({ id: 'opt-' + uid(), label, votes: 0 })),
  };
}

export function hasVotedOnDevice(pollId) {
  try {
    const list = JSON.parse(localStorage.getItem(VOTED_LIST_KEY) || '[]');
    return list.includes(pollId);
  } catch {
    return false;
  }
}

export function markVotedOnDevice(pollId, choiceId) {
  try {
    const list = JSON.parse(localStorage.getItem(VOTED_LIST_KEY) || '[]');
    localStorage.setItem('voted_choice_' + pollId, choiceId);
    if (!list.includes(pollId)) localStorage.setItem(VOTED_LIST_KEY, JSON.stringify([...list, pollId]));
  } catch (e) {
    console.error(e);
  }
}

export function getDeviceChoice(pollId) {
  return localStorage.getItem('voted_choice_' + pollId) || null;
}

// admin helpers
export function adminSetVotes(pollId, optionId, votes) {
  const polls = loadPolls();
  const pIndex = polls.findIndex((p) => p.id === pollId);
  if (pIndex === -1) return false;
  const oIndex = polls[pIndex].options.findIndex((o) => o.id === optionId);
  if (oIndex === -1) return false;
  polls[pIndex].options[oIndex].votes = Math.max(0, Number(votes) || 0);
  savePolls(polls);
  return true;
}
export function adminResetVotes(pollId) {
  const polls = loadPolls();
  const pIndex = polls.findIndex((p) => p.id === pollId);
  if (pIndex === -1) return false;
  polls[pIndex].options = polls[pIndex].options.map((o) => ({ ...o, votes: 0 }));
  savePolls(polls);
  // clear that poll from voted list to allow re-votes on device
  try {
    const list = JSON.parse(localStorage.getItem(VOTED_LIST_KEY) || '[]');
    const newList = list.filter((id) => id !== pollId);
    localStorage.setItem(VOTED_LIST_KEY, JSON.stringify(newList));
    localStorage.removeItem('voted_choice_' + pollId);
  } catch {}
  return true;
}
export function adminDeletePoll(pollId) {
  const polls = loadPolls();
  const remaining = polls.filter((p) => p.id !== pollId);
  savePolls(remaining);
  return true;
}
export function adminSetPoll(poll) {
  const polls = loadPolls();
  const pIndex = polls.findIndex((p) => p.id === poll.id);
  if (pIndex === -1) polls.unshift(poll);
  else polls[pIndex] = poll;
  savePolls(polls);
}

// --- Export / Import polls via URL (shareable link) ---
// Create a share URL containing the poll JSON (encoded)
export function exportPollUrl(poll) {
  // encode as URI component (safe for unicode). Keep it simple.
  const payload = encodeURIComponent(JSON.stringify(poll));
  const url = `${location.origin}/import?data=${payload}`;
  return url;
}

// Import poll from encoded string; returns inserted poll object or null
export function importPollFromString(encoded) {
  try {
    const raw = decodeURIComponent(encoded);
    const p = JSON.parse(raw);
    if (!p || !p.id) return null;
    const polls = loadPolls();
    // avoid duplicate IDs: if exists, update it
    const exists = polls.find((x) => x.id === p.id);
    if (!exists) polls.unshift(p);
    else {
      // replace to keep updated
      const idx = polls.findIndex((x) => x.id === p.id);
      polls[idx] = p;
    }
    savePolls(polls);
    return p;
  } catch (e) {
    console.error('importPollFromString error', e);
    return null;
  }
}
