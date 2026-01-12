// LocalStorage-based sync for offline/same-device mode
const PARTICIPANTS_KEY = 'conversation_participants'

class LocalStorageSync {
  constructor() {
    this.syncInterval = null
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
}

export default new LocalStorageSync()
