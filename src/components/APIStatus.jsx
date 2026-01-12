import { useState, useEffect } from 'react'
import { Activity, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { getAPIStats } from '../services/translationService'

function APIStatus() {
  const [stats, setStats] = useState(null)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const currentStats = getAPIStats()
      setStats(currentStats)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  if (!stats) return null

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-500 animate-pulse" />
            <span className="text-sm font-medium text-gray-700">
              API: {stats.currentAPI}
            </span>
          </div>
          <RefreshCw className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        {isExpanded && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <h4 className="text-xs font-semibold text-gray-600 mb-3 uppercase">
              API Status & Usage
            </h4>
            
            <div className="space-y-2">
              {stats.availableAPIs.map((apiName) => {
                const usageCount = stats.usage[apiName] || 0
                const isCurrent = apiName === stats.currentAPI
                
                return (
                  <div
                    key={apiName}
                    className={`flex items-center justify-between p-2 rounded ${
                      isCurrent ? 'bg-green-100 border border-green-300' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isCurrent ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                      )}
                      <span className={`text-sm ${isCurrent ? 'font-semibold text-green-700' : 'text-gray-600'}`}>
                        {apiName}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {usageCount} {usageCount === 1 ? 'request' : 'requests'}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 leading-relaxed">
                💡 <strong>Auto-Fallback:</strong> Tự động chuyển API khi gặp lỗi hoặc hết hạn mức
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default APIStatus
