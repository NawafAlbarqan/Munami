// Copilot chat persistence — plain browser localStorage, no backend needed
// for the hackathon demo. Two keys: the conversation currently on screen,
// and an array of up to MAX_HISTORY past conversations the user can revisit.

const CURRENT_KEY = 'munami_chat_current'
const HISTORY_KEY = 'munami_chat_history'
const MAX_HISTORY = 5

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage unavailable (private mode, quota, etc.) — fail silently,
    // the chat still works for the current session, it just won't persist.
  }
}

export function loadCurrentConversation() {
  return readJSON(CURRENT_KEY)
}

export function saveCurrentConversation(conversation) {
  writeJSON(CURRENT_KEY, conversation)
}

export function loadHistory() {
  return readJSON(HISTORY_KEY) || []
}

export function makeConversation(greeting) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    messages: [{ role: 'ai', content: greeting }],
    updatedAt: Date.now(),
  }
}

// A conversation is worth keeping only if the user actually said something.
function isWorthArchiving(conversation) {
  return conversation && conversation.messages.some((m) => m.role === 'user')
}

// Archives the current conversation into history (if it has real content),
// then returns a brand-new one. This is the only path that starts a new
// chat — switching tabs never calls this.
export function startNewConversation(currentConversation, greeting) {
  if (isWorthArchiving(currentConversation)) {
    const history = loadHistory().filter((c) => c.id !== currentConversation.id)
    history.unshift({ ...currentConversation, updatedAt: Date.now() })
    writeJSON(HISTORY_KEY, history.slice(0, MAX_HISTORY))
  }
  const fresh = makeConversation(greeting)
  saveCurrentConversation(fresh)
  return fresh
}

// Loading a past conversation from history: archive whatever's currently
// on screen first (same rule as starting new), then make the picked one
// the current conversation.
export function restoreConversation(currentConversation, picked) {
  if (isWorthArchiving(currentConversation) && currentConversation.id !== picked.id) {
    const history = loadHistory().filter((c) => c.id !== currentConversation.id && c.id !== picked.id)
    history.unshift({ ...currentConversation, updatedAt: Date.now() })
    writeJSON(HISTORY_KEY, history.slice(0, MAX_HISTORY))
  } else {
    const history = loadHistory().filter((c) => c.id !== picked.id)
    writeJSON(HISTORY_KEY, history)
  }
  saveCurrentConversation(picked)
  return picked
}

export function conversationPreview(conversation) {
  const firstUserMsg = conversation.messages.find((m) => m.role === 'user')
  return firstUserMsg ? firstUserMsg.content : conversation.messages[0]?.content || ''
}
