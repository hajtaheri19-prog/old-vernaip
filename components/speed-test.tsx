"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Zap, Download, Upload, Wifi, Clock, AlertTriangle } from "lucide-react"
import { useTranslation } from "react-i18next"

interface SpeedTestResult {
  downloadSpeed: number
  uploadSpeed: number
  ping: number
  jitter: number
  testDuration: number
}

interface TestProgress {
  phase: "idle" | "ping" | "download" | "upload" | "complete"
  progress: number
  currentSpeed: number
}

export default function SpeedTest() {
  const [testResult, setTestResult] = useState<SpeedTestResult | null>(null)
  const [testProgress, setTestProgress] = useState<TestProgress>({
    phase: "idle",
    progress: 0,
    currentSpeed: 0,
  })
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const { t } = useTranslation()

  const formatSpeed = (speedMbps: number): string => {
    if (speedMbps >= 1000) {
      return `${(speedMbps / 1000).toFixed(2)} Gbps`
    } else if (speedMbps >= 1) {
      return `${speedMbps.toFixed(2)} Mbps`
    } else {
      return `${(speedMbps * 1000).toFixed(0)} Kbps`
    }
  }

  const measurePing = async (): Promise<number> => {
    const pings: number[] = []
    const testUrls = [
      "https://www.google.com/favicon.ico",
      "https://www.cloudflare.com/favicon.ico",
      "https://www.github.com/favicon.ico",
    ]

    for (let i = 0; i < 5; i++) {
      const url = testUrls[i % testUrls.length] + "?t=" + Date.now()
      const startTime = performance.now()

      try {
        await fetch(url, {
          method: "HEAD",
          mode: "no-cors",
          signal: abortControllerRef.current?.signal,
        })
        const endTime = performance.now()
        pings.push(endTime - startTime)
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw error
        }
        // If one ping fails, use a default high value
        pings.push(1000)
      }

      setTestProgress((prev) => ({
        ...prev,
        progress: ((i + 1) / 5) * 100,
      }))
    }

    const avgPing = pings.reduce((a, b) => a + b, 0) / pings.length
    const jitter = Math.sqrt(pings.reduce((sum, ping) => sum + Math.pow(ping - avgPing, 2), 0) / pings.length)

    return avgPing
  }

  const measureDownloadSpeed = async (): Promise<number> => {
    const testSizes = [100, 500, 1000, 2000] // KB
    const speeds: number[] = []

    for (let i = 0; i < testSizes.length; i++) {
      const size = testSizes[i]
      // Use a reliable test file service
      const url = `https://httpbin.org/bytes/${size * 1024}?t=${Date.now()}`

      const startTime = performance.now()

      try {
        const response = await fetch(url, {
          signal: abortControllerRef.current?.signal,
        })

        if (!response.ok) throw new Error("Network response was not ok")

        const data = await response.blob()
        const endTime = performance.now()

        const durationSeconds = (endTime - startTime) / 1000
        const speedMbps = (data.size * 8) / (durationSeconds * 1000000) // Convert to Mbps

        speeds.push(speedMbps)

        setTestProgress((prev) => ({
          ...prev,
          progress: ((i + 1) / testSizes.length) * 100,
          currentSpeed: speedMbps,
        }))

        // Small delay between tests
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw error
        }
        console.warn(`Download test ${i + 1} failed:`, error)
        // Use previous speed or a default low speed
        speeds.push(speeds[speeds.length - 1] || 1)
      }
    }

    // Return the maximum speed achieved (best case scenario)
    return Math.max(...speeds)
  }

  const measureUploadSpeed = async (): Promise<number> => {
    const testSizes = [50, 100, 200, 500] // KB
    const speeds: number[] = []

    for (let i = 0; i < testSizes.length; i++) {
      const size = testSizes[i]
      // Create test data
      const testData = new Blob([new ArrayBuffer(size * 1024)], { type: "application/octet-stream" })

      const startTime = performance.now()

      try {
        const response = await fetch("https://httpbin.org/post", {
          method: "POST",
          body: testData,
          signal: abortControllerRef.current?.signal,
        })

        if (!response.ok) throw new Error("Network response was not ok")

        await response.json() // Consume the response
        const endTime = performance.now()

        const durationSeconds = (endTime - startTime) / 1000
        const speedMbps = (testData.size * 8) / (durationSeconds * 1000000) // Convert to Mbps

        speeds.push(speedMbps)

        setTestProgress((prev) => ({
          ...prev,
          progress: ((i + 1) / testSizes.length) * 100,
          currentSpeed: speedMbps,
        }))

        // Small delay between tests
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw error
        }
        console.warn(`Upload test ${i + 1} failed:`, error)
        // Use previous speed or a default low speed
        speeds.push(speeds[speeds.length - 1] || 0.5)
      }
    }

    // Return the maximum speed achieved
    return Math.max(...speeds)
  }

  const runSpeedTest = async () => {
    setIsRunning(true)
    setError(null)
    setTestResult(null)
    abortControllerRef.current = new AbortController()

    const startTime = performance.now()

    try {
      // Phase 1: Ping Test
      setTestProgress({ phase: "ping", progress: 0, currentSpeed: 0 })
      const ping = await measurePing()

      // Phase 2: Download Test
      setTestProgress({ phase: "download", progress: 0, currentSpeed: 0 })
      const downloadSpeed = await measureDownloadSpeed()

      // Phase 3: Upload Test
      setTestProgress({ phase: "upload", progress: 0, currentSpeed: 0 })
      const uploadSpeed = await measureUploadSpeed()

      const endTime = performance.now()
      const testDuration = (endTime - startTime) / 1000

      const result: SpeedTestResult = {
        downloadSpeed,
        uploadSpeed,
        ping,
        jitter: ping * 0.1, // Simplified jitter calculation
        testDuration,
      }

      setTestResult(result)
      setTestProgress({ phase: "complete", progress: 100, currentSpeed: 0 })
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setError("Speed test was cancelled")
      } else {
        setError("Speed test failed. Please check your internet connection and try again.")
        console.error("Speed test error:", error)
      }
    } finally {
      setIsRunning(false)
      abortControllerRef.current = null
    }
  }

  const stopSpeedTest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const getPhaseLabel = (phase: string): string => {
    switch (phase) {
      case "ping":
        return t("speed.phase-ping")
      case "download":
        return t("speed.phase-download")
      case "upload":
        return t("speed.phase-upload")
      case "complete":
        return t("speed.phase-complete")
      default:
        return t("speed.phase-ready")
    }
  }

  const getSpeedColor = (speed: number): string => {
    if (speed >= 100) return "text-green-400"
    if (speed >= 25) return "text-yellow-400"
    return "text-red-400"
  }

  return (
    <div className="space-y-6">
      {/* Speed Test Control Card */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            {t("speed.card-title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 bg-red-500/10 border-red-500/20">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {isRunning && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{getPhaseLabel(testProgress.phase)}</span>
                  <Badge variant="outline">{testProgress.progress.toFixed(0)}%</Badge>
                </div>
                <Progress value={testProgress.progress} className="w-full" />
                {testProgress.currentSpeed > 0 && (
                  <div className="text-center">
                    <span className="text-2xl font-bold text-purple-400">{formatSpeed(testProgress.currentSpeed)}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={runSpeedTest}
                disabled={isRunning}
                className="flex-1 bg-gradient-to-r from-purple-500 to-teal-500"
              >
                {isRunning ? t("speed.button-testing") : t("speed.button-start")}
              </Button>
              {isRunning && (
                <Button
                  onClick={stopSpeedTest}
                  variant="outline"
                  className="bg-white/10 backdrop-blur-md border-white/20"
                >
                  {t("speed.button-stop")}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Speed Test Results */}
      {testResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Download className="w-4 h-4" />
                {t("speed.download")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getSpeedColor(testResult.downloadSpeed)}`}>
                  {formatSpeed(testResult.downloadSpeed)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t("speed.download-speed")}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Upload className="w-4 h-4" />
                {t("speed.upload")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getSpeedColor(testResult.uploadSpeed)}`}>
                  {formatSpeed(testResult.uploadSpeed)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{t("speed.upload-speed")}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                {t("speed.ping")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{testResult.ping.toFixed(0)} ms</div>
                <p className="text-xs text-muted-foreground mt-1">{t("speed.latency")}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t("speed.duration")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-400">{testResult.testDuration.toFixed(1)}s</div>
                <p className="text-xs text-muted-foreground mt-1">{t("speed.test-time")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
