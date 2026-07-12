import React, { useState, useEffect, useRef } from 'react';
import { TRANSLATIONS } from '../data/mockData';
import { Search, MapPin, Truck, ShieldAlert, Navigation, Calendar, Package } from 'lucide-react';

interface MapTrackerProps {
  language: 'pt' | 'en' | 'es' | 'fr';
  initialTrackingCode?: string;
}

export const MapTracker: React.FC<MapTrackerProps> = ({ language, initialTrackingCode = '' }) => {
  const t = TRANSLATIONS[language];
  const [trackingCode, setTrackingCode] = useState(initialTrackingCode);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ warehouse?: any; destination?: any; truck?: any; path?: any }>({});

  const handleTrackSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!trackingCode) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch(`/api/tracking/${trackingCode}`);
      if (response.ok) {
        const data = await response.json();
        setTrackingData(data);
      } else {
        setTrackingData(null);
        setErrorMsg(t.no_tracking_found || 'Código inválido ou encomenda não encontrada.');
      }
    } catch (err) {
      setErrorMsg('Falha de ligação ao sistema de satélite.');
    } finally {
      setLoading(false);
    }
  };

  // Run initial track if code is provided
  useEffect(() => {
    if (initialTrackingCode) {
      setTrackingCode(initialTrackingCode);
      // We will trigger tracking after a tiny timeout to let the container render
      const timer = setTimeout(() => {
        handleTrackSubmit();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialTrackingCode]);

  // Poll tracking details every 4 seconds for real-time truck coordinate interpolation
  useEffect(() => {
    if (!trackingData || trackingData.status === 'delivered') return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/tracking/${trackingCode}`);
        if (response.ok) {
          const data = await response.json();
          setTrackingData(data);
        }
      } catch (err) {
        console.error('Failed to poll tracking:', err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [trackingData, trackingCode]);

  // DYNAMIC LEAFLET MAP MOUNTING
  useEffect(() => {
    if (!trackingData || !mapContainerRef.current) return;

    // Load Leaflet dynamically from CDN to bypass any React 19 / NPM version mismatch
    const mountLeaflet = async () => {
      // 1. Inject Leaflet CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // 2. Inject Leaflet Script
      if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        document.head.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      // Ensure global L is loaded
      const L = (window as any).L;
      if (!L) {
        // If not loaded yet, retry shortly
        setTimeout(mountLeaflet, 200);
        return;
      }

      const { originCoords, destinationCoords, currentCoords, status } = trackingData;

      // 3. Initialize Map Instance
      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: false
        }).setView([currentCoords.lat, currentCoords.lng], 5);

        // Add high-end CartoDB light tile layer for modern minimalist light aesthetic
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 20
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;

      // Clean old markers/polylines
      if (markersRef.current.warehouse) map.removeLayer(markersRef.current.warehouse);
      if (markersRef.current.destination) map.removeLayer(markersRef.current.destination);
      if (markersRef.current.truck) map.removeLayer(markersRef.current.truck);
      if (markersRef.current.path) map.removeLayer(markersRef.current.path);

      // 4. Create custom divIcons to prevent broken local image assets
      const warehouseIcon = L.divIcon({
        html: `<div class="w-8 h-8 rounded-full bg-blue-600 border border-white shadow-md flex items-center justify-center text-white font-bold text-xs">🏢</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const destinationIcon = L.divIcon({
        html: `<div class="w-8 h-8 rounded-full bg-rose-500 border border-white shadow-md flex items-center justify-center text-white font-bold text-xs">📍</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const truckIcon = L.divIcon({
        html: `<div class="w-9 h-9 rounded-full bg-amber-500 border border-white shadow-lg flex items-center justify-center text-white text-sm font-bold animate-pulse">🚚</div>`,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      // 5. Add Warehouse & Destination markers
      markersRef.current.warehouse = L.marker([originCoords.lat, originCoords.lng], { icon: warehouseIcon })
        .addTo(map)
        .bindPopup(`<strong class="text-slate-900">Origem: Armazém regional</strong>`);

      markersRef.current.destination = L.marker([destinationCoords.lat, destinationCoords.lng], { icon: destinationIcon })
        .addTo(map)
        .bindPopup(`<strong class="text-slate-900">Destino de Entrega</strong>`);

      // 6. Draw route path polyline with beautiful cobalt style
      markersRef.current.path = L.polyline(
        [[originCoords.lat, originCoords.lng], [destinationCoords.lat, destinationCoords.lng]],
        {
          color: '#2563eb',
          weight: 3,
          opacity: 0.7,
          dashArray: '5, 8'
        }
      ).addTo(map);

      // 7. Add real-time moving truck marker
      markersRef.current.truck = L.marker([currentCoords.lat, currentCoords.lng], { icon: truckIcon })
        .addTo(map)
        .bindPopup(`<strong class="text-slate-900">Encomenda em Trânsito Real</strong>`);

      // Pan map smoothly to follow the truck
      map.panTo([currentCoords.lat, currentCoords.lng]);
    };

    mountLeaflet();

    return () => {
      // Don't fully destroy leaflet, just clean markers to avoid map flickering
    };
  }, [trackingData]);

  return (
    <div className="space-y-6" id="tracking-dashboard">
      {/* Code Input Form Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm" id="tracking-input-card">
        <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-4" id="tracking-form">
          <div className="flex-1 relative" id="tracking-input-wrapper">
            <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-450" />
            <input
              type="text"
              id="tracking-code-input"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder={t.enter_tracking_code}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 focus:border-blue-600 rounded-xl text-sm font-mono text-slate-800 outline-none transition-all placeholder-slate-450 focus:ring-1 focus:ring-blue-600/30 font-medium"
            />
          </div>
          <button
            type="submit"
            id="tracking-submit-btn"
            disabled={loading || !trackingCode}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <Truck className="w-4 h-4" />
            {loading ? 'A pesquisar satélite...' : t.track}
          </button>
        </form>

        {errorMsg && (
          <div className="mt-4 text-xs text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-lg flex items-center gap-2 font-medium" id="tracking-error">
            <ShieldAlert className="w-4 h-4" />
            {errorMsg}
          </div>
        )}
      </div>

      {trackingData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="tracking-results-layout">
          {/* Map Display (Left/Mid columns) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col h-[480px] shadow-sm relative animate-fade-in" id="map-card">
            <div className="px-5 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between" id="map-header">
              <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-blue-600" />
                {t.transit_map}
              </span>
              <div className="flex items-center gap-2" id="map-badge-container">
                <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/50 animate-pulse font-bold">
                  ● Satélite GPS Ativo
                </span>
              </div>
            </div>

            {/* Div for Leaflet to mount */}
            <div 
              id="map" 
              ref={mapContainerRef} 
              className="flex-1 w-full h-full bg-slate-50 relative"
            >
              {/* Fallback spinner while loading leaflet script */}
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs font-semibold" id="map-loading-placeholder">
                {t.loading_map}
              </div>
            </div>
          </div>

          {/* Stepper Details (Right column) */}
          <div className="space-y-6" id="tracking-side-panel">
            {/* Live progress summary card */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm" id="progress-summary-card">
              <div className="flex justify-between items-start" id="progress-summary-header">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Estado do Envio</span>
                  <h4 className="text-sm font-extrabold text-blue-600 mt-1">
                    {t[trackingData.status] || trackingData.status}
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold bg-slate-50 border border-slate-150 px-2.5 py-1 rounded-lg text-slate-700">
                  {trackingData.progress}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden" id="progress-bar-wrapper">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                  style={{ width: `${trackingData.progress}%` }}
                />
              </div>

              {/* Telemetry info */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-2" id="telemetry-info">
                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-0.5" id="tel-eta">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Previsão</span>
                  <div className="font-semibold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Entrega em 3d
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-0.5" id="tel-latlng">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Coordenadas Actuais</span>
                  <div className="font-mono text-[10px] text-slate-500 leading-tight font-medium">
                    {trackingData.currentCoords.lat.toFixed(4)} N<br />
                    {trackingData.currentCoords.lng.toFixed(4)} W
                  </div>
                </div>
              </div>
            </div>

            {/* Stepper Steps */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm" id="stepper-card">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-blue-600" />
                Pontos de Controlo (Logs)
              </h4>

              <div className="space-y-5 relative pl-4 border-l-2 border-slate-100" id="stepper-list">
                {trackingData.checkpoints.map((cp: any, index: number) => {
                  const isLatest = index === 0;

                  return (
                    <div key={index} className="relative space-y-1 animate-fade-in" id={`checkpoint-${index}`}>
                      {/* Floating Stepper dot */}
                      <span 
                        className={`absolute -left-[23px] top-1 w-3 h-3 rounded-full border-2 ${
                          isLatest 
                            ? 'bg-blue-600 border-white ring-4 ring-blue-600/15' 
                            : 'bg-slate-200 border-white'
                        }`} 
                      />

                      <div className="flex items-center justify-between" id={`checkpoint-header-${index}`}>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isLatest ? 'text-blue-600' : 'text-slate-400'}`}>
                          {t[cp.status] || cp.status}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 font-medium">
                          {new Date(cp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className={`text-xs ${isLatest ? 'text-slate-800 font-bold' : 'text-slate-500'} leading-relaxed font-medium`}>
                        {cp.description[language] || cp.description.en}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Tutorial prompt if tracking code empty
        <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center space-y-4 shadow-sm animate-fade-in" id="tracking-guide-view">
          <Truck className="w-10 h-10 text-slate-400 mx-auto" />
          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-800 text-sm">Monitorização Satélite de Encomendas</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">
              Insira o código gerado após o checkout para visualizar o veículo de transporte movendo-se ao longo da rota em tempo real no nosso mapa integrado.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
