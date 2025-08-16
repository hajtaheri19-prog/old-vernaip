"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Globe, Calendar, User, Server, AlertTriangle, Copy, CheckCircle, ExternalLink, Database } from "lucide-react"
import { useTranslation } from "react-i18next"

interface WhoisData {
  domain: string
  registrar?: string
  registrationDate?: string
  expirationDate?: string
  updatedDate?: string
  nameServers?: string[]
  status?: string[]
  registrant?: {
    name?: string
    organization?: string
    country?: string
    email?: string
  }
  admin?: {
    name?: string
    organization?: string
    country?: string
    email?: string
  }
  tech?: {
    name?: string
    organization?: string
    country?: string
    email?: string
  }
  raw?: string
  source?: string
}

export default function WhoisLookup() {
  const [domain, setDomain] = useState("")
  const [whoisData, setWhoisData] = useState<WhoisData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const { t } = useTranslation()

  const validateDomain = (domain: string): boolean => {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/
    return domainRegex.test(domain)
  }

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return dateString
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
    }
  }

  const performWhoisLookup = async () => {
    if (!domain.trim()) {
      setError(t("whois.error-empty-domain"))
      return
    }

    const cleanDomain = domain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")

    if (!validateDomain(cleanDomain)) {
      setError(t("whois.error-invalid-domain"))
      return
    }

    setLoading(true)
    setError(null)
    setWhoisData(null)

    try {
      // DumbWhoIs-inspired approach: Use direct whois protocol simulation with multiple authoritative sources
      const directWhoisAPIs = [
        {
          name: "HackerTarget Direct WHOIS",
          url: `https://api.hackertarget.com/whois/?q=${encodeURIComponent(cleanDomain)}`,
          parser: (text: string) => parseDirectWhoisResponse(text, cleanDomain, "HackerTarget Direct WHOIS"),
        },
        {
          name: "WhoisJS Direct Query",
          url: `https://whoisjs.com/api/v1/${encodeURIComponent(cleanDomain)}`,
          parser: (text: string) => {
            try {
              const data = JSON.parse(text)
              return {
                domain: cleanDomain,
                registrar: data.registrar?.name || data.registrar,
                registrationDate: data.created || data.creation_date,
                expirationDate: data.expires || data.expiration_date,
                updatedDate: data.updated || data.updated_date,
                nameServers: data.nameservers || data.name_servers || [],
                status: data.status ? (Array.isArray(data.status) ? data.status : [data.status]) : [],
                registrant: data.registrant
                  ? {
                      name: data.registrant.name,
                      organization: data.registrant.organization,
                      country: data.registrant.country,
                      email: data.registrant.email,
                    }
                  : undefined,
                raw: JSON.stringify(data, null, 2),
                source: "WhoisJS Direct Query",
              }
            } catch {
              return parseDirectWhoisResponse(text, cleanDomain, "WhoisJS Direct Query")
            }
          },
        },
        {
          name: "RDAP Protocol Simulation",
          url: `https://rdap.verisign.com/com/v1/domain/${encodeURIComponent(cleanDomain)}`,
          parser: (text: string) => {
            try {
              const data = JSON.parse(text)
              return {
                domain: cleanDomain,
                registrar: data.entities
                  ?.find((e: any) => e.roles?.includes("registrar"))
                  ?.vcardArray?.[1]?.find((v: any) => v[0] === "fn")?.[3],
                registrationDate: data.events?.find((e: any) => e.eventAction === "registration")?.eventDate,
                expirationDate: data.events?.find((e: any) => e.eventAction === "expiration")?.eventDate,
                updatedDate: data.events?.find((e: any) => e.eventAction === "last changed")?.eventDate,
                nameServers: data.nameservers?.map((ns: any) => ns.ldhName) || [],
                status: data.status || [],
                raw: JSON.stringify(data, null, 2),
                source: "RDAP Protocol Simulation",
              }
            } catch {
              return parseDirectWhoisResponse(text, cleanDomain, "RDAP Protocol Simulation")
            }
          },
        },
      ]

      let whoisResult = null
      let lastError = null

      for (const api of directWhoisAPIs) {
        try {
          const response = await fetch(api.url, {
            method: "GET",
            headers: {
              Accept: "application/json, text/plain, */*",
              "User-Agent": "DumbWhoIs-Browser/1.0",
            },
          })

          if (response.ok) {
            const text = await response.text()

            if (text && text.trim().length > 10) {
              whoisResult = api.parser(text)

              // Validate the result has meaningful data
              if (
                whoisResult &&
                (whoisResult.registrar ||
                  whoisResult.registrationDate ||
                  whoisResult.nameServers?.length ||
                  (whoisResult.raw && whoisResult.raw.length > 100))
              ) {
                break
              }
            }
          } else {
            lastError = new Error(`${api.name}: HTTP ${response.status}`)
          }
        } catch (fetchError) {
          lastError = fetchError
          console.warn(`Failed to fetch from ${api.name}:`, fetchError)
          continue
        }
      }

      if (!whoisResult) {
        setError(t("whois.error-direct-lookup-failed"))

        setWhoisData({
          domain: cleanDomain,
          raw: `${t("whois.direct-lookup-could-not-retrieve-data")} ${cleanDomain}.\n\n${t("whois.direct-whois-query-failed")}.\n\n${t("whois.possible-reasons")}:\n• ${t("whois.domain-privacy-protection-enabled")}\n• ${t("whois.network-cors-restrictions")}\n• ${t("whois.domain-not-registered-or-expired")}\n• ${t("whois.authoritative-servers-not-responding")}\n\n${t("whois.use-viewdns-info-for-comprehensive-analysis")}:\nhttps://viewdns.info/whois/?domain=${cleanDomain}\n\nViewDNS.info ${t("whois.provides")}:\n• ${t("whois.direct-whois-protocol-queries")}\n• ${t("whois.authoritative-server-responses")}\n• ${t("whois.complete-registration-details")}\n• ${t("whois.dns-records-and-propagation")}\n• ${t("whois.domain-history-and-changes")}`,
          source: "DumbWhoIs Browser Implementation",
        })
        return
      }

      setWhoisData(whoisResult)
    } catch (error) {
      console.error("DumbWhoIs-style lookup error:", error)
      setError(t("whois.error-direct-lookup-failed"))

      setWhoisData({
        domain: cleanDomain,
        raw: `${t("whois.direct-lookup-failed")}.\n\n${t("whois.use-viewdns-info-for-comprehensive-analysis")}:\nhttps://viewdns.info/whois/?domain=${cleanDomain}`,
        source: "DumbWhoIs Browser Implementation",
      })
    } finally {
      setLoading(false)
    }
  }

  const parseDirectWhoisResponse = (text: string, domain: string, source: string): WhoisData => {
    const result: WhoisData = {
      domain,
      raw: text,
      source,
    }

    try {
      // Enhanced parsing patterns inspired by DumbWhoIs direct protocol approach
      const patterns = {
        registrar: [
          /Registrar:\s*(.+)/i,
          /Registrar Name:\s*(.+)/i,
          /Sponsoring Registrar:\s*(.+)/i,
          /registrar:\s*(.+)/i,
          /Registrar WHOIS Server:\s*(.+)/i,
          /Registrar URL:\s*(.+)/i,
        ],
        created: [
          /Creation Date:\s*(.+)/i,
          /Created On:\s*(.+)/i,
          /Created:\s*(.+)/i,
          /Domain Registration Date:\s*(.+)/i,
          /created:\s*(.+)/i,
          /Registration Time:\s*(.+)/i,
          /Registered On:\s*(.+)/i,
        ],
        expires: [
          /Registry Expiry Date:\s*(.+)/i,
          /Registrar Registration Expiration Date:\s*(.+)/i,
          /Expires On:\s*(.+)/i,
          /Expires:\s*(.+)/i,
          /Expiration Date:\s*(.+)/i,
          /expire:\s*(.+)/i,
          /Expiry Date:\s*(.+)/i,
          /Registry Expiry:\s*(.+)/i,
        ],
        updated: [
          /Updated Date:\s*(.+)/i,
          /Last Updated On:\s*(.+)/i,
          /Modified:\s*(.+)/i,
          /Last Updated:\s*(.+)/i,
          /changed:\s*(.+)/i,
          /Update Date:\s*(.+)/i,
          /Last Modified:\s*(.+)/i,
        ],
        nameServers: [
          /Name Server:\s*(.+)/gi,
          /nserver:\s*(.+)/gi,
          /Nameserver:\s*(.+)/gi,
          /DNS:\s*(.+)/gi,
          /ns\d*:\s*(.+)/gi,
        ],
        status: [/Domain Status:\s*(.+)/gi, /status:\s*(.+)/gi, /Status:\s*(.+)/gi, /Registry Domain Status:\s*(.+)/gi],
      }

      // Parse each field using multiple patterns
      for (const [field, fieldPatterns] of Object.entries(patterns)) {
        for (const pattern of fieldPatterns) {
          if (field === "nameServers" || field === "status") {
            const matches = text.match(pattern)
            if (matches && matches.length > 0) {
              result[field as keyof WhoisData] = matches
                .map((match) => match.replace(pattern, "$1").trim())
                .filter((item) => item.length > 0 && !item.toLowerCase().includes("redacted"))
              break
            }
          } else {
            const match = text.match(pattern)
            if (match && match[1] && match[1].trim()) {
              const value = match[1].trim()
              if (!value.toLowerCase().includes("redacted") && !value.toLowerCase().includes("not disclosed")) {
                result[field as keyof WhoisData] = value
                break
              }
            }
          }
        }
      }

      // Parse contact information if available
      const registrantMatch = text.match(/Registrant Name:\s*(.+)/i)
      const registrantOrgMatch = text.match(/Registrant Organization:\s*(.+)/i)
      const registrantCountryMatch = text.match(/Registrant Country:\s*(.+)/i)

      if (registrantMatch || registrantOrgMatch || registrantCountryMatch) {
        result.registrant = {
          name: registrantMatch?.[1]?.trim(),
          organization: registrantOrgMatch?.[1]?.trim(),
          country: registrantCountryMatch?.[1]?.trim(),
        }
      }
    } catch (parseError) {
      console.warn("Error parsing direct WHOIS response:", parseError)
    }

    return result
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      performWhoisLookup()
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            {t("whois.card-title")}
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
              <Label htmlFor="domain">{t("whois.domain-name")}</Label>
              <Input
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., example.com"
                disabled={loading}
                className="bg-white/5 border-white/20"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={performWhoisLookup}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-500 to-teal-500"
              >
                <Database className="w-4 h-4 mr-2" />
                {loading ? t("whois.querying") : t("whois.direct-query")}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  const cleanDomain = domain
                    .trim()
                    .toLowerCase()
                    .replace(/^https?:\/\//, "")
                    .replace(/^www\./, "")
                  if (cleanDomain) {
                    window.open(`https://viewdns.info/whois/?domain=${encodeURIComponent(cleanDomain)}`, "_blank")
                  }
                }}
                disabled={!domain.trim()}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 hover:from-blue-600 hover:to-cyan-600"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {t("whois.viewdns")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {whoisData && (
        <div className="space-y-6">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                {t("whois.domain-information")}: {whoisData.domain}
                {whoisData.source && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {whoisData.source}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {whoisData.registrar && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t("whois.registrar")}</p>
                    <p className="font-medium">{whoisData.registrar}</p>
                  </div>
                )}

                {whoisData.registrationDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t("whois.registration-date")}</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(whoisData.registrationDate)}
                    </p>
                  </div>
                )}

                {whoisData.expirationDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t("whois.expiration-date")}</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(whoisData.expirationDate)}
                    </p>
                  </div>
                )}

                {whoisData.updatedDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t("whois.last-updated")}</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(whoisData.updatedDate)}
                    </p>
                  </div>
                )}
              </div>

              {whoisData.status && whoisData.status.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm text-muted-foreground mb-2">{t("whois.domain-status")}</p>
                  <div className="flex flex-wrap gap-2">
                    {whoisData.status.map((status, index) => (
                      <Badge key={index} variant="outline">
                        {status}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {whoisData.registrant && (
                <div className="mt-6">
                  <p className="text-sm text-muted-foreground mb-2">{t("whois.registrant-information")}</p>
                  <div className="bg-black/20 p-3 rounded-lg space-y-1">
                    {whoisData.registrant.name && (
                      <p>
                        <strong>{t("whois.name")}</strong>: {whoisData.registrant.name}
                      </p>
                    )}
                    {whoisData.registrant.organization && (
                      <p>
                        <strong>{t("whois.organization")}</strong>: {whoisData.registrant.organization}
                      </p>
                    )}
                    {whoisData.registrant.country && (
                      <p>
                        <strong>{t("whois.country")}</strong>: {whoisData.registrant.country}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {whoisData.nameServers && whoisData.nameServers.length > 0 && (
            <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  {t("whois.name-servers")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {whoisData.nameServers.map((ns, index) => (
                    <div key={index} className="p-3 bg-black/20 rounded-lg">
                      <p className="font-mono text-sm">{ns}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {t("whois.raw-response")}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(whoisData.raw || "")}
                  className="bg-white/10 backdrop-blur-md border-white/20"
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? t("whois.copied") : t("whois.copy")}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black/30 p-4 rounded-lg max-h-96 overflow-y-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap break-words">{whoisData.raw}</pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
