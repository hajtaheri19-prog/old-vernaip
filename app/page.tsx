"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Moon,
  Sun,
  Globe,
  Wifi,
  Shield,
  Search,
  Zap,
  AlertTriangle,
  Clock,
  MapPin,
  Languages,
  Settings,
  ChevronUp,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

const InteractiveMap = ({ latitude, longitude, city, country }: any) => (
  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 flex items-center justify-center h-48 lg:h-64">
    <div className="text-center space-y-2">
      <MapPin className="w-8 h-8 mx-auto text-purple-400" />
      <p className="text-sm text-muted-foreground">
        Map: {city}, {country}
      </p>
      <p className="text-xs text-muted-foreground">
        {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
      </p>
    </div>
  </div>
)

const SpeedTest = () => (
  <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
    <CardContent className="p-6">
      <div className="text-center space-y-4">
        <Zap className="w-12 h-12 mx-auto text-orange-400" />
        <h3 className="text-lg font-semibold">Speed Test</h3>
        <p className="text-muted-foreground">Speed test functionality coming soon</p>
        <Button className="bg-gradient-to-r from-orange-500 to-red-500">Start Test</Button>
      </div>
    </CardContent>
  </Card>
)

const PortScanner = () => (
  <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
    <CardContent className="p-6">
      <div className="text-center space-y-4">
        <Shield className="w-12 h-12 mx-auto text-red-400" />
        <h3 className="text-lg font-semibold">Port Scanner</h3>
        <p className="text-muted-foreground">Port scanning functionality coming soon</p>
        <Button className="bg-gradient-to-r from-red-500 to-pink-500">Start Scan</Button>
      </div>
    </CardContent>
  </Card>
)

const WhoisLookup = () => (
  <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
    <CardContent className="p-6">
      <div className="text-center space-y-4">
        <Search className="w-12 h-12 mx-auto text-green-400" />
        <h3 className="text-lg font-semibold">Whois Lookup</h3>
        <p className="text-muted-foreground">Domain lookup functionality coming soon</p>
        <Button className="bg-gradient-to-r from-green-500 to-blue-500">Lookup Domain</Button>
      </div>
    </CardContent>
  </Card>
)

const AdvancedTools = () => (
  <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
    <CardContent className="p-6">
      <div className="text-center space-y-4">
        <Settings className="w-12 h-12 mx-auto text-cyan-400" />
        <h3 className="text-lg font-semibold">Advanced Tools</h3>
        <p className="text-muted-foreground">Advanced network tools coming soon</p>
        <Button className="bg-gradient-to-r from-cyan-500 to-purple-500">Explore Tools</Button>
      </div>
    </CardContent>
  </Card>
)

interface IPInfo {
  ip: string
  country: string
  countryCode: string
  city: string
  region: string
  regionName: string
  isp: string
  org: string
  timezone: string
  lat: number
  lon: number
  proxy: boolean
  hosting: boolean
  mobile: boolean
  query: string
  status: string
  zip: string
  as: string
}

interface NetworkStatus {
  connectionType: string
  securityStatus: string
  ipv6Support: boolean
  dnsServers: string[]
  responseTime: number
}

export default function IPDetectionApp() {
  const [theme, setTheme] = useState("dark")
  const { language, setLanguage, t, isRTL } = useLanguage()
  const [ipInfo, setIPInfo] = useState<IPInfo | null>(null)
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detectionTime, setDetectionTime] = useState<number | null>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Refs for sections
  const ipSectionRef = useRef<HTMLDivElement>(null)
  const speedSectionRef = useRef<HTMLDivElement>(null)
  const whoisSectionRef = useRef<HTMLDivElement>(null)
  const toolsSectionRef = useRef<HTMLDivElement>(null)
  const portSectionRef = useRef<HTMLDivElement>(null)
  const faqSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.classList.add("dark")

    // Auto-detect IP on load
    detectIP()

    // Handle scroll for scroll-to-top button
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const detectIP = async () => {
    setLoading(true)
    setError(null)
    const startTime = Date.now()

    try {
      let ip: string
      let ipData: any

      const ipServices = [
        "https://api.ipify.org?format=json",
        "https://api64.ipify.org?format=json",
        "https://ipapi.co/json/",
        "https://httpbin.org/ip",
        "https://icanhazip.com",
      ]

      for (const service of ipServices) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

          const response = await fetch(service, {
            signal: controller.signal,
            cache: "no-cache",
          })
          clearTimeout(timeoutId)

          if (!response.ok) continue

          if (service.includes("icanhazip")) {
            ip = (await response.text()).trim()
          } else if (service.includes("httpbin")) {
            const data = await response.json()
            ip = data.origin.split(",")[0].trim()
          } else if (service.includes("ipapi.co")) {
            const data = await response.json()
            ip = data.ip
            if (data.country_name) {
              ipData = {
                query: data.ip,
                country: data.country_name,
                countryCode: data.country_code,
                region: data.region_code,
                regionName: data.region,
                city: data.city,
                zip: data.postal,
                lat: data.latitude,
                lon: data.longitude,
                timezone: data.timezone,
                isp: data.org,
                org: data.org,
                as: data.asn,
                proxy: false,
                hosting: false,
                mobile: false,
                status: "success",
              }
              break
            }
          } else {
            const data = await response.json()
            ip = data.ip
          }

          if (ip) break
        } catch (error) {
          console.warn(`Failed to get IP from ${service}:`, error)
          continue
        }
      }

      if (!ip) {
        throw new Error("Unable to detect IP address from any service")
      }

      // If we don't have detailed info yet, get it from ip-api.com
      if (!ipData) {
        const detailServices = [
          `https://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query,proxy,hosting,mobile`,
          `https://ipapi.co/${ip}/json/`,
          `https://ipinfo.io/${ip}/json`,
        ]

        for (const service of detailServices) {
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 5000)

            const response = await fetch(service, {
              signal: controller.signal,
              cache: "no-cache",
            })
            clearTimeout(timeoutId)

            if (!response.ok) continue
            const data = await response.json()

            if (service.includes("ip-api.com")) {
              if (data.status === "fail") {
                continue
              }
              ipData = data
              break
            } else if (service.includes("ipapi.co")) {
              ipData = {
                query: data.ip,
                country: data.country_name,
                countryCode: data.country_code,
                region: data.region_code,
                regionName: data.region,
                city: data.city,
                zip: data.postal,
                lat: data.latitude,
                lon: data.longitude,
                timezone: data.timezone,
                isp: data.org,
                org: data.org,
                as: data.asn,
                proxy: false,
                hosting: false,
                mobile: false,
                status: "success",
              }
              break
            } else if (service.includes("ipinfo.io")) {
              const [lat, lon] = (data.loc || "0,0").split(",")
              ipData = {
                query: data.ip,
                country: data.country,
                countryCode: data.country,
                region: data.region,
                regionName: data.region,
                city: data.city,
                zip: data.postal,
                lat: Number.parseFloat(lat),
                lon: Number.parseFloat(lon),
                timezone: data.timezone,
                isp: data.org,
                org: data.org,
                as: data.org,
                proxy: false,
                hosting: false,
                mobile: false,
                status: "success",
              }
              break
            }
          } catch (error) {
            console.warn(`Failed to get details from ${service}:`, error)
            continue
          }
        }
      }

      if (!ipData) {
        // Fallback with minimal data
        ipData = {
          query: ip,
          country: "Unknown",
          countryCode: "XX",
          region: "Unknown",
          regionName: "Unknown",
          city: "Unknown",
          zip: "Unknown",
          lat: 0,
          lon: 0,
          timezone: "Unknown",
          isp: "Unknown",
          org: "Unknown",
          as: "Unknown",
          proxy: false,
          hosting: false,
          mobile: false,
          status: "success",
        }
      }

      const endTime = Date.now()
      setDetectionTime(endTime - startTime)

      setIPInfo({
        ip: ipData.query || ip,
        country: ipData.country || "Unknown",
        countryCode: ipData.countryCode || "XX",
        city: ipData.city || "Unknown",
        region: ipData.region || "Unknown",
        regionName: ipData.regionName || "Unknown",
        isp: ipData.isp || "Unknown",
        org: ipData.org || "Unknown",
        timezone: ipData.timezone || "Unknown",
        lat: ipData.lat || 0,
        lon: ipData.lon || 0,
        proxy: ipData.proxy || false,
        hosting: ipData.hosting || false,
        mobile: ipData.mobile || false,
        query: ipData.query || ip,
        status: ipData.status || "success",
        zip: ipData.zip || "Unknown",
        as: ipData.as || "Unknown",
      })

      const connection =
        (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

      // Test IPv6 support
      let ipv6Support = false
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)
        await fetch("https://ipv6.google.com", {
          method: "HEAD",
          mode: "no-cors",
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        ipv6Support = true
      } catch {
        ipv6Support = false
      }

      setNetworkStatus({
        connectionType: connection?.effectiveType || (ipData.mobile ? "Mobile" : "Broadband"),
        securityStatus: ipData.proxy ? "Proxy Detected" : "Direct Connection",
        ipv6Support,
        dnsServers: ["8.8.8.8", "1.1.1.1"],
        responseTime: endTime - startTime,
      })
    } catch (error) {
      console.error("Error detecting IP:", error)
      setError(error instanceof Error ? error.message : "Failed to detect IP information")
    } finally {
      setLoading(false)
    }
  }

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const navigationItems = [
    { id: "ip-detection", name: t("nav.ip-detection"), icon: Globe, ref: ipSectionRef },
    { id: "speed-test", name: t("nav.speed-test"), icon: Zap, ref: speedSectionRef },
    { id: "whois", name: t("nav.whois"), icon: Search, ref: whoisSectionRef },
    { id: "advanced-tools", name: t("nav.advanced-tools") || "Advanced Tools", icon: Settings, ref: toolsSectionRef },
    { id: "port-scanner", name: t("nav.port-scanner"), icon: Shield, ref: portSectionRef },
    { id: "faq", name: t("nav.faq"), icon: AlertTriangle, ref: faqSectionRef },
  ]

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  return (
    <div className={`min-h-screen relative overflow-hidden ${isRTL ? "rtl font-persian" : ""}`}>
      {/* Enhanced background with animated particles */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-teal-900/20 animate-gradient-xy"></div>
      <div className="fixed inset-0 bg-black/10 backdrop-blur-sm"></div>

      {/* Animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-400/30 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-teal-400/40 rounded-full animate-ping"></div>
        <div className="absolute top-1/2 left-3/4 w-3 h-3 bg-blue-400/20 rounded-full animate-bounce"></div>
      </div>

      <nav className="sticky top-0 z-50 bg-black/30 backdrop-blur-xl border-b border-white/20 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 lg:gap-8">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-teal-400 bg-clip-text text-transparent">
                {t("app.title")}
              </h1>
              <div className="hidden md:flex gap-1">
                {navigationItems.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => scrollToSection(item.ref)}
                    className="text-white/80 hover:text-white hover:bg-white/20 transition-all duration-300 rounded-xl px-3 py-2 text-xs lg:text-sm"
                  >
                    <item.icon className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                    <span className="hidden lg:inline">{item.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setLanguage(language === "en" ? "fa" : "en")}
                className="bg-white/10 backdrop-blur-md border-white/30 hover:bg-white/20 transition-all duration-300 rounded-xl w-8 h-8 sm:w-10 sm:h-10"
              >
                <Languages className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="bg-white/10 backdrop-blur-md border-white/30 hover:bg-white/20 transition-all duration-300 rounded-xl w-8 h-8 sm:w-10 sm:h-10"
              >
                {theme === "dark" ? (
                  <Sun className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <Moon className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6 space-y-6 lg:space-y-8">
        <header className="text-center space-y-2 lg:space-y-3 py-2 lg:py-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-teal-400 bg-clip-text text-transparent animate-pulse">
            {t("app.title")}
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
            {t("app.subtitle")}
          </p>
          <div className="flex flex-wrap justify-center gap-2 lg:gap-3 mt-3 lg:mt-4">
            <Badge variant="outline" className="bg-white/10 backdrop-blur-md border-white/20 px-2 py-1 lg:px-3 lg:py-1">
              <Globe className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
              {t("nav.ip-detection")}
            </Badge>
            <Badge variant="outline" className="bg-white/10 backdrop-blur-md border-white/20 px-2 py-1 lg:px-3 lg:py-1">
              <Shield className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
              {t("network.title") || "Network Analysis"}
            </Badge>
            <Badge variant="outline" className="bg-white/10 backdrop-blur-md border-white/20 px-2 py-1 lg:px-3 lg:py-1">
              <Zap className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
              {t("speed.title")}
            </Badge>
          </div>
        </header>

        {/* IP Detection Section - Enhanced with merged layout */}
        <section ref={ipSectionRef} className="space-y-3 lg:space-y-4">
          <div className="text-center space-y-1 lg:space-y-2">
            <h2 className="text-2xl lg:text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">
              {t("ip.title")}
            </h2>
            <p className="text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              {t("ip.subtitle") || "Detect your IP address and location information"}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
            {/* Left side - IP Information and Network Status stacked */}
            <div className="lg:col-span-2 space-y-3">
              {/* IP Information Card */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-base lg:text-lg">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      {t("ip.detailed-info") || "IP Information"}
                    </div>
                    {detectionTime && (
                      <Badge variant="outline" className="sm:ml-auto text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {detectionTime}ms
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {error && (
                    <Alert className="mb-3 bg-red-500/10 border-red-500/20">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {loading ? (
                    <div className="flex items-center justify-center py-4">
                      <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                      <span className="text-muted-foreground text-sm">{t("ip.detecting")}</span>
                    </div>
                  ) : ipInfo ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-muted-foreground">{t("ip.address")}</p>
                              <p className="font-mono text-sm lg:text-base font-bold text-purple-400 truncate">
                                {ipInfo.ip}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToClipboard(ipInfo.ip, "ip")}
                              className="h-6 w-6 flex-shrink-0"
                            >
                              {copiedField === "ip" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>

                          <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-muted-foreground">{t("ip.location")}</p>
                              <p className="text-sm lg:text-base flex items-center gap-2">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">
                                  {ipInfo.city}, {ipInfo.regionName}, {ipInfo.country}
                                </span>
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                copyToClipboard(`${ipInfo.city}, ${ipInfo.regionName}, ${ipInfo.country}`, "location")
                              }
                              className="h-6 w-6 flex-shrink-0"
                            >
                              {copiedField === "location" ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>

                          <div className="p-2 bg-white/5 rounded-lg">
                            <p className="text-xs text-muted-foreground">{t("ip.coordinates")}</p>
                            <p className="font-mono text-xs lg:text-sm">
                              {ipInfo.lat.toFixed(4)}, {ipInfo.lon.toFixed(4)}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="p-2 bg-white/5 rounded-lg">
                            <p className="text-xs text-muted-foreground">{t("ip.isp")}</p>
                            <p className="font-medium text-xs lg:text-sm truncate">{ipInfo.isp}</p>
                          </div>

                          <div className="p-2 bg-white/5 rounded-lg">
                            <p className="text-xs text-muted-foreground">{t("ip.organization")}</p>
                            <p className="font-medium text-xs lg:text-sm truncate">{ipInfo.org}</p>
                          </div>

                          <div className="p-2 bg-white/5 rounded-lg">
                            <p className="text-xs text-muted-foreground">{t("ip.timezone")}</p>
                            <p className="font-medium text-xs lg:text-sm">{ipInfo.timezone}</p>
                          </div>

                          <div className="p-2 bg-white/5 rounded-lg">
                            <p className="text-xs text-muted-foreground">{t("ip.postal")}</p>
                            <p className="font-medium text-xs lg:text-sm">{ipInfo.zip}</p>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={detectIP}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-500 to-teal-500 hover:from-purple-600 hover:to-teal-600 text-sm py-2"
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        {loading ? t("ip.detecting") : t("ip.refresh")}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={detectIP}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-purple-500 to-teal-500 text-sm py-2"
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      {t("ip.detect") || "Detect My IP"}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Network Status Card */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                    <Wifi className="w-4 h-4" />
                    {t("network.title") || "Network Status"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {networkStatus ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs">{t("network.connection") || "Connection"}</span>
                        <Badge variant="secondary" className="text-xs">
                          {networkStatus.connectionType === "Mobile"
                            ? t("network.mobile") || "Mobile"
                            : t("network.broadband") || "Broadband"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">{t("network.security") || "Security"}</span>
                        <Badge
                          variant={networkStatus.securityStatus.includes("Proxy") ? "destructive" : "default"}
                          className="text-xs"
                        >
                          {networkStatus.securityStatus.includes("Proxy")
                            ? t("network.proxy") || "Proxy"
                            : t("network.direct") || "Direct"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">{t("network.ipv6") || "IPv6"}</span>
                        <Badge variant={networkStatus.ipv6Support ? "default" : "secondary"} className="text-xs">
                          {networkStatus.ipv6Support
                            ? t("network.supported") || "Supported"
                            : t("network.not-supported") || "Not Supported"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">{t("network.response-time") || "Response Time"}</span>
                        <Badge variant="outline" className="text-xs">
                          {networkStatus.responseTime}ms
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs">{t("network.connection") || "Connection"}</span>
                        <Badge variant="outline" className="text-xs">
                          {t("network.detecting") || "Detecting..."}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right side - Interactive Map */}
            <div className="lg:col-span-1">
              <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                    <MapPin className="w-4 h-4" />
                    {t("ip.map-title") || "Location Map"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 h-full">
                  {ipInfo ? (
                    <div className="h-48 lg:h-64 rounded-lg overflow-hidden">
                      <InteractiveMap
                        latitude={ipInfo.lat}
                        longitude={ipInfo.lon}
                        city={ipInfo.city}
                        country={ipInfo.country}
                        accuracy={1000}
                      />
                    </div>
                  ) : (
                    <div className="h-48 lg:h-64 rounded-lg bg-white/5 flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <MapPin className="w-8 h-8 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{t("ip.detect-first") || "Detect IP first"}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Speed Test Section */}
        <section ref={speedSectionRef} className="space-y-3 lg:space-y-4">
          <div className="text-center space-y-1 lg:space-y-2">
            <h2 className="text-2xl lg:text-3xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              {t("speed.title")}
            </h2>
            <p className="text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-4">{t("speed.subtitle")}</p>
          </div>
          <SpeedTest />
        </section>

        {/* Whois Lookup Section */}
        <section ref={whoisSectionRef} className="space-y-3 lg:space-y-4">
          <div className="text-center space-y-1 lg:space-y-2">
            <h2 className="text-2xl lg:text-3xl font-bold mb-2 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              {t("whois.title")}
            </h2>
            <p className="text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-4">{t("whois.subtitle")}</p>
          </div>
          <WhoisLookup />
        </section>

        {/* Advanced Tools Section */}
        <section ref={toolsSectionRef} className="space-y-3 lg:space-y-4">
          <div className="text-center space-y-1 lg:space-y-2">
            <h2 className="text-2xl lg:text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              {t("tools.title") || "Advanced Tools"}
            </h2>
            <p className="text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              {t("tools.subtitle") || "Advanced network analysis tools"}
            </p>
          </div>
          <AdvancedTools />
        </section>

        {/* Port Scanner Section */}
        <section ref={portSectionRef} className="space-y-3 lg:space-y-4">
          <div className="text-center space-y-1 lg:space-y-2">
            <h2 className="text-2xl lg:text-3xl font-bold mb-2 bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
              {t("port.title")}
            </h2>
            <p className="text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-4">{t("port.subtitle")}</p>
          </div>
          <PortScanner />
        </section>

        <section ref={faqSectionRef} className="space-y-3 lg:space-y-4">
          <div className="text-center space-y-1 lg:space-y-2">
            <h2 className="text-2xl lg:text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {t("faq.title")}
            </h2>
            <p className="text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-4">{t("faq.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 max-w-6xl mx-auto">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <Card
                key={num}
                className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm lg:text-base text-purple-300">{t(`faq.q${num}`)}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-muted-foreground leading-relaxed text-xs lg:text-sm">{t(`faq.a${num}`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <footer className="border-t border-white/20 pt-6 lg:pt-8 pb-4 lg:pb-6 mt-8 lg:mt-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6">
            <div className="space-y-2">
              <h3 className="text-base lg:text-lg font-bold bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">
                {t("footer.title") || "Advanced IP Detection"}
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {t("footer.description") || "Professional network analysis tools"}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-white text-xs lg:text-sm">{t("footer.features") || "Features"}</h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>{t("nav.ip-detection")}</li>
                <li>{t("nav.speed-test")}</li>
                <li>{t("nav.whois")}</li>
                <li>{t("nav.port-scanner")}</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-white text-xs lg:text-sm">{t("footer.tools") || "Tools"}</h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>{t("nav.advanced-tools") || "Advanced Tools"}</li>
                <li>{t("tools.dns-lookup") || "DNS Lookup"}</li>
                <li>{t("tools.traceroute") || "Traceroute"}</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-white text-xs lg:text-sm">{t("footer.support") || "Support"}</h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>{t("nav.faq")}</li>
                <li>{t("footer.privacy") || "Privacy Policy"}</li>
                <li>{t("footer.terms") || "Terms of Service"}</li>
                <li>{t("footer.contact") || "Contact Us"}</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-3 lg:pt-4 text-center">
            <p className="text-muted-foreground text-xs">
              {t("footer.copyright") || "© 2024 Advanced IP Detection. All rights reserved."}
            </p>
          </div>
        </footer>
      </div>

      {/* Enhanced Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 z-50 rounded-full w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-r from-purple-500 to-teal-500 hover:from-purple-600 hover:to-teal-600 shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 animate-bounce"
          size="icon"
        >
          <ChevronUp className="h-5 w-5 lg:h-6 lg:w-6" />
        </Button>
      )}

      {/* Leaflet CSS link */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
    </div>
  )
}
