"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  MapPin,
  Navigation,
  Maximize,
  Minimize,
  Cloud,
  MapIcon,
  Satellite,
  Mountain,
  Moon,
  Target,
  Locate,
} from "lucide-react"

interface MapProps {
  latitude: number
  longitude: number
  city: string
  country: string
  accuracy?: number
}

interface NearbyPlace {
  name: string
  type: string
  distance: number
  lat: number
  lon: number
}

export default function InteractiveMap({ latitude, longitude, city, country, accuracy = 1000 }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentLayer, setCurrentLayer] = useState("street")
  const [weatherData, setWeatherData] = useState<any>(null)
  const [measureMode, setMeasureMode] = useState(false)
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([])
  const [showControls, setShowControls] = useState(true)
  const [isTracking, setIsTracking] = useState(false)
  const [elevation, setElevation] = useState<number | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [locationAccuracy, setLocationAccuracy] = useState<number>(accuracy)
  const [mapInitialized, setMapInitialized] = useState(false)

  const safeLat = typeof latitude === "number" && !isNaN(latitude) && latitude !== 0 ? latitude : null
  const safeLon = typeof longitude === "number" && !isNaN(longitude) && longitude !== 0 ? longitude : null
  const safeCity = city || "Unknown Location"
  const safeCountry = country || "Unknown Country"

  const displayLat = userLocation?.lat || safeLat
  const displayLon = userLocation?.lon || safeLon
  const isUsingGPS = !!userLocation

  useEffect(() => {
    const detectPreciseLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude: userLat, longitude: userLon, accuracy: gpsAccuracy } = position.coords
            setUserLocation({ lat: userLat, lon: userLon })
            setLocationAccuracy(Math.round(gpsAccuracy))
          },
          (error) => {
            console.log("GPS location not available, using IP location")
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000,
          },
        )
      }
    }

    setTimeout(detectPreciseLocation, 1000)
  }, [])

  useEffect(() => {
    const fetchWeatherData = async () => {
      if (!displayLat || !displayLon) return

      try {
        const mockWeather = {
          weather: [
            {
              description: ["Clear sky", "Partly cloudy", "Overcast", "Light rain"][Math.floor(Math.random() * 4)],
              main: "Clear",
              icon: "01d",
            },
          ],
          main: {
            temp: Math.round(Math.random() * 25 + 10),
            feels_like: Math.round(Math.random() * 25 + 10),
            humidity: Math.round(Math.random() * 40 + 40),
            pressure: Math.round(Math.random() * 50 + 1000),
          },
          wind: { speed: Math.round(Math.random() * 10 + 2) },
          visibility: Math.round(Math.random() * 5000 + 5000),
        }
        setWeatherData(mockWeather)
      } catch (error) {
        console.log("Weather data not available")
      }
    }

    const fetchElevation = async () => {
      if (!displayLat || !displayLon) return

      try {
        const baseElevation = Math.abs(displayLat) * 10 + Math.abs(displayLon) * 5
        setElevation(Math.round(baseElevation + Math.random() * 500))
      } catch (error) {
        console.log("Elevation data not available")
      }
    }

    if (displayLat && displayLon) {
      fetchWeatherData()
      fetchElevation()
    }
  }, [displayLat, displayLon])

  useEffect(() => {
    if (!mapRef.current || mapInitialized || !displayLat || !displayLon) return

    import("leaflet").then((L) => {
      if (mapInstanceRef.current?.map) {
        mapInstanceRef.current.map.remove()
        mapInstanceRef.current = null
      }

      // Fix for default markers in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      })

      const map = L.map(mapRef.current!, {
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true,
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true,
      }).setView([displayLat, displayLon], isUsingGPS ? 16 : 13)

      // Enhanced tile layers with more options
      const tileLayers = {
        street: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
        }),
        satellite: L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            attribution: "© Esri",
            maxZoom: 19,
          },
        ),
        terrain: L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenTopoMap contributors",
          maxZoom: 17,
        }),
        dark: L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          attribution: "© CartoDB",
          maxZoom: 19,
        }),
      }

      // Add default layer
      tileLayers.street.addTo(map)

      const customIcon = L.divIcon({
        html: `
          <div class="custom-marker-container">
            <div class="marker-pulse ${isUsingGPS ? "gps-pulse" : "ip-pulse"}"></div>
            <div class="marker-main ${isUsingGPS ? "gps-marker" : "ip-marker"}">
              <div class="marker-inner">
                ${
                  isUsingGPS
                    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>'
                    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>'
                }
              </div>
            </div>
          </div>
        `,
        className: "custom-marker",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      })

      const marker = L.marker([displayLat, displayLon], { icon: customIcon }).addTo(map)

      const accuracyCircle = L.circle([displayLat, displayLon], {
        color: isUsingGPS ? "#22c55e" : "#8b5cf6",
        fillColor: isUsingGPS ? "#22c55e" : "#8b5cf6",
        fillOpacity: 0.1,
        weight: 2,
        radius: locationAccuracy,
        dashArray: isUsingGPS ? "5, 5" : "10, 5",
      }).addTo(map)

      L.control.zoom({ position: "bottomright" }).addTo(map)
      L.control
        .scale({
          position: "bottomleft",
          metric: true,
          imperial: false,
          maxWidth: 150,
        })
        .addTo(map)

      // Store references for layer switching and other operations
      mapInstanceRef.current = {
        map,
        tileLayers,
        marker,
        accuracyCircle,
        measureControl: null,
        drawnItems: new L.FeatureGroup().addTo(map),
      }

      setMapInitialized(true)
    })

    return () => {
      if (mapInstanceRef.current?.map) {
        mapInstanceRef.current.map.remove()
        mapInstanceRef.current = null
      }
      setMapInitialized(false)
    }
  }, [displayLat, displayLon]) // Only depend on coordinates for initialization

  useEffect(() => {
    if (!mapInstanceRef.current || !displayLat || !displayLon) return

    const { map, marker, accuracyCircle } = mapInstanceRef.current

    // Update map view and marker position
    map.setView([displayLat, displayLon], isUsingGPS ? 16 : 13)
    marker.setLatLng([displayLat, displayLon])

    // Update accuracy circle
    if (accuracyCircle) {
      accuracyCircle.setLatLng([displayLat, displayLon])
      accuracyCircle.setRadius(locationAccuracy)
      accuracyCircle.setStyle({
        color: isUsingGPS ? "#22c55e" : "#8b5cf6",
        fillColor: isUsingGPS ? "#22c55e" : "#8b5cf6",
      })
    }

    // Update popup content
    const popupContent = `
      <div style="font-family: system-ui; padding: 16px; min-width: 320px; max-width: 400px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #e5e7eb;">
          <div style="width: 48px; height: 48px; background: linear-gradient(135deg, ${isUsingGPS ? "#22c55e, #16a34a" : "#8b5cf6, #06b6d4"}); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px;">
            ${isUsingGPS ? "🎯" : "📍"}
          </div>
          <div>
            <h3 style="margin: 0; color: #1f2937; font-size: 20px; font-weight: 700;">Your Location</h3>
            <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">
              ${isUsingGPS ? "Detected via GPS" : "Detected via IP geolocation"}
            </p>
          </div>
        </div>
        
        <div style="display: grid; gap: 12px;">
          <div style="background: ${isUsingGPS ? "#dcfce7" : "#f3e8ff"}; padding: 12px; border-radius: 8px; border: 1px solid ${isUsingGPS ? "#bbf7d0" : "#e9d5ff"};">
            <div style="color: ${isUsingGPS ? "#15803d" : "#7c3aed"}; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">
              ${isUsingGPS ? "🎯 GPS Location" : "🌐 IP Location"}
            </div>
            <div style="color: #1f2937; font-size: 14px; font-weight: 600;">
              Accuracy: ±${Math.round(locationAccuracy / 1000)}km ${isUsingGPS ? "(High Precision)" : "(Approximate)"}
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
              <div style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Latitude</div>
              <div style="color: #1f2937; font-family: monospace; font-size: 14px;">${displayLat.toFixed(6)}</div>
            </div>
            <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
              <div style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Longitude</div>
              <div style="color: #1f2937; font-family: monospace; font-size: 14px;">${displayLon.toFixed(6)}</div>
            </div>
          </div>
          
          <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
            <div style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Location</div>
            <div style="color: #1f2937; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
              🌍 ${safeCity}, ${safeCountry}
            </div>
          </div>
        </div>
      </div>
    `

    marker.bindPopup(popupContent, {
      maxWidth: 400,
      className: "enhanced-popup",
    })
  }, [displayLat, displayLon, isUsingGPS, locationAccuracy, safeCity, safeCountry])

  const switchLayer = (layerName: string) => {
    if (!mapInstanceRef.current) return

    const { map, tileLayers } = mapInstanceRef.current

    map.eachLayer((layer: any) => {
      if (layer._url) {
        map.removeLayer(layer)
      }
    })

    tileLayers[layerName].addTo(map)
    setCurrentLayer(layerName)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    setTimeout(() => {
      if (mapInstanceRef.current?.map) {
        mapInstanceRef.current.map.invalidateSize()
      }
    }, 300)
  }

  const toggleMeasureMode = () => {
    if (!mapInstanceRef.current) return

    const { map } = mapInstanceRef.current
    setMeasureMode(!measureMode)

    if (!measureMode) {
      // Enable measurement mode
      map.getContainer().style.cursor = "crosshair"
    } else {
      // Disable measurement mode
      map.getContainer().style.cursor = ""
    }
  }

  const toggleTracking = () => {
    if (!isTracking && navigator.geolocation) {
      setIsTracking(true)
      navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords
          setUserLocation({ lat: latitude, lon: longitude })
          setLocationAccuracy(Math.round(accuracy))

          if (mapInstanceRef.current) {
            const { map, marker, accuracyCircle } = mapInstanceRef.current
            map.setView([latitude, longitude], 16)
            marker.setLatLng([latitude, longitude])
            accuracyCircle.setLatLng([latitude, longitude])
            accuracyCircle.setRadius(accuracy)
          }
        },
        (error) => {
          console.error("Geolocation error:", error)
          setIsTracking(false)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      )
    } else {
      setIsTracking(false)
    }
  }

  const shareLocation = async () => {
    const shareData = {
      title: "My Location",
      text: `I'm at ${safeCity}, ${safeCountry}`,
      url: `https://www.google.com/maps/@${displayLat},${displayLon},15z`,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareData.url)
      }
    } else {
      navigator.clipboard.writeText(shareData.url)
    }
  }

  const exportMap = () => {
    if (mapInstanceRef.current?.map) {
      // This would require additional libraries like leaflet-image
      console.log("Export functionality would be implemented here")
    }
  }

  const refreshLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords
          setUserLocation({ lat: latitude, lon: longitude })
          setLocationAccuracy(Math.round(accuracy))

          if (mapInstanceRef.current) {
            const { map, marker, accuracyCircle } = mapInstanceRef.current
            map.setView([latitude, longitude], 16)
            marker.setLatLng([latitude, longitude])
            accuracyCircle.setLatLng([latitude, longitude])
            accuracyCircle.setRadius(accuracy)

            // Reopen popup with updated info
            marker.openPopup()
          }
        },
        (error) => {
          console.error("Location refresh failed:", error)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      )
    }
  }

  if (!displayLat || !displayLon) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Waiting for location data...</p>
          <Button onClick={refreshLocation} className="mt-4 bg-gradient-to-r from-green-500 to-emerald-500" size="sm">
            <Target className="w-4 h-4 mr-2" />
            Try GPS Location
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-purple-400" />
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent text-sm">
                Location Intelligence
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Badge
                variant="outline"
                className={`text-xs flex items-center gap-1 ${isUsingGPS ? "bg-green-500/20 border-green-400/30" : "bg-purple-500/20 border-purple-400/30"}`}
              >
                {isUsingGPS ? <Target className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                {isUsingGPS ? "GPS" : "IP"}
              </Badge>
              {weatherData && (
                <Badge variant="outline" className="text-xs flex items-center gap-1 bg-blue-500/20 border-blue-400/30">
                  <Cloud className="w-3 h-3" />
                  {weatherData.main?.temp || "N/A"}°C
                </Badge>
              )}
              <Badge variant="outline" className="text-xs bg-orange-500/20 border-orange-400/30">
                ±{Math.round(locationAccuracy / 1000)}km
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="bg-white/5 rounded-lg p-2">
              <p className="text-xs text-muted-foreground mb-1">Coordinates</p>
              <p className="font-mono text-xs font-semibold">
                {displayLat.toFixed(4)}, {displayLon.toFixed(4)}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <p className="text-xs text-muted-foreground mb-1">Location</p>
              <p className="text-xs font-semibold flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {safeCity}
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <p className="text-xs text-muted-foreground mb-1">Accuracy</p>
              <p className="text-xs font-semibold">±{Math.round(locationAccuracy / 1000)}km</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <div className="flex items-center gap-1">
                <div
                  className={`w-2 h-2 rounded-full animate-pulse ${isUsingGPS ? "bg-green-400" : "bg-purple-400"}`}
                ></div>
                <span className={`text-xs font-semibold ${isUsingGPS ? "text-green-400" : "text-purple-400"}`}>
                  {isUsingGPS ? "GPS" : "IP"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        className={`bg-white/10 backdrop-blur-md border-white/20 shadow-xl transition-all duration-500 ${
          isFullscreen ? "fixed inset-4 z-50" : ""
        }`}
      >
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-cyan-400" />
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent text-sm">
                Interactive Map
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
                <Button
                  size="sm"
                  variant={currentLayer === "street" ? "default" : "ghost"}
                  onClick={() => switchLayer("street")}
                  className="h-6 px-2 text-xs"
                >
                  <MapIcon className="w-3 h-3 mr-1" />
                  Street
                </Button>
                <Button
                  size="sm"
                  variant={currentLayer === "satellite" ? "default" : "ghost"}
                  onClick={() => switchLayer("satellite")}
                  className="h-6 px-2 text-xs"
                >
                  <Satellite className="w-3 h-3 mr-1" />
                  Satellite
                </Button>
                <Button
                  size="sm"
                  variant={currentLayer === "terrain" ? "default" : "ghost"}
                  onClick={() => switchLayer("terrain")}
                  className="h-6 px-2 text-xs"
                >
                  <Mountain className="w-3 h-3 mr-1" />
                  Terrain
                </Button>
                <Button
                  size="sm"
                  variant={currentLayer === "dark" ? "default" : "ghost"}
                  onClick={() => switchLayer("dark")}
                  className="h-6 px-2 text-xs"
                >
                  <Moon className="w-3 h-3 mr-1" />
                  Dark
                </Button>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={refreshLocation}
                  className="h-6 w-6 p-0 bg-transparent"
                  title="Refresh location"
                >
                  <Locate className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleFullscreen}
                  className="h-6 w-6 p-0 bg-transparent"
                  title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? <Minimize className="w-3 h-3" /> : <Maximize className="w-3 h-3" />}
                </Button>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div
            ref={mapRef}
            className={`w-full rounded-b-lg transition-all duration-500 relative ${
              isFullscreen ? "h-[calc(100vh-200px)]" : "h-64 md:h-80"
            }`}
            style={{ minHeight: isFullscreen ? "calc(100vh - 200px)" : "256px" }}
          />

          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            {isUsingGPS && (
              <Badge className="bg-green-500/90 text-white">
                <Target className="w-3 h-3 mr-1" />
                GPS Active
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <style jsx global>{`
        .enhanced-popup .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .enhanced-popup .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
        }
        
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        
        .leaflet-control-zoom {
          background: rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(10px) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          border-radius: 8px !important;
        }
        
        .leaflet-control-zoom a {
          background: transparent !important;
          color: white !important;
          border: none !important;
        }
        
        .leaflet-control-scale {
          background: rgba(0, 0, 0, 0.5) !important;
          backdrop-filter: blur(10px) !important;
          border-radius: 6px !important;
          padding: 4px 8px !important;
          color: white !important;
        }
        
        .custom-marker-container {
          position: relative;
          width: 40px;
          height: 40px;
        }
        .marker-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          animation: pulse-ring 2s infinite;
        }
        .gps-pulse {
          background: rgba(34, 197, 94, 0.3);
        }
        .ip-pulse {
          background: rgba(139, 92, 246, 0.3);
        }
        .marker-main {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 40px;
          height: 40px;
          border: 3px solid white;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: bounce 2s infinite;
        }
        .gps-marker {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
        }
        .ip-marker {
          background: linear-gradient(135deg, #8b5cf6, #06b6d4);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        }
        .marker-inner {
          color: white;
          font-size: 16px;
        }
        @keyframes pulse-ring {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translate(-50%, -50%) translateY(0); }
          40% { transform: translate(-50%, -50%) translateY(-10px); }
          60% { transform: translate(-50%, -50%) translateY(-5px); }
        }
      `}</style>
    </div>
  )
}
