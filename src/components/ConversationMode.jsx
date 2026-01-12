import { useState, useEffect, useRef } from 'react'
import { Users, Mic, MicOff, Volume2, UserPlus, LogOut, Settings, Copy, Trash2, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { translateText } from '../services/translationService'
import { languages } from '../data/languages'
import socketService from '../services/socketService'
import localStorageSync from '../services/localStorageSync'

const STORAGE_KEY = 'conversation_room_state'
const USE_WEBSOCKET = false

function ConversationMode() {
  const [roomCode, setRoomCode] = useState('')
  const [isInRoom, setIsInRoom] = useState(false)
  const [userName, setUserName] = useState('')
  const [userLanguage, setUserLanguage] = useState('vi')
  const [participants, setParticipants] = useState([])
  const [messages, setMessages] = useState([])
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isHandsFree, setIsHandsFree] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [speechSpeed, setSpeechSpeed] = useState(0.9)
  const [isConnected, setIsConnected] = useState(false)
  const [useOfflineMode, setUseOfflineMode] = useState(!USE_WEBSOCKET)
  const recognitionRef = useRef(null)
  const synthesisRef = useRef(null)
  const messagesEndRef = useRef(null)
  const silenceTimerRef = useRef(null)

  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY)
    if (savedState) {
      try {
        const state = JSON.parse(savedState)
        setRoomCode(state.roomCode)
        setUserName(state.userName)
        setUserLanguage(state.userLanguage)
        setMessages(state.messages || [])
      } catch (error) {
        console.error('Error restoring state:', error)
      }
    }

    if (USE_WEBSOCKET) {
      const socket = socketService.connect()
      setIsConnected(socket.connected)

      socket.on('connect', () => {
        setIsConnected(true)
        setUseOfflineMode(false)
        console.log('✅ Connected to server')
      })

      socket.on('disconnect', () => {
        setIsConnected(false)
        console.log('❌ Disconnected from server')
      })

      socket.on('connect_error', () => {
        setUseOfflineMode(true)
        console.log('⚠️ Using offline mode (localStorage)')
      })
    } else {
      setUseOfflineMode(true)
      console.log('📱 Offline mode enabled (localStorage only)')
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = false
      
      recognitionRef.current.onresult = async (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript
        await handleSpeechResult(transcript)
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        if (isListening || isHandsFree) {
          try {
            recognitionRef.current.start()
          } catch (error) {
            console.error('Error restarting recognition:', error)
          }
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (USE_WEBSOCKET) {
        socketService.offAllListeners()
        socketService.disconnect()
      }
      localStorageSync.stopSync()
    }
  }, [])

  useEffect(() => {
    if (isInRoom && roomCode) {
      const state = {
        roomCode,
        userName,
        userLanguage,
        messages
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [isInRoom, roomCode, userName, userLanguage, messages])

  useEffect(() => {
    if (isInRoom && roomCode && userName) {
      if (useOfflineMode) {
        localStorageSync.startSync(roomCode, userName, userLanguage, (participants) => {
          setParticipants(participants)
        })

        const handleNewMessage = (message) => {
          if (message.speaker !== userName) {
            console.log('[LocalSync] Received message from:', message.speaker)
            setMessages(prev => [...prev, message])
            
            const myLanguage = userLanguage
            const textToSpeak = message.translations[myLanguage] || message.originalText
            if (textToSpeak && autoSpeak) {
              speakText(textToSpeak, myLanguage)
            }
          }
        }

        localStorageSync.onMessage(handleNewMessage)

        return () => {
          localStorageSync.stopSync()
          localStorageSync.offMessage(handleNewMessage)
        }
      } else {
        socketService.onParticipantsUpdated((participants) => {
          console.log(`👥 Participants updated: ${participants.length}`, participants)
          setParticipants(participants)
        })

        socketService.onUserJoined(({ userName: newUser, userLanguage: newLang }) => {
          addSystemMessage(`${newUser} đã tham gia phòng`)
        })

        socketService.onUserLeft(({ userName: leftUser }) => {
          addSystemMessage(`${leftUser} đã rời khỏi phòng`)
        })

        socketService.onNewMessage((message) => {
          setMessages(prev => [...prev, message])
          
          const myLanguage = userLanguage
          if (message.translations[myLanguage]) {
            speakText(message.translations[myLanguage], myLanguage)
          }
        })

        return () => {
          socketService.offAllListeners()
        }
      }
    }
  }, [isInRoom, roomCode, userName, userLanguage, useOfflineMode, autoSpeak])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }


  const createRoom = async () => {
    if (!userName.trim()) {
      alert('Vui lòng nhập tên của bạn')
      return
    }
    const code = generateRoomCode()
    setRoomCode(code)
    
    if (useOfflineMode) {
      setIsInRoom(true)
      const participants = localStorageSync.syncParticipants(code, userName, userLanguage)
      setParticipants(participants)
      addSystemMessage(`Phòng ${code} đã được tạo. Chia sẻ mã này với người khác để họ tham gia.`)
    } else {
      try {
        const data = await socketService.joinRoom(code, userName, userLanguage)
        setIsInRoom(true)
        setParticipants(data.participants)
        addSystemMessage(`Phòng ${code} đã được tạo. Chia sẻ mã này với người khác để họ tham gia.`)
      } catch (error) {
        console.error('Error creating room:', error)
        setUseOfflineMode(true)
        setIsInRoom(true)
        const participants = localStorageSync.syncParticipants(code, userName, userLanguage)
        setParticipants(participants)
        addSystemMessage(`⚠️ Chế độ offline: Phòng ${code} đã được tạo (chỉ hoạt động trên cùng thiết bị).`)
      }
    }
  }

  const joinRoom = async () => {
    if (!userName.trim() || !roomCode.trim()) {
      alert('Vui lòng nhập tên và mã phòng')
      return
    }
    
    if (useOfflineMode) {
      setIsInRoom(true)
      const participants = localStorageSync.syncParticipants(roomCode, userName, userLanguage)
      setParticipants(participants)
      addSystemMessage(`${userName} đã tham gia phòng ${roomCode}`)
    } else {
      try {
        const data = await socketService.joinRoom(roomCode, userName, userLanguage)
        setIsInRoom(true)
        setParticipants(data.participants)
        addSystemMessage(`${userName} đã tham gia phòng ${roomCode}`)
      } catch (error) {
        console.error('Error joining room:', error)
        setUseOfflineMode(true)
        setIsInRoom(true)
        const participants = localStorageSync.syncParticipants(roomCode, userName, userLanguage)
        setParticipants(participants)
        addSystemMessage(`⚠️ Chế độ offline: ${userName} đã tham gia phòng ${roomCode} (chỉ hoạt động trên cùng thiết bị).`)
      }
    }
  }

  const leaveRoom = () => {
    if (isListening) {
      stopListening()
    }
    
    if (roomCode) {
      if (useOfflineMode) {
        localStorageSync.removeParticipant(roomCode, userName)
        localStorageSync.stopSync()
      } else {
        socketService.leaveRoom(roomCode)
      }
    }
    
    localStorage.removeItem(STORAGE_KEY)
    setIsInRoom(false)
    setRoomCode('')
    setParticipants([])
    setMessages([])
  }

  const clearMessages = () => {
    if (useOfflineMode) {
      localStorageSync.clearMessages(roomCode)
    }
    setMessages([])
  }

  const addSystemMessage = (text) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'system',
      text,
      timestamp: new Date()
    }])
  }

  const handleSpeechResult = async (transcript) => {
    const message = {
      id: Date.now(),
      type: 'message',
      speaker: userName,
      speakerLanguage: userLanguage,
      originalText: transcript,
      translations: {},
      timestamp: new Date()
    }

    const uniqueLanguages = [...new Set(participants.map(p => p.language))]
    
    for (const lang of uniqueLanguages) {
      if (lang !== userLanguage) {
        try {
          const translated = await translateText(transcript, userLanguage, lang)
          message.translations[lang] = translated
        } catch (error) {
          console.error(`Translation error for ${lang}:`, error)
        }
      } else {
        message.translations[lang] = transcript
      }
    }

    setMessages(prev => [...prev, message])
    
    if (useOfflineMode) {
      localStorageSync.broadcastMessage(roomCode, message)
    } else {
      socketService.sendMessage(roomCode, message)
    }
    
    console.log('[Voice] Message sent:', message.originalText)
  }

  const speakText = (text, lang) => {
    if ('speechSynthesis' in window && autoSpeak) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      utterance.rate = speechSpeed
      
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      
      window.speechSynthesis.speak(utterance)
    }
  }

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = userLanguage
        recognitionRef.current.start()
        setIsListening(true)
      } catch (error) {
        console.error('Error starting recognition:', error)
      }
    }
  }

  const toggleHandsFree = () => {
    if (isHandsFree) {
      stopListening()
      setIsHandsFree(false)
    } else {
      setIsHandsFree(true)
      startListening()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode)
    alert('Đã sao chép mã phòng!')
  }

  if (!isInRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <Users className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Conversation Mode</h1>
            <p className="text-gray-600">Tạo hoặc tham gia phòng hội thoại đa ngôn ngữ</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên của bạn
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Nhập tên..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngôn ngữ của bạn
              </label>
              <select
                value={userLanguage}
                onChange={(e) => setUserLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 space-y-3">
              <button
                onClick={createRoom}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                Tạo phòng mới
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">hoặc</span>
                </div>
              </div>

              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Nhập mã phòng"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-center font-mono text-lg"
                maxLength={6}
              />

              <button
                onClick={joinRoom}
                className="w-full bg-white text-purple-600 py-3 rounded-lg font-medium border-2 border-purple-600 hover:bg-purple-50 transition-colors"
              >
                Tham gia phòng
              </button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Lưu ý:</strong> Tính năng này sử dụng Web Speech API. 
              Hãy cho phép truy cập microphone khi được yêu cầu.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex flex-col">
      <div className="bg-white shadow-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Users className="w-6 h-6 text-purple-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-800">Phòng: {roomCode}</h2>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-600">{participants.length} người tham gia</p>
                  {useOfflineMode ? (
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <Users className="w-3 h-3" />
                      <span>Chế độ cùng thiết bị</span>
                    </div>
                  ) : isConnected ? (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <Wifi className="w-3 h-3" />
                      <span>Cross-device</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-yellow-600">
                      <WifiOff className="w-3 h-3" />
                      <span>Đang kết nối...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyRoomCode}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Sao chép mã phòng"
              >
                <Copy className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Cài đặt"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={clearMessages}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Xóa lịch sử"
              >
                <Trash2 className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={leaveRoom}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Rời phòng
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="max-w-2xl">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Cài đặt
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Tự động phát âm</span>
                  <button
                    onClick={() => setAutoSpeak(!autoSpeak)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      autoSpeak ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        autoSpeak ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Tốc độ giọng nói: {speechSpeed.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={speechSpeed}
                    onChange={(e) => setSpeechSpeed(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 container mx-auto px-4 py-6 flex gap-6">
        <div className="w-64 bg-white rounded-xl shadow-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Người tham gia
          </h3>
          <div className="space-y-2">
            {participants.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Chưa có người tham gia</p>
              </div>
            ) : (
              participants.map((participant) => (
                <div
                  key={participant.id}
                  className={`p-3 rounded-lg border ${
                    participant.name === userName
                      ? 'bg-purple-50 border-purple-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="font-medium text-gray-800 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {participant.name}
                    {participant.name === userName && (
                      <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded">
                        Bạn
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 mt-1 ml-4">
                    {languages.find(l => l.code === participant.language)?.name}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-lg">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.type === 'system' ? (
                  <div className="text-center">
                    <span className="text-sm text-gray-500 bg-gray-100 px-4 py-1 rounded-full">
                      {msg.text}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">{msg.speaker}</span>
                      <span className="text-xs text-gray-500">
                        {languages.find(l => l.code === msg.speakerLanguage)?.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="bg-purple-100 rounded-lg p-3">
                      <p className="text-gray-800">{msg.originalText}</p>
                    </div>
                    {Object.entries(msg.translations).map(([lang, text]) => (
                      <div key={lang} className="ml-6 bg-gray-50 rounded-lg p-3 border-l-4 border-purple-400">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-600">
                            → {languages.find(l => l.code === lang)?.name}
                          </span>
                          <button
                            onClick={() => speakText(text, lang)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Nghe"
                          >
                            <Volume2 className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                        <p className="text-gray-700">{text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t p-6 bg-gray-50">
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <button
                  onClick={toggleHandsFree}
                  className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    isHandsFree
                      ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  {isHandsFree ? '🤚 Tắt chế độ rảnh tay' : '🎤 Bật chế độ rảnh tay'}
                </button>
              </div>
              
              {!isHandsFree && (
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={isListening ? stopListening : startListening}
                    className={`p-6 rounded-full transition-all ${
                      isListening
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                        : 'bg-purple-600 hover:bg-purple-700'
                    } text-white shadow-lg`}
                  >
                    {isListening ? (
                      <MicOff className="w-8 h-8" />
                    ) : (
                      <Mic className="w-8 h-8" />
                    )}
                  </button>
                  <div className="text-center">
                    <p className="font-medium text-gray-800">
                      {isListening ? 'Đang lắng nghe...' : 'Nhấn để bắt đầu nói'}
                    </p>
                    {isSpeaking && (
                      <p className="text-sm text-purple-600 flex items-center gap-2 justify-center mt-1">
                        <Volume2 className="w-4 h-4 animate-pulse" />
                        Đang phát âm thanh...
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {isHandsFree && (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">Chế độ rảnh tay đang hoạt động - Chỉ cần nói!</span>
                  </div>
                  {isSpeaking && (
                    <p className="text-sm text-purple-600 flex items-center gap-2 justify-center mt-2">
                      <Volume2 className="w-4 h-4 animate-pulse" />
                      Đang phát âm thanh...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConversationMode
