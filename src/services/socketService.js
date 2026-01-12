import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

class SocketService {
  constructor() {
    this.socket = null
    this.connected = false
  }

  connect() {
    if (this.socket?.connected) return this.socket

    this.socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    })

    this.socket.on('connect', () => {
      this.connected = true
      console.log('✅ Connected to server:', this.socket.id)
    })

    this.socket.on('disconnect', () => {
      this.connected = false
      console.log('❌ Disconnected from server')
    })

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error)
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.connected = false
    }
  }

  joinRoom(roomCode, userName, userLanguage) {
    if (!this.socket) this.connect()
    
    return new Promise((resolve) => {
      this.socket.emit('join-room', { roomCode, userName, userLanguage })
      
      this.socket.once('room-joined', (data) => {
        console.log(`✅ Joined room ${data.roomCode} with ${data.participants.length} participants`)
        resolve(data)
      })
    })
  }

  leaveRoom(roomCode) {
    if (this.socket) {
      this.socket.emit('leave-room', { roomCode })
    }
  }

  sendMessage(roomCode, message) {
    if (this.socket) {
      this.socket.emit('send-message', { roomCode, message })
    }
  }

  onParticipantsUpdated(callback) {
    if (this.socket) {
      this.socket.on('participants-updated', callback)
    }
  }

  onUserJoined(callback) {
    if (this.socket) {
      this.socket.on('user-joined', callback)
    }
  }

  onUserLeft(callback) {
    if (this.socket) {
      this.socket.on('user-left', callback)
    }
  }

  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new-message', callback)
    }
  }

  offAllListeners() {
    if (this.socket) {
      this.socket.off('participants-updated')
      this.socket.off('user-joined')
      this.socket.off('user-left')
      this.socket.off('new-message')
    }
  }
}

export default new SocketService()
