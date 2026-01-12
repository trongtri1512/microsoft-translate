// LocalStorage-based sync for offline/same-device mode
const PARTICIPANTS_KEY = 'conversation_participants'
const MESSAGES_KEY = 'conversation_messages'

class LocalStorageSync {
  constructor() {
    this.syncInterval = null
    this.messageListeners = new Set()
    this.lastMessageId = 0
    this.setupStorageListener()
  }

  setupStorageListener() {
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith(MESSAGES_KEY)) {
        const newValue = e.newValue
        if (newValue) {
          try {
            const messages = JSON.parse(newValue)
            const latestMessage = messages[messages.length - 1]
            if (latestMessage && latestMessage.id > this.lastMessageId) {
              this.lastMessageId = latestMessage.id
              this.messageListeners.forEach(callback => callback(latestMessage))
            }
          } catch (error) {
            console.error('[LocalSync] Error parsing messages:', error)
          }
        }
      }
    })
  }

  syncParticipants(roomCode, userName, userLanguage, callback) {
    if (!roomCode || !userName) return

    const roomKey = `${PARTICIPANTS_KEY}_${roomCode}`
    const currentUser = {
      id: userName,
      name: userName,
      language: userLanguage,
      lastSeen: Date.now()
    }

    let allParticipants = []
    try {
      const stored = localStorage.getItem(roomKey)
      if (stored) {
        allParticipants = JSON.parse(stored)
      }
    } catch (error) {
      console.error('[LocalSync] Error reading participants:', error)
    }

    const existingIndex = allParticipants.findIndex(p => p.id === userName)
    if (existingIndex >= 0) {
      allParticipants[existingIndex] = currentUser
    } else {
      allParticipants.push(currentUser)
    }

    const now = Date.now()
    allParticipants = allParticipants.filter(p => now - p.lastSeen < 10000)

    localStorage.setItem(roomKey, JSON.stringify(allParticipants))
    
    if (callback) {
      callback(allParticipants)
    }

    return allParticipants
  }

  startSync(roomCode, userName, userLanguage, callback) {
    this.syncParticipants(roomCode, userName, userLanguage, callback)
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    this.syncInterval = setInterval(() => {
      this.syncParticipants(roomCode, userName, userLanguage, callback)
    }, 3000)
  }

  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  removeParticipant(roomCode, userName) {
    if (!roomCode) return

    const roomKey = `${PARTICIPANTS_KEY}_${roomCode}`
    try {
      const stored = localStorage.getItem(roomKey)
      if (stored) {
        let allParticipants = JSON.parse(stored)
        allParticipants = allParticipants.filter(p => p.id !== userName)
        localStorage.setItem(roomKey, JSON.stringify(allParticipants))
      }
    } catch (error) {
      console.error('[LocalSync] Error removing participant:', error)
    }
  }

  broadcastMessage(roomCode, message) {
    if (!roomCode) return

    const messagesKey = `${MESSAGES_KEY}_${roomCode}`
    let messages = []
    
    try {
      const stored = localStorage.getItem(messagesKey)
      if (stored) {
        messages = JSON.parse(stored)
      }
    } catch (error) {
      console.error('[LocalSync] Error reading messages:', error)
    }

    messages.push(message)
    
    // Keep only last 100 messages
    if (messages.length > 100) {
      messages = messages.slice(-100)
    }

    localStorage.setItem(messagesKey, JSON.stringify(messages))
    this.lastMessageId = message.id
    console.log('[LocalSync] Broadcast message:', message.id)
  }

  onMessage(callback) {
    this.messageListeners.add(callback)
  }

  offMessage(callback) {
    this.messageListeners.delete(callback)
  }

  clearMessages(roomCode) {
    if (!roomCode) return
    const messagesKey = `${MESSAGES_KEY}_${roomCode}`
    localStorage.removeItem(messagesKey)
  }
}

export default new LocalStorageSync()
