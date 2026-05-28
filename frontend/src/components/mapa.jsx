import { useEffect, useRef, useState } from 'react';

const TIPOS = [
  { label: '💊 Farmacias', query: 'farmacia', color: '#4CAF50' },
  { label: '🏥 Guardias', query: 'guardia medica hospital', color: '#f44336' },
  { label: '🔬 Laboratorios', query: 'laboratorio analisis clinicos', color: '#2196F3' },
];

export default function Mapa() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const [tipo, setTipo] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ubicacion, setUbicacion] = useState(null);

  useEffect(() => {
  if (window.google && window.google.maps) {
    initMap();
    return;
  }
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
  script.async = true;
  script.onload = () => initMap();
  document.head.appendChild(script);
}, []);

  function initMap(lat = -34.6037, lng = -58.3816) {
    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: 14,
      styles: darkMapStyle,
    });
  }

  function limpiarMarkers() {
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
  }

  function buscar() {
    if (!window.google) return;
    setLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUbicacion(loc);
        mapInstance.current.setCenter(loc);

        // Marker del usuario
        new window.google.maps.Marker({
          position: loc,
          map: mapInstance.current,
          title: 'Tu ubicación',
          icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#fff', fillOpacity: 1, strokeColor: '#4CAF50', strokeWeight: 3 },
        });

        const service = new window.google.maps.places.PlacesService(mapInstance.current);
        service.nearbySearch(
          { location: loc, radius: 2000, keyword: TIPOS[tipo].query, type: ['establishment'] },
          (results, status) => {
            setLoading(false);
            limpiarMarkers();
            if (status !== window.google.maps.places.PlacesServiceStatus.OK) {
              setError('No se encontraron resultados cerca.');
              return;
            }
            results.slice(0, 15).forEach(place => {
              const marker = new window.google.maps.Marker({
                position: place.geometry.location,
                map: mapInstance.current,
                title: place.name,
                icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: TIPOS[tipo].color, fillOpacity: 0.9, strokeColor: '#fff', strokeWeight: 2 },
              });
              const info = new window.google.maps.InfoWindow({
                content: `<div style="color:#000;padding:4px"><b>${place.name}</b><br/>${place.vicinity || ''}<br/>${place.opening_hours?.open_now ? '✅ Abierto' : '❌ Cerrado'}</div>`,
              });
              marker.addListener('click', () => info.open(mapInstance.current, marker));
              markersRef.current.push(marker);
            });
          }
        );
      },
      () => {
        setLoading(false);
        setError('No se pudo obtener tu ubicación. Activá el GPS.');
      }
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {TIPOS.map((t, i) => (
          <button key={i} className={`tab ${tipo === i ? 'active' : ''}`} onClick={() => setTipo(i)}>
            {t.label}
          </button>
        ))}
        <button className="btn btn-primary" onClick={buscar} disabled={loading}>
          {loading ? 'Buscando...' : '📍 Buscar cerca mío'}
        </button>
      </div>

      {error && <p style={{ color: '#f44336' }}>{error}</p>}
      {ubicacion && <p style={{ color: '#aaa', fontSize: 13 }}>📍 {ubicacion.lat.toFixed(4)}, {ubicacion.lng.toFixed(4)}</p>}

      <div ref={mapRef} style={{ width: '100%', height: 500, borderRadius: 12, border: '1px solid #333' }} />
    </div>
  );
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#212121' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#383838' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
];