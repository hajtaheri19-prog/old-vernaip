"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Target, Clock, CheckCircle, XCircle, AlertTriangle, Scan } from "lucide-react"

interface PortResult {
  port: number
  status: "open" | "closed" | "filtered" | "timeout"
  responseTime: number
  service?: string
}

interface ScanProgress {
  current: number
  total: number
  scanning: boolean
}

const COMMON_PORTS = [
  { port: 21, service: "FTP" },
  { port: 22, service: "SSH" },
  { port: 23, service: "Telnet" },
  { port: 25, service: "SMTP" },
  { port: 53, service: "DNS" },
  { port: 80, service: "HTTP" },
  { port: 110, service: "POP3" },
  { port: 143, service: "IMAP" },
  { port: 443, service: "HTTPS" },
  { port: 993, service: "IMAPS" },
  { port: 995, service: "POP3S" },
  { port: 3389, service: "RDP" },
  { port: 5432, service: "PostgreSQL" },
  { port: 3306, service: "MySQL" },
  { port: 1433, service: "MSSQL" },
  { port: 27017, service: "MongoDB" },
  { port: 6379, service: "Redis" },
  { port: 8080, service: "HTTP-Alt" },
  { port: 8443, service: "HTTPS-Alt" },
  { port: 9200, service: "Elasticsearch" },
]

export default function PortScanner() {
  const [target, setTarget] = useState("")
  const [results, setResults] = useState<PortResult[]>([])
  const [scanProgress, setScanProgress] = useState<ScanProgress>({ current: 0, total: 0, scanning: false })
  const [error, setError] = useState<string | null>(null)
  const [scanType, setScanType] = useState<"common" | "custom">("common")
  const [customPorts, setCustomPorts] = useState("")
  const abortControllerRef = useRef<AbortController | null>(null)

  const validateTarget = (target: string): boolean => {
    // Check if it's a valid IP address
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    // Check if it's a valid domain name
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/

    return ipRegex.test(target) || domainRegex.test(target)
  }

  const scanPort = async (host: string, port: number): Promise<PortResult> => {
    const startTime = performance.now()
    const timeout = 3000 // 3 seconds timeout

    const service = COMMON_PORTS.find((p) => p.port === port)?.service

    try {
      // Method 1: Image loading technique (most reliable for browser-based scanning)
      const imageTest = await new Promise<PortResult>((resolve) => {
        const img = new Image()
        const timeoutId = setTimeout(() => {
          resolve({
            port,
            status: "timeout",
            responseTime: timeout,
            service,
          })
        }, timeout)

        img.onload = () => {
          clearTimeout(timeoutId)
          const endTime = performance.now()
          resolve({
            port,
            status: "open",
            responseTime: endTime - startTime,
            service,
          })
        }

        img.onerror = () => {
          clearTimeout(timeoutId)
          const endTime = performance.now()
          const responseTime = endTime - startTime

          // Quick response usually means connection refused (closed)
          // Slow response usually means filtered/timeout
          resolve({
            port,
            status: responseTime < 1000 ? "closed" : "filtered",
            responseTime,
            service,
          })
        }

        // Try to load a small image from the target
        img.src = `http://${host}:${port}/favicon.ico?${Date.now()}`
      })

      // Method 2: Fetch with better error handling
      if (imageTest.status === "timeout" || imageTest.status === "filtered") {
        try {
          const controller = new AbortController()
          const fetchTimeout = setTimeout(() => controller.abort(), 2000)

          await fetch(`http://${host}:${port}`, {
            method: "HEAD",
            mode: "no-cors",
            signal: controller.signal,
          })

          clearTimeout(fetchTimeout)
          const endTime = performance.now()

          return {
            port,
            status: "open",
            responseTime: endTime - startTime,
            service,
          }
        } catch (fetchError: any) {
          // Handle different types of fetch errors
          const endTime = performance.now()
          const responseTime = endTime - startTime

          if (fetchError.name === "AbortError") {
            return {
              port,
              status: "timeout",
              responseTime,
              service,
            }
          } else if (fetchError.message?.includes("Failed to fetch")) {
            // Network error - could be closed or filtered
            return {
              port,
              status: responseTime < 500 ? "closed" : "filtered",
              responseTime,
              service,
            }
          } else {
            // Other errors (CORS, etc.) might indicate an open port
            return {
              port,
              status: "filtered",
              responseTime,
              service,
            }
          }
        }
      }

      return imageTest
    } catch (error) {
      // Fallback result for any unexpected errors
      const endTime = performance.now()
      return {
        port,
        status: "closed",
        responseTime: endTime - startTime,
        service,
      }
    }
  }

  const startScan = async () => {
    if (!target.trim()) {
      setError("Please enter a target IP address or domain name")
      return
    }

    if (!validateTarget(target.trim())) {
      setError("Please enter a valid IP address or domain name")
      return
    }

    setError(null)
    setResults([])

    let portsToScan: number[]

    if (scanType === "common") {
      portsToScan = COMMON_PORTS.map((p) => p.port)
    } else {
      try {
        portsToScan = customPorts
          .split(",")
          .map((p) => Number.parseInt(p.trim()))
          .filter((p) => p > 0 && p <= 65535)

        if (portsToScan.length === 0) {
          setError("Please enter valid port numbers (1-65535)")
          return
        }
      } catch {
        setError("Please enter valid port numbers separated by commas")
        return
      }
    }

    setScanProgress({ current: 0, total: portsToScan.length, scanning: true })
    abortControllerRef.current = new AbortController()

    const scanResults: PortResult[] = []

    try {
      for (let i = 0; i < portsToScan.length; i++) {
        if (abortControllerRef.current?.signal.aborted) {
          break
        }

        const port = portsToScan[i]

        try {
          const result = await scanPort(target.trim(), port)
          scanResults.push(result)
          setResults([...scanResults])
        } catch (portError) {
          // If individual port scan fails, add a failed result
          scanResults.push({
            port,
            status: "timeout",
            responseTime: 3000,
            service: COMMON_PORTS.find((p) => p.port === port)?.service,
          })
          setResults([...scanResults])
        }

        setScanProgress({ current: i + 1, total: portsToScan.length, scanning: true })

        // Small delay to prevent overwhelming the browser
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
    } catch (error) {
      setError("Scan was interrupted or failed")
    } finally {
      setScanProgress((prev) => ({ ...prev, scanning: false }))
      abortControllerRef.current = null
    }
  }

  const stopScan = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "open":
        return "text-green-400"
      case "closed":
        return "text-red-400"
      case "filtered":
        return "text-yellow-400"
      case "timeout":
        return "text-gray-400"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "closed":
        return <XCircle className="w-4 h-4 text-red-400" />
      case "filtered":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case "timeout":
        return <Clock className="w-4 h-4 text-gray-400" />
      default:
        return <XCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const openPorts = results.filter((r) => r.status === "open").length
  const closedPorts = results.filter((r) => r.status === "closed").length
  const filteredPorts = results.filter((r) => r.status === "filtered").length

  return (
    <div className="space-y-6">
      {/* Port Scanner Control Card */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Port Scanner
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
            <div>
              <Label htmlFor="target">Target IP Address or Domain</Label>
              <Input
                id="target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="e.g., 192.168.1.1 or example.com"
                disabled={scanProgress.scanning}
                className="bg-white/5 border-white/20"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="common"
                  name="scanType"
                  checked={scanType === "common"}
                  onChange={() => setScanType("common")}
                  disabled={scanProgress.scanning}
                />
                <Label htmlFor="common">Common Ports ({COMMON_PORTS.length})</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="custom"
                  name="scanType"
                  checked={scanType === "custom"}
                  onChange={() => setScanType("custom")}
                  disabled={scanProgress.scanning}
                />
                <Label htmlFor="custom">Custom Ports</Label>
              </div>
            </div>

            {scanType === "custom" && (
              <div>
                <Label htmlFor="customPorts">Custom Ports (comma-separated)</Label>
                <Input
                  id="customPorts"
                  value={customPorts}
                  onChange={(e) => setCustomPorts(e.target.value)}
                  placeholder="e.g., 80,443,8080,3000"
                  disabled={scanProgress.scanning}
                  className="bg-white/5 border-white/20"
                />
              </div>
            )}

            {scanProgress.scanning && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    Scanning port {scanProgress.current} of {scanProgress.total}
                  </span>
                  <Badge variant="outline">{Math.round((scanProgress.current / scanProgress.total) * 100)}%</Badge>
                </div>
                <Progress value={(scanProgress.current / scanProgress.total) * 100} className="w-full" />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={startScan}
                disabled={scanProgress.scanning}
                className="flex-1 bg-gradient-to-r from-purple-500 to-teal-500"
              >
                <Scan className="w-4 h-4 mr-2" />
                {scanProgress.scanning ? "Scanning..." : "Start Scan"}
              </Button>
              {scanProgress.scanning && (
                <Button onClick={stopScan} variant="outline" className="bg-white/10 backdrop-blur-md border-white/20">
                  Stop
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scan Summary */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{openPorts}</div>
              <p className="text-sm text-muted-foreground">Open</p>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{closedPorts}</div>
              <p className="text-sm text-muted-foreground">Closed</p>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{filteredPorts}</div>
              <p className="text-sm text-muted-foreground">Filtered</p>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{results.length}</div>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Scan Results */}
      {results.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Scan Results for {target}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <span className="font-mono font-medium">Port {result.port}</span>
                      {result.service && <span className="text-sm text-muted-foreground ml-2">({result.service})</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={result.status === "open" ? "default" : "outline"}>
                      {result.status.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{result.responseTime.toFixed(0)}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
