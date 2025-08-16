"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Activity, TrendingUp, Shield, Zap, Globe, Wifi, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface NetworkMetrics {
  timestamp: string
  latency: number
  downloadSpeed: number
  uploadSpeed: number
  packetLoss: number
  jitter: number
}

interface SecurityAnalysis {
  threatLevel: "low" | "medium" | "high"
  vulnerabilities: string[]
  recommendations: string[]
  securityScore: number
}

export default function NetworkAnalytics() {
  const { t } = useLanguage()
  const [metrics, setMetrics] = useState<NetworkMetrics[]>([])
  const [securityAnalysis, setSecurityAnalysis] = useState<SecurityAnalysis | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [realTimeData, setRealTimeData] = useState({
    cpuUsage: 0,
    memoryUsage: 0,
    networkLoad: 0,
    activeConnections: 0,
  })

  useEffect(() => {
    // Initialize with sample data
    const initialData = Array.from({ length: 10 }, (_, i) => ({
      timestamp: new Date(Date.now() - (9 - i) * 60000).toLocaleTimeString(),
      latency: Math.random() * 100 + 20,
      downloadSpeed: Math.random() * 100 + 50,
      uploadSpeed: Math.random() * 50 + 20,
      packetLoss: Math.random() * 5,
      jitter: Math.random() * 10 + 2,
    }))
    setMetrics(initialData)

    // Sample security analysis
    setSecurityAnalysis({
      threatLevel: "low",
      vulnerabilities: ["Open port 80", "Outdated SSL certificate"],
      recommendations: ["Enable firewall", "Update SSL certificate", "Use VPN for sensitive data"],
      securityScore: 85,
    })
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isMonitoring) {
      interval = setInterval(() => {
        // Simulate real-time data updates
        setRealTimeData({
          cpuUsage: Math.random() * 100,
          memoryUsage: Math.random() * 100,
          networkLoad: Math.random() * 100,
          activeConnections: Math.floor(Math.random() * 50) + 10,
        })

        // Add new metric data point
        setMetrics((prev) => {
          const newPoint = {
            timestamp: new Date().toLocaleTimeString(),
            latency: Math.random() * 100 + 20,
            downloadSpeed: Math.random() * 100 + 50,
            uploadSpeed: Math.random() * 50 + 20,
            packetLoss: Math.random() * 5,
            jitter: Math.random() * 10 + 2,
          }
          return [...prev.slice(-9), newPoint]
        })
      }, 2000)
    }
    return () => clearInterval(interval)
  }, [isMonitoring])

  const pieData = [
    { name: "HTTP", value: 40, color: "#8884d8" },
    { name: "HTTPS", value: 35, color: "#82ca9d" },
    { name: "FTP", value: 15, color: "#ffc658" },
    { name: "Other", value: 10, color: "#ff7300" },
  ]

  const getThreatColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-green-500"
      case "medium":
        return "text-yellow-500"
      case "high":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  const getThreatIcon = (level: string) => {
    switch (level) {
      case "low":
        return <CheckCircle className="w-4 h-4" />
      case "medium":
        return <AlertTriangle className="w-4 h-4" />
      case "high":
        return <XCircle className="w-4 h-4" />
      default:
        return <Shield className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Real-time Monitoring Controls */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Real-time Network Monitoring
            </CardTitle>
            <Button
              onClick={() => setIsMonitoring(!isMonitoring)}
              variant={isMonitoring ? "destructive" : "default"}
              className={isMonitoring ? "" : "bg-gradient-to-r from-purple-500 to-teal-500"}
            >
              {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{realTimeData.cpuUsage.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">CPU Usage</div>
              <Progress value={realTimeData.cpuUsage} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-400">{realTimeData.memoryUsage.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Memory Usage</div>
              <Progress value={realTimeData.memoryUsage} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{realTimeData.networkLoad.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Network Load</div>
              <Progress value={realTimeData.networkLoad} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{realTimeData.activeConnections}</div>
              <div className="text-sm text-muted-foreground">Active Connections</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-md border-white/20">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Network Latency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="timestamp" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,0,0,0.8)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "8px",
                      }}
                    />
                    <Line type="monotone" dataKey="latency" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Speed Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="timestamp" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,0,0,0.8)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="downloadSpeed"
                      stackId="1"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="uploadSpeed"
                      stackId="1"
                      stroke="#ffc658"
                      fill="#ffc658"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle>Network Quality Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.slice(-5)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="timestamp" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.8)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="packetLoss" fill="#ff7300" name="Packet Loss %" />
                  <Bar dataKey="jitter" fill="#8884d8" name="Jitter (ms)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          {securityAnalysis && (
            <>
              <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div
                        className={`text-3xl font-bold ${getThreatColor(securityAnalysis.threatLevel)} flex items-center justify-center gap-2`}
                      >
                        {getThreatIcon(securityAnalysis.threatLevel)}
                        {securityAnalysis.threatLevel.toUpperCase()}
                      </div>
                      <div className="text-sm text-muted-foreground">Threat Level</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-400">{securityAnalysis.securityScore}/100</div>
                      <div className="text-sm text-muted-foreground">Security Score</div>
                      <Progress value={securityAnalysis.securityScore} className="mt-2" />
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-400">
                        {securityAnalysis.vulnerabilities.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Vulnerabilities</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2 text-red-400">Detected Vulnerabilities</h4>
                      <ul className="space-y-1">
                        {securityAnalysis.vulnerabilities.map((vuln, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            {vuln}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-green-400">Recommendations</h4>
                      <ul className="space-y-1">
                        {securityAnalysis.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="traffic" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle>Protocol Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle>Traffic Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Requests</span>
                    <Badge variant="secondary">1,247</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Data Transferred</span>
                    <Badge variant="secondary">2.4 GB</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Response Time</span>
                    <Badge variant="secondary">245ms</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Error Rate</span>
                    <Badge variant="destructive">0.3%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-4">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Network Diagnostics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="font-semibold">DNS Resolution</div>
                  <div className="text-sm text-muted-foreground">Working</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="font-semibold">Internet Connectivity</div>
                  <div className="text-sm text-muted-foreground">Connected</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <div className="font-semibold">Firewall Status</div>
                  <div className="text-sm text-muted-foreground">Partial Block</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <Wifi className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="font-semibold">Network Adapter</div>
                  <div className="text-sm text-muted-foreground">Optimal</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
