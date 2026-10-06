import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, TileLayer, useMap, ZoomControl } from 'react-leaflet';
import type { Place } from '../data/types';
import { iconSvg } from './Icon';

// OpenStreetMap tiles need no API key. They are muted in CSS so the base sits quietly under the palette.
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

/** Pins and labels are app components drawn with tokens, not Leaflet's default blue markers. */
function pinIcon(place: Place, selected: boolean) {
  const label = selected ? `<span class="map-pin__label clickables-s">${escape(place.name)}</span>` : '';
  return L.divIcon({
    className: '',
    html: `<span class="map-pin ${selected ? 'map-pin--selected' : ''}" role="img" aria-label="${escape(place.name)}">${iconSvg('mapPin')}${label}</span>`,
    iconSize: selected ? [40, 40] : [32, 32],
    iconAnchor: selected ? [20, 20] : [16, 16],
  });
}

function Fit({ places, center }: { places: Place[]; center?: Place }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView([center.lat, center.lng], 16, { animate: false });
    else if (places.length) map.fitBounds(L.latLngBounds(places.map((p) => [p.lat, p.lng])), { padding: [40, 40], animate: false });
  }, [map, places, center]);
  return null;
}

/** Pan to a place picked from search. */
function FocusOn({ place }: { place?: Place }) {
  const map = useMap();
  useEffect(() => {
    if (place) map.setView([place.lat, place.lng], Math.max(map.getZoom(), 16));
  }, [map, place]);
  return null;
}

interface Props {
  places: Place[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  /** Small, fixed preview centered on the selected place (Confirm step). */
  preview?: boolean;
  /** Place to pan to (from search). */
  focusId?: string;
  fallbackCenter: [number, number];
}

export function PlaceMap({ places, selectedId, onSelect, preview, focusId, fallbackCenter }: Props) {
  const selected = places.find((p) => p.id === selectedId);
  const icons = useMemo(() => new Map(places.map((p) => [p.id, pinIcon(p, p.id === selectedId)])), [places, selectedId]);

  return (
    <MapContainer
      className={`place-map ${preview ? 'place-map--preview' : ''}`}
      center={fallbackCenter}
      zoom={16}
      zoomControl={false}
      dragging={!preview}
      scrollWheelZoom={!preview}
      doubleClickZoom={!preview}
      touchZoom={!preview}
      boxZoom={!preview}
      keyboard={!preview}
      attributionControl
    >
      <TileLayer url={TILES} attribution={ATTRIBUTION} maxZoom={19} />
      {!preview && <ZoomControl position="bottomleft" />}
      <Fit places={places} center={preview ? selected : undefined} />
      {!preview && <FocusOn place={places.find((p) => p.id === focusId)} />}
      {places.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={icons.get(p.id)!}
          interactive={!preview}
          keyboard={!preview}
          title={p.name}
          zIndexOffset={p.id === selectedId ? 1000 : 0}
          eventHandlers={preview ? undefined : { click: () => onSelect?.(p.id) }}
        />
      ))}
    </MapContainer>
  );
}
