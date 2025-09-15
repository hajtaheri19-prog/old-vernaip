"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Language = "en" | "fa"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  isRTL: boolean
}

const translations = {
  en: {
    // Header
    "app.title": "Advanced IP Detection",
    "app.subtitle": "Professional network analysis and security tools",

    // Navigation
    "nav.ip-detection": "IP Detection",
    "nav.analytics": "Network Analytics",
    "nav.advanced-tools": "Advanced Tools",
    "nav.speed-test": "Speed Test",
    "nav.port-scanner": "Port Scanner",
    "nav.whois": "Whois Search",
    "nav.faq": "FAQ",

    // IP Detection
    "ip.title": "Your IP Information & Location",
    "ip.address": "IP Address",
    "ip.location": "Location",
    "ip.coordinates": "Coordinates",
    "ip.isp": "Internet Service Provider",
    "ip.organization": "Organization",
    "ip.timezone": "Timezone",
    "ip.postal": "Postal Code",
    "ip.as": "Autonomous System",
    "ip.detecting": "Detecting your IP...",
    "ip.refresh": "Refresh IP Info",
    "ip.detect": "Detect My IP",
    "ip.error": "Error detecting IP",
    "ip.map-title": "Your Location on Map",
    "ip.detailed-info": "Detailed Information",

    // Network Status
    "network.title": "Network Status & Security",
    "network.connection": "Connection Type",
    "network.security": "Security Status",
    "network.ipv6": "IPv6 Support",
    "network.dns": "DNS Servers",
    "network.response-time": "Response Time",
    "network.detecting": "Detecting...",
    "network.broadband": "Broadband",
    "network.mobile": "Mobile",
    "network.direct": "Direct Connection",
    "network.proxy": "Proxy Detected",
    "network.supported": "Supported",
    "network.not-supported": "Not Supported",

    // Analytics
    "analytics.title": "Network Analytics & Monitoring",
    "analytics.subtitle": "Real-time network performance monitoring",
    "analytics.cpu": "CPU Usage",
    "analytics.memory": "Memory Usage",
    "analytics.network": "Network Load",
    "analytics.latency": "Network Latency",
    "analytics.throughput": "Throughput",
    "analytics.packets": "Packet Loss",
    "analytics.start": "Start Monitoring",
    "analytics.stop": "Stop Monitoring",
    "analytics.export": "Export Data",

    // Advanced Tools
    "tools.title": "Advanced Network Tools",
    "tools.subtitle": "Professional network diagnostic utilities",
    "tools.dns-title": "Advanced DNS Lookup",
    "tools.traceroute-title": "Network Traceroute",
    "tools.history-title": "Analysis History",
    "tools.dns-lookup": "DNS Lookup",
    "tools.traceroute": "Traceroute",
    "tools.ping": "Ping Test",
    "tools.ssl-check": "SSL Certificate Check",
    "tools.domain": "Domain/IP",
    "tools.start": "Start Test",
    "tools.results": "Results",

    // Speed Test
    "speed.title": "Internet Speed Test",
    "speed.subtitle": "Test your internet connection speed",
    "speed.card-title": "Internet Speed Test",
    "speed.start": "Start Speed Test",
    "speed.testing": "Testing...",
    "speed.download": "Download Speed",
    "speed.upload": "Upload Speed",
    "speed.ping": "Ping",
    "speed.jitter": "Jitter",
    "speed.server": "Test Server",
    "speed.progress": "Progress",
    "speed.mbps": "Mbps",
    "speed.ms": "ms",

    // Port Scanner
    "port.title": "Port Scanner",
    "port.subtitle": "Scan network ports for security analysis",
    "port.target": "Target IP/Domain",
    "port.port-range": "Port Range",
    "port.common-ports": "Common Ports",
    "port.custom-range": "Custom Range",
    "port.scan": "Start Scan",
    "port.scanning": "Scanning...",
    "port.open": "Open",
    "port.closed": "Closed",
    "port.filtered": "Filtered",
    "port.results": "Scan Results",

    // Whois
    "whois.title": "Whois Domain Lookup",
    "whois.subtitle": "Get detailed domain registration information",
    "whois.card-title": "DumbWhoIs - Direct Protocol Lookup",
    "whois.direct-query": "Direct WHOIS Query",
    "whois.viewdns": "ViewDNS.info",
    "whois.domain": "Domain Name",
    "whois.lookup": "Lookup Domain",
    "whois.registrar": "Registrar",
    "whois.created": "Created Date",
    "whois.expires": "Expires Date",
    "whois.updated": "Updated Date",
    "whois.nameservers": "Name Servers",
    "whois.status": "Domain Status",
    "whois.raw-data": "Raw Whois Data",
    "whois.raw-response": "Raw WHOIS Protocol Response",

    // FAQ Section
    "faq.title": "Frequently Asked Questions",
    "faq.subtitle": "Common questions about our IP detection and network analysis tools",
    "faq.q1": "What is IP detection and why is it important?",
    "faq.a1":
      "IP detection identifies your public IP address and provides detailed information about your internet connection, including location, ISP, and security status. This helps you understand your online presence and potential security risks.",
    "faq.q2": "How accurate is the location information?",
    "faq.a2":
      "Location accuracy varies based on your ISP and connection type. Typically accurate to city level for broadband connections, but may be less precise for mobile or VPN connections.",
    "faq.q3": "Is my data safe when using these tools?",
    "faq.a3":
      "Yes, all analysis is performed client-side in your browser. We don't store or transmit your personal data to external servers.",
    "faq.q4": "Why might the speed test results differ from other services?",
    "faq.a4":
      "Speed test results can vary based on server location, network congestion, and testing methodology. Our tests use multiple measurement techniques for accuracy.",
    "faq.q5": "What does the port scanner actually do?",
    "faq.a5":
      "The port scanner checks which network ports are open on a target system. This is useful for security analysis and network troubleshooting.",
    "faq.q6": "How often should I check my IP information?",
    "faq.a6":
      "Your IP address may change periodically depending on your ISP. Check whenever you notice connectivity issues or want to verify your current network status.",

    // Footer
    "footer.title": "Advanced IP Detection Tools",
    "footer.description":
      "Professional network analysis and security tools for comprehensive IP detection and network monitoring.",
    "footer.features": "Features",
    "footer.tools": "Tools",
    "footer.support": "Support",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Service",
    "footer.contact": "Contact Us",
    "footer.about": "About",
    "footer.copyright": "© 2024 Advanced IP Detection. All rights reserved.",
    "footer.developer": "Developed by Nivadsec",
  },
  fa: {
    // Header
    "app.title": "Nigar IP | نیگار آی پی",
    "app.subtitle": "ابزارهای حرفه‌ای تحلیل شبکه و امنیت",

    // Navigation
    "nav.ip-detection": "تشخیص IP",
    "nav.analytics": "تحلیل شبکه",
    "nav.advanced-tools": "ابزارهای پیشرفته",
    "nav.speed-test": "تست سرعت",
    "nav.port-scanner": "اسکن پورت",
    "nav.whois": "جستجوی Whois",
    "nav.faq": "سوالات متداول",

    // IP Detection
    "ip.title": "اطلاعات IP و موقعیت شما",
    "ip.address": "آدرس IP",
    "ip.location": "موقعیت",
    "ip.coordinates": "مختصات جغرافیایی",
    "ip.isp": "ارائه‌دهنده خدمات اینترنت",
    "ip.organization": "سازمان",
    "ip.timezone": "منطقه زمانی",
    "ip.postal": "کد پستی",
    "ip.as": "سیستم خودمختار",
    "ip.detecting": "در حال تشخیص IP شما...",
    "ip.refresh": "بروزرسانی اطلاعات IP",
    "ip.detect": "تشخیص IP من",
    "ip.error": "خطا در تشخیص IP",
    "ip.map-title": "موقعیت شما روی نقشه",
    "ip.detailed-info": "اطلاعات تفصیلی",

    // Network Status
    "network.title": "وضعیت شبکه و امنیت",
    "network.connection": "نوع اتصال",
    "network.security": "وضعیت امنیت",
    "network.ipv6": "پشتیبانی IPv6",
    "network.dns": "سرورهای DNS",
    "network.response-time": "زمان پاسخ",
    "network.detecting": "در حال تشخیص...",
    "network.broadband": "پهن باند",
    "network.mobile": "موبایل",
    "network.direct": "اتصال مستقیم",
    "network.proxy": "پروکسی تشخیص داده شد",
    "network.supported": "پشتیبانی می‌شود",
    "network.not-supported": "پشتیبانی نمی‌شود",

    // Analytics
    "analytics.title": "تحلیل و نظارت بر شبکه",
    "analytics.subtitle": "نظارت بر عملکرد شبکه در زمان واقعی",
    "analytics.cpu": "استفاده از پردازنده",
    "analytics.memory": "استفاده از حافظه",
    "analytics.network": "بار شبکه",
    "analytics.latency": "تأخیر شبکه",
    "analytics.throughput": "نرخ انتقال",
    "analytics.packets": "از دست رفتن بسته",
    "analytics.start": "شروع نظارت",
    "analytics.stop": "توقف نظارت",
    "analytics.export": "صادرات داده‌ها",

    // Advanced Tools
    "tools.title": "ابزارهای پیشرفته شبکه",
    "tools.subtitle": "ابزارهای حرفه‌ای تشخیص شبکه",
    "tools.dns-title": "جستجوی پیشرفته DNS",
    "tools.traceroute-title": "مسیریابی شبکه",
    "tools.history-title": "تاریخچه تحلیل",
    "tools.dns-lookup": "جستجوی DNS",
    "tools.traceroute": "مسیریابی",
    "tools.ping": "تست پینگ",
    "tools.ssl-check": "بررسی گواهی SSL",
    "tools.domain": "دامنه/IP",
    "tools.start": "شروع تست",
    "tools.results": "نتایج",

    // Speed Test
    "speed.title": "تست سرعت اینترنت",
    "speed.subtitle": "سرعت اتصال اینترنت خود را تست کنید",
    "speed.card-title": "تست سرعت اینترنت",
    "speed.start": "شروع تست سرعت",
    "speed.testing": "در حال تست...",
    "speed.download": "سرعت دانلود",
    "speed.upload": "سرعت آپلود",
    "speed.ping": "پینگ",
    "speed.jitter": "لرزش",
    "speed.server": "سرور تست",
    "speed.progress": "پیشرفت",
    "speed.mbps": "مگابیت بر ثانیه",
    "speed.ms": "میلی‌ثانیه",

    // Port Scanner
    "port.title": "اسکنر پورت",
    "port.subtitle": "اسکن پورت‌های شبکه برای تحلیل امنیت",
    "port.target": "IP/دامنه هدف",
    "port.port-range": "محدوده پورت",
    "port.common-ports": "پورت‌های رایج",
    "port.custom-range": "محدوده سفارشی",
    "port.scan": "شروع اسکن",
    "port.scanning": "در حال اسکن...",
    "port.open": "باز",
    "port.closed": "بسته",
    "port.filtered": "فیلتر شده",
    "port.results": "نتایج اسکن",

    // Whois
    "whois.title": "جستجوی دامنه Whois",
    "whois.subtitle": "اطلاعات تفصیلی ثبت دامنه را دریافت کنید",
    "whois.card-title": "DumbWhoIs - جستجوی مستقیم پروتکل",
    "whois.direct-query": "پرس‌وجوی مستقیم WHOIS",
    "whois.viewdns": "ViewDNS.info",
    "whois.domain": "نام دامنه",
    "whois.lookup": "جستجوی دامنه",
    "whois.registrar": "ثبت‌کننده",
    "whois.created": "تاریخ ایجاد",
    "whois.expires": "تاریخ انقضا",
    "whois.updated": "تاریخ بروزرسانی",
    "whois.nameservers": "سرورهای نام",
    "whois.status": "وضعیت دامنه",
    "whois.raw-data": "داده‌های خام Whois",
    "whois.raw-response": "پاسخ خام پروتکل WHOIS",

    // FAQ Section
    "faq.title": "سوالات متداول",
    "faq.subtitle": "سوالات رایج درباره ابزارهای تشخیص IP و تحلیل شبکه ما",
    "faq.q1": "تشخیص IP چیست و چرا مهم است؟",
    "faq.a1":
      "تشخیص IP آدرس عمومی شما را شناسایی کرده و اطلاعات تفصیلی درباره اتصال اینترنت شما از جمله موقعیت، ISP و وضعیت امنیت ارائه می‌دهد. این به شما کمک می‌کند حضور آنلاین و خطرات امنیتی احتمالی خود را درک کنید.",
    "faq.q2": "دقت اطلاعات موقعیت چقدر است؟",
    "faq.a2":
      "دقت موقعیت بر اساس ISP و نوع اتصال شما متفاوت است. معمولاً برای اتصالات پهن باند تا سطح شهر دقیق است، اما ممکن است برای اتصالات موبایل یا VPN کمتر دقیق باشد.",
    "faq.q3": "آیا داده‌های من هنگام استفاده از این ابزارها امن است؟",
    "faq.a3":
      "بله، تمام تحلیل‌ها در سمت کلاینت در مرورگر شما انجام می‌شود. ما داده‌های شخصی شما را ذخیره یا به سرورهای خارجی ارسال نمی‌کنیم.",
    "faq.q4": "چرا نتایج تست سرعت ممکن است با سایر سرویس‌ها متفاوت باشد؟",
    "faq.a4":
      "نتایج تست سرعت می‌تواند بر اساس موقعیت سرور، ازدحام شبکه و روش‌شناسی تست متفاوت باشد. تست‌های ما از چندین تکنیک اندازه‌گیری برای دقت استفاده می‌کنند.",
    "faq.q5": "اسکنر پورت واقعاً چه کاری انجام می‌دهد؟",
    "faq.a5":
      "اسکنر پورت بررسی می‌کند که کدام پورت‌های شبکه روی سیستم هدف باز هستند. این برای تحلیل امنیت و عیب‌یابی شبکه مفید است.",
    "faq.q6": "چه مدت یکبار باید اطلاعات IP خود را بررسی کنم؟",
    "faq.a6":
      "آدرس IP شما ممکن است بسته به ISP شما به طور دوره‌ای تغییر کند. هر زمان که مشکلات اتصال متوجه شدید یا می‌خواهید وضعیت فعلی شبکه خود را تأیید کنید، بررسی کنید.",

    // Footer
    "footer.title": "ابزارهای تشخیص پیشرفته IP",
    "footer.description": "ابزارهای حرفه‌ای تحلیل شبکه و امنیت برای تشخیص جامع IP و نظارت بر شبکه.",
    "footer.features": "ویژگی‌ها",
    "footer.tools": "ابزارها",
    "footer.support": "پشتیبانی",
    "footer.privacy": "سیاست حفظ حریم خصوصی",
    "footer.terms": "شرایط خدمات",
    "footer.contact": "تماس با ما",
    "footer.about": "درباره ما",
    "footer.copyright": "© ۱۴۰۳ نیگار آی پی. تمام حقوق محفوظ است.",
    "footer.developer": "توسعه دهنده حسین طاهری",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("fa")
  const [, forceUpdate] = useState({})

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "fa")) {
      setLanguage(savedLanguage)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("language", language)
    document.documentElement.dir = language === "fa" ? "rtl" : "ltr"
    document.documentElement.lang = language
    forceUpdate({})
    window.dispatchEvent(new CustomEvent("languageChanged", { detail: { language } }))
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("forceLanguageUpdate"))
    }, 50)
  }, [language])

  const t = (key: string): string => {
    return translations[language][key as keyof (typeof translations)[typeof language]] || key
  }

  const isRTL = language === "fa"

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    setTimeout(() => {
      forceUpdate({})
      window.dispatchEvent(new CustomEvent("forceLanguageUpdate"))
      window.dispatchEvent(new CustomEvent("languageChanged", { detail: { language: lang } }))
    }, 0)
    setTimeout(() => {
      forceUpdate({})
    }, 100)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
