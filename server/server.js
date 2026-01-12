import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

const app = express()
const httpServer = createServer(app)

app.use(cors())
app.use(express.json())

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

const rooms = new Map()

io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`)

  socket.on('join-room', ({ roomCode, userName, userLanguage }) => {
    console.log(`👤 ${userName} joining room ${roomCode}`)
    
    socket.join(roomCode)
    
    if (!rooms.has(roomCode)) {
      rooms.set(roomCode, new Map())
    }
    
    const roomParticipants = rooms.get(roomCode)
    roomParticipants.set(socket.id, {
      id: socket.id,
      name: userName,
      language: userLanguage,
      joinedAt: Date.now()
    })
    
    const participants = Array.from(roomParticipants.values())
    
    io.to(roomCode).emit('participants-updated', participants)
    
    socket.emit('room-joined', {
      roomCode,
      participants
    })
    
    socket.to(roomCode).emit('user-joined', {
      userName,
      userLanguage
    })
    
    console.log(`📊 Room ${roomCode} now has ${participants.length} participants`)
  })

  socket.on('send-message', ({ roomCode, message }) => {
    console.log(`💬 Message in room ${roomCode} from ${message.speaker}`)
    
    socket.to(roomCode).emit('new-message', message)
  })

  socket.on('leave-room', ({ roomCode }) => {
    handleLeaveRoom(socket, roomCode)
  })

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`)
    
    rooms.forEach((participants, roomCode) => {
      if (participants.has(socket.id)) {
        handleLeaveRoom(socket, roomCode)
      }
    })
  })

  function handleLeaveRoom(socket, roomCode) {
    if (!rooms.has(roomCode)) return
    
    const roomParticipants = rooms.get(roomCode)
    const participant = roomParticipants.get(socket.id)
    
    if (participant) {
      roomParticipants.delete(socket.id)
      
      socket.leave(roomCode)
      
      const participants = Array.from(roomParticipants.values())
      io.to(roomCode).emit('participants-updated', participants)
      
      socket.to(roomCode).emit('user-left', {
        userName: participant.name
      })
      
      console.log(`👋 ${participant.name} left room ${roomCode}`)
      console.log(`📊 Room ${roomCode} now has ${participants.length} participants`)
      
      if (roomParticipants.size === 0) {
        rooms.delete(roomCode)
        console.log(`🗑️  Room ${roomCode} deleted (empty)`)
      }
    }
  }
})

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    rooms: rooms.size,
    totalParticipants: Array.from(rooms.values()).reduce((sum, p) => sum + p.size, 0)
  })
})

app.get('/rooms', (req, res) => {
  const roomList = Array.from(rooms.entries()).map(([code, participants]) => ({
    code,
    participantCount: participants.size,
    participants: Array.from(participants.values()).map(p => ({
      name: p.name,
      language: p.language
    }))
  }))
  
  res.json({ rooms: roomList })
})

const PORT = process.env.PORT || 3001

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📡 WebSocket ready for connections`)
})
