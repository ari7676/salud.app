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
    const loadMap = () => {
      if (!mapRef.current) return;
      initMap();
    };
    if (window.google && window.google.maps) {
      loadMap();
      return;
    }
    if (document.querySelector('script[src*="maps.googleapis"]')) {
      const interval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(interval);
          loadMap();
        }
      }, 100);
      return () => clearInterval(interval);
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly`;
    script.async = true;
    script.onload = loadMap;
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

  async function buscar() {
    if (!window.google || !mapInstance.current) return;
    setLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUbicacion(loc);
        mapInstance.current.setCenter(loc);

        new window.google.maps.Marker({
          position: loc,
          map: mapInstance.current,
          title: 'Tu ubicación',
          icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#fff', fillOpacity: 1, strokeColor: '#4CAF50', strokeWeight: 3 },
        });

        try {
          const { Place, SearchNearbyRankPreference } = await window.google.maps.importLibrary('places');
          const request = {
            fields: ['displayName', 'location', 'formattedAddress', 'businessStatus'],
            locationRestriction: {
              center: loc,
              radius: 2000,
            },
            includedPrimaryTypes: tipo === 0 ? ['pharmacy'] : tipo === 1 ? ['hospital', 'doctor'] : ['medical_lab'],
            maxResultCount: 15,
            rankPreference: SearchNearbyRankPreference.DISTANCE,
          };

          const { places } = await Place.searchNearby(request);
          setLoading(false);
          limpiarMarkers();

          if (!places || places.length === 0) {
            setError('No se encontraron resultados cerca.');
            return;
          }

          places.forEach(place => {
            const marker = new window.google.maps.Marker({
              position: place.location,
              map: mapInstance.current,
              title: place.displayName,
              icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: TIPOS[tipo].color, fillOpacity: 0.9, strokeColor: '#fff', strokeWeight: 2 },
            });
            const info = new window.google.maps.InfoWindow({
              content: `<div style="color:#000;padding:4px"><b>${place.displayName}</b><br/>${place.formattedAddress || ''}</div>`,
            });
            marker.addListener('click', () => info.open(mapInstance.current, marker));
            markersRef.current.push(marker);
          });
        } catch (e) {
          setLoading(false);
          setError('Error al buscar lugares: ' + e.message);
        }
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