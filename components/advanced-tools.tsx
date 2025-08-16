"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Route, Database, Download, History, Copy, Clock } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface DNSRecord {
  type: string
  name: string
  value: string
  ttl: number
}

interface TracerouteHop {
  hop: number
  ip: string
  hostname: string
  rtt1: number
  rtt2: number
  rtt3: number
}

interface HistoryItem {
  id: string
  timestamp: string
  tool: string
  target: string
  result: any
}

export default function AdvancedTools() {
  const { t } = useLanguage()
  const [dnsTarget, setDnsTarget] = useState("")
  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([])
  const [dnsLoading, setDnsLoading] = useState(false)

  const [tracerouteTarget, setTracerouteTarget] = useState("")
  const [tracerouteHops, setTracerouteHops] = useState<TracerouteHop[]>([])
  const [tracerouteLoading, setTracerouteLoading] = useState(false)
  const [tracerouteProgress, setTracerouteProgress] = useState(0)

  const [history, setHistory] = useState<HistoryItem[]>([])

  const performDNSLookup = async () => {
    if (!dnsTarget.trim()) return

    setDnsLoading(true)
    try {
      // Simulate DNS lookup with sample data
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const sampleRecords: DNSRecord[] = [
        { type: "A", name: dnsTarget, value: "93.184.216.34", ttl: 3600 },
        { type: "AAAA", name: dnsTarget, value: "2606:2800:220:1:248:1893:25c8:1946", ttl: 3600 },
        { type: "MX", name: dnsTarget, value: "10 mail.example.com", ttl: 7200 },
        { type: "NS", name: dnsTarget, value: "ns1.example.com", ttl: 86400 },
        { type: "NS", name: dnsTarget, value: "ns2.example.com", ttl: 86400 },
        { type: "TXT", name: dnsTarget, value: "v=spf1 include:_spf.google.com ~all", ttl: 3600 },
        { type: "CNAME", name: `www.${dnsTarget}`, value: dnsTarget, ttl: 3600 },
      ]

      setDnsRecords(sampleRecords)

      // Add to history
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString(),
        tool: "DNS Lookup",
        target: dnsTarget,
        result: sampleRecords,
      }
      setHistory((prev) => [historyItem, ...prev.slice(0, 9)])
    } catch (error) {
      console.error("DNS lookup failed:", error)
    } finally {
      setDnsLoading(false)
    }
  }

  const performTraceroute = async () => {
    if (!tracerouteTarget.trim()) return

    setTracerouteLoading(true)
    setTracerouteProgress(0)
    setTracerouteHops([])

    try {
      // Simulate traceroute with progressive hops
      const totalHops = 12
      for (let i = 1; i <= totalHops; i++) {
        await new Promise((resolve) => setTimeout(resolve, 800))

        const hop: TracerouteHop = {
          hop: i,
          ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          hostname: i === totalHops ? tracerouteTarget : `hop${i}.isp.com`,
          rtt1: Math.random() * 100 + 10,
          rtt2: Math.random() * 100 + 10,
          rtt3: Math.random() * 100 + 10,
        }

        setTracerouteHops((prev) => [...prev, hop])
        setTracerouteProgress((i / totalHops) * 100)
      }

      // Add to history
      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString(),
        tool: "Traceroute",
        target: tracerouteTarget,
        result: tracerouteHops,
      }
      setHistory((prev) => [historyItem, ...prev.slice(0, 9)])
    } catch (error) {
      console.error("Traceroute failed:", error)
    } finally {
      setTracerouteLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const exportResults = (format: "json" | "csv") => {
    const data = {
      timestamp: new Date().toISOString(),
      dnsRecords,
      tracerouteHops,
      history,
    }

    let content: string
    let filename: string
    let mimeType: string

    if (format === "json") {
      content = JSON.stringify(data, null, 2)
      filename = `network-analysis-${Date.now()}.json`
      mimeType = "application/json"
    } else {
      // Convert to CSV format
      const csvLines = [
        "Type,Tool,Target,Timestamp,Details",
        ...history.map(
          (item) =>
            `${item.tool},${item.target},${item.timestamp},"${JSON.stringify(item.result).replace(/"/g, '""')}"`,
        ),
      ]
      content = csvLines.join("\n")
      filename = `network-analysis-${Date.now()}.csv`
      mimeType = "text/csv"
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="dns" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-md border-white/20">
          <TabsTrigger value="dns">DNS Lookup</TabsTrigger>
          <TabsTrigger value="traceroute">Traceroute</TabsTrigger>
          <TabsTrigger value="history">History & Export</TabsTrigger>
        </TabsList>

        <TabsContent value="dns" className="space-y-4">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                {t("tools.dns-title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter domain name (e.g., example.com)"
                  value={dnsTarget}
                  onChange={(e) => setDnsTarget(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && performDNSLookup()}
                  className="bg-white/5 border-white/20"
                />
                <Button
                  onClick={performDNSLookup}
                  disabled={dnsLoading || !dnsTarget.trim()}
                  className="bg-gradient-to-r from-purple-500 to-teal-500"
                >
                  {dnsLoading ? "Looking up..." : "Lookup"}
                </Button>
              </div>

              {dnsLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  <span className="ml-3 text-muted-foreground">Performing DNS lookup...</span>
                </div>
              )}

              {dnsRecords.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">DNS Records for {dnsTarget}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(dnsRecords, null, 2))}
                      className="bg-white/5 border-white/20"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Results
                    </Button>
                  </div>

                  <ScrollArea className="h-64 w-full rounded-md border border-white/20 p-4">
                    <div className="space-y-2">
                      {dnsRecords.map((record, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded bg-white/5">
                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className="min-w-[60px] justify-center">
                              {record.type}
                            </Badge>
                            <div>
                              <div className="font-mono text-sm">{record.name}</div>
                              <div className="font-mono text-xs text-muted-foreground">{record.value}</div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">TTL: {record.ttl}s</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traceroute" className="space-y-4">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="w-5 h-5" />
                {t("tools.traceroute-title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter hostname or IP address"
                  value={tracerouteTarget}
                  onChange={(e) => setTracerouteTarget(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && performTraceroute()}
                  className="bg-white/5 border-white/20"
                />
                <Button
                  onClick={performTraceroute}
                  disabled={tracerouteLoading || !tracerouteTarget.trim()}
                  className="bg-gradient-to-r from-purple-500 to-teal-500"
                >
                  {tracerouteLoading ? "Tracing..." : "Trace Route"}
                </Button>
              </div>

              {tracerouteLoading && (
                <div className="space-y-4">
                  <Progress value={tracerouteProgress} className="w-full" />
                  <div className="flex items-center justify-center">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="text-muted-foreground">
                      Tracing route to {tracerouteTarget}... ({Math.round(tracerouteProgress)}%)
                    </span>
                  </div>
                </div>
              )}

              {tracerouteHops.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Route to {tracerouteTarget}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(tracerouteHops, null, 2))}
                      className="bg-white/5 border-white/20"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Results
                    </Button>
                  </div>

                  <ScrollArea className="h-64 w-full rounded-md border border-white/20 p-4">
                    <div className="space-y-2">
                      {tracerouteHops.map((hop, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded bg-white/5">
                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className="min-w-[40px] justify-center">
                              {hop.hop}
                            </Badge>
                            <div>
                              <div className="font-mono text-sm">{hop.hostname}</div>
                              <div className="font-mono text-xs text-muted-foreground">{hop.ip}</div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {hop.rtt1.toFixed(1)}ms / {hop.rtt2.toFixed(1)}ms / {hop.rtt3.toFixed(1)}ms
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  {t("tools.history-title")}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportResults("json")}
                    className="bg-white/5 border-white/20"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export JSON
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportResults("csv")}
                    className="bg-white/5 border-white/20"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No analysis history yet. Run some tools to see results here.</p>
                </div>
              ) : (
                <ScrollArea className="h-64 w-full">
                  <div className="space-y-2">
                    {history.map((item, index) => (
                      <div key={item.id}>
                        <div className="flex items-center justify-between p-3 rounded bg-white/5">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{item.tool}</Badge>
                            <div>
                              <div className="font-mono text-sm">{item.target}</div>
                              <div className="text-xs text-muted-foreground">{item.timestamp}</div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(JSON.stringify(item.result, null, 2))}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        {index < history.length - 1 && <Separator className="my-2" />}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
