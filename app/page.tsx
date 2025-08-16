"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Globe,
  Wifi,
  Shield,
  Search,
  Zap,
  AlertTriangle,
  Clock,
  Languages,
  Settings,
  ChevronUp,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import dynamic from "next/dynamic"

const SpeedTest = dynamic(() => import("@/components/speed-test"), { ssr: false })
const PortScanner = dynamic(() => import("@/components/port-scanner"), { ssr: false })
const WhoisLookup = dynamic(() => import("@/components/whois-lookup"), { ssr: false })
const AdvancedTools = dynamic(() => import("@/components/advanced-tools"), { ssr: false })

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
  const { language, setLanguage, t, isRTL } = useLanguage()
  const [mounted, setMounted] = useState(false)
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
    setMounted(true)
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

  if (!mounted) return null

  const navigationItems = [
    { id: "ip-detection", name: t("nav.ip-detection"), icon: Globe, ref: ipSectionRef },
    { id: "speed-test", name: t("nav.speed-test"), icon: Zap, ref: speedSectionRef },
    { id: "whois", name: t("nav.whois"), icon: Search, ref: whoisSectionRef },
    { id: "advanced-tools", name: t("nav.advanced-tools") || "Advanced Tools", icon: Settings, ref: toolsSectionRef },
    { id: "port-scanner", name: t("nav.port-scanner"), icon: Shield, ref: portSectionRef },
    { id: "faq", name: t("nav.faq"), icon: AlertTriangle, ref: faqSectionRef },
  ]

  return (
    <div className={`min-h-screen relative overflow-hidden ${isRTL ? "rtl font-persian" : ""}`}>
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
                <Languages className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 lg:py-3 space-y-4 lg:space-y-5">
        <header className="text-center space-y-1 lg:space-y-2 py-1 lg:py-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-teal-400 bg-clip-text text-transparent animate-pulse">
            {t("app.title")}
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed px-4">
            {t("app.subtitle")}
          </p>
          <div className="flex flex-wrap justify-center gap-1 lg:gap-2 mt-2 lg:mt-3">
            <Badge
              variant="outline"
              className="bg-white/10 backdrop-blur-md border-white/20 px-2 py-1 text-xs text-white"
            >
              <Globe className="w-3 h-3 mr-1" />
              {t("nav.ip-detection")}
            </Badge>
            <Badge
              variant="outline"
              className="bg-white/10 backdrop-blur-md border-white/20 px-2 py-1 text-xs text-white"
            >
              <Shield className="w-3 h-3 mr-1" />
              {t("network.title") || "Network Analysis"}
            </Badge>
            <Badge
              variant="outline"
              className="bg-white/10 backdrop-blur-md border-white/20 px-2 py-1 text-xs text-white"
            >
              <Zap className="w-3 h-3 mr-1" />
              {t("speed.title")}
            </Badge>
          </div>
        </header>

        <section ref={ipSectionRef} className="space-y-2 lg:space-y-3">
          <div className="text-center space-y-1">
            <h2 className="text-xl lg:text-2xl font-bold mb-1 bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">
              {t("ip.title")}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
              <CardHeader className="pb-1">
                <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm lg:text-base text-white">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    {t("ip.detailed-info") || "IP Information"}
                  </div>
                  {detectionTime && (
                    <Badge variant="outline" className="sm:ml-auto text-xs text-white">
                      <Clock className="w-3 h-3 mr-1" />
                      {detectionTime}ms
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {error && (
                  <Alert className="mb-2 bg-red-500/10 border-red-500/20">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-xs text-red-500">{error}</AlertDescription>
                  </Alert>
                )}

                {loading ? (
                  <div className="flex items-center justify-center py-3">
                    <RefreshCw className="animate-spin h-4 w-4 mr-2 text-white" />
                    <span className="text-muted-foreground text-xs text-white">{t("ip.detecting")}</span>
                  </div>
                ) : ipInfo ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground text-white">{t("ip.address")}</p>
                          <p className="font-mono text-xs lg:text-sm font-bold text-purple-400 truncate">{ipInfo.ip}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(ipInfo.ip, "ip")}
                          className="h-5 w-5 flex-shrink-0 text-white"
                        >
                          {copiedField === "ip" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>

                      <div className="p-2 bg-white/5 rounded-lg">
                        <p className="text-xs text-muted-foreground text-white">{t("ip.location")}</p>
                        <p className="text-xs lg:text-sm text-white">
                          {ipInfo.city}, {ipInfo.regionName}, {ipInfo.country}
                        </p>
                      </div>

                      <div className="p-2 bg-white/5 rounded-lg">
                        <p className="text-xs text-muted-foreground text-white">{t("ip.coordinates")}</p>
                        <p className="font-mono text-xs text-white">
                          {ipInfo.lat.toFixed(4)}, {ipInfo.lon.toFixed(4)}
                        </p>
                      </div>

                      <div className="p-2 bg-white/5 rounded-lg">
                        <p className="text-xs text-muted-foreground text-white">{t("ip.isp")}</p>
                        <p className="font-medium text-xs truncate text-white">{ipInfo.isp}</p>
                      </div>

                      <div className="p-2 bg-white/5 rounded-lg">
                        <p className="text-xs text-muted-foreground text-white">{t("ip.timezone")}</p>
                        <p className="font-medium text-xs text-white">{ipInfo.timezone}</p>
                      </div>
                    </div>

                    <Button
                      onClick={detectIP}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-purple-500 to-teal-500 hover:from-purple-600 hover:to-teal-600 text-xs py-2"
                    >
                      <RefreshCw className={`w-3 h-3 mr-2 text-white ${loading ? "animate-spin" : ""}`} />
                      {loading ? t("ip.detecting") : t("ip.refresh")}
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={detectIP}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-500 to-teal-500 text-xs py-2"
                  >
                    <Globe className="w-3 h-3 mr-2 text-white" />
                    {t("ip.detect") || "Detect My IP"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Network Status Card */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
              <CardHeader className="pb-1">
                <CardTitle className="flex items-center gap-2 text-sm lg:text-base text-white">
                  <Wifi className="w-4 h-4" />
                  {t("network.title") || "Network Status"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {networkStatus ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                      <span className="text-xs text-white">{t("network.connection") || "Connection"}</span>
                      <Badge variant="secondary" className="text-xs px-1 py-0 text-white">
                        {networkStatus.connectionType === "Mobile"
                          ? t("network.mobile") || "Mobile"
                          : t("network.broadband") || "Broadband"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                      <span className="text-xs text-white">{t("network.security") || "Security"}</span>
                      <Badge
                        variant={networkStatus.securityStatus.includes("Proxy") ? "destructive" : "default"}
                        className="text-xs px-1 py-0 text-white"
                      >
                        {networkStatus.securityStatus.includes("Proxy")
                          ? t("network.proxy") || "Proxy"
                          : t("network.direct") || "Direct"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                      <span className="text-xs text-white">{t("network.ipv6") || "IPv6"}</span>
                      <Badge
                        variant={networkStatus.ipv6Support ? "default" : "secondary"}
                        className="text-xs px-1 py-0 text-white"
                      >
                        {networkStatus.ipv6Support
                          ? t("network.supported") || "Supported"
                          : t("network.not-supported") || "Not Supported"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                      <span className="text-xs text-white">{t("network.response-time") || "Response Time"}</span>
                      <Badge variant="outline" className="text-xs px-1 py-0 text-white">
                        {networkStatus.responseTime}ms
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white">{t("network.connection") || "Connection"}</span>
                      <Badge variant="outline" className="text-xs text-white">
                        {t("network.detecting") || "Detecting..."}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Speed Test Section - More compact */}
        <section ref={speedSectionRef} className="space-y-2 lg:space-y-3">
          <div className="text-center space-y-1">
            <h2 className="text-xl lg:text-2xl font-bold mb-1 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              {t("speed.title")}
            </h2>
            <p className="text-sm lg:text-base text-gray-300 max-w-xl mx-auto leading-relaxed px-4">
              {t("speed.subtitle")}
            </p>
          </div>
          <SpeedTest />
        </section>

        {/* Whois Lookup Section - More compact */}
        <section ref={whoisSectionRef} className="space-y-2 lg:space-y-3">
          <div className="text-center space-y-1">
            <h2 className="text-xl lg:text-2xl font-bold mb-1 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              {t("whois.title")}
            </h2>
            <p className="text-sm lg:text-base text-gray-300 max-w-xl mx-auto leading-relaxed px-4">
              {t("whois.subtitle")}
            </p>
          </div>
          <WhoisLookup />
        </section>

        {/* Advanced Tools Section - More compact */}
        <section ref={toolsSectionRef} className="space-y-2 lg:space-y-3">
          <div className="text-center space-y-1">
            <h2 className="text-xl lg:text-2xl font-bold mb-1 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              {t("tools.title") || "Advanced Tools"}
            </h2>
            <p className="text-sm lg:text-base text-gray-300 max-w-xl mx-auto leading-relaxed px-4">
              {t("tools.subtitle") || "Advanced network analysis tools"}
            </p>
          </div>
          <AdvancedTools />
        </section>

        {/* Port Scanner Section - More compact */}
        <section ref={portSectionRef} className="space-y-2 lg:space-y-3">
          <div className="text-center space-y-1">
            <h2 className="text-xl lg:text-2xl font-bold mb-1 bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
              {t("port.title")}
            </h2>
            <p className="text-sm lg:text-base text-gray-300 max-w-xl mx-auto leading-relaxed px-4">
              {t("port.subtitle")}
            </p>
          </div>
          <PortScanner />
        </section>

        {/* FAQ Section - More compact grid */}
        <section ref={faqSectionRef} className="space-y-2 lg:space-y-3">
          <div className="text-center space-y-1">
            <h2 className="text-xl lg:text-2xl font-bold mb-1 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {t("faq.title")}
            </h2>
            <p className="text-sm lg:text-base text-gray-300 max-w-xl mx-auto leading-relaxed px-4">
              {t("faq.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 lg:gap-3 max-w-6xl mx-auto">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <Card
                key={num}
                className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300"
              >
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs lg:text-sm text-purple-300">{t(`faq.q${num}`)}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-300 leading-relaxed text-xs">{t(`faq.a${num}`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Footer - More compact */}
        <footer className="border-t border-white/20 pt-3 lg:pt-4 pb-2 lg:pb-3 mt-4 lg:mt-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 mb-3 lg:mb-4">
            <div className="space-y-1">
              <h3 className="text-sm lg:text-base font-bold bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">
                {t("footer.title") || "Advanced IP Detection"}
              </h3>
              <p className="text-gray-300 text-xs leading-relaxed">
                {t("footer.description") || "Professional network analysis tools"}
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="font-semibold text-white text-xs">{t("footer.features") || "Features"}</h4>
              <ul className="space-y-0.5 text-xs text-gray-300">
                <li>{t("nav.ip-detection")}</li>
                <li>{t("nav.speed-test")}</li>
                <li>{t("nav.whois")}</li>
                <li>{t("nav.port-scanner")}</li>
              </ul>
            </div>

            <div className="space-y-1">
              <h4 className="font-semibold text-white text-xs">{t("footer.tools") || "Tools"}</h4>
              <ul className="space-y-0.5 text-xs text-gray-300">
                <li>{t("nav.advanced-tools") || "Advanced Tools"}</li>
                <li>{t("tools.dns-lookup") || "DNS Lookup"}</li>
                <li>{t("tools.traceroute") || "Traceroute"}</li>
              </ul>
            </div>

            <div className="space-y-1">
              <h4 className="font-semibold text-white text-xs">{t("footer.support") || "Support"}</h4>
              <ul className="space-y-0.5 text-xs text-gray-300">
                <li>{t("nav.faq")}</li>
                <li>{t("footer.privacy") || "Privacy Policy"}</li>
                <li>{t("footer.terms") || "Terms of Service"}</li>
                <li>{t("footer.contact") || "Contact Us"}</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-2 lg:pt-3 text-center space-y-1">
            <p className="text-gray-300 text-xs">
              {t("footer.copyright") || "© 2024 Advanced IP Detection. All rights reserved."}
            </p>
            <p className="text-gray-300 text-xs">{t("footer.developer")}</p>
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
          <ChevronUp className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
        </Button>
      )}
    </div>
  )
}
