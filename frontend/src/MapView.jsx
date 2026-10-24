import { useEffect, useRef, useState } from 'react';
import { formatAssay } from './evidence.js';
import { createTerrainStyle, TERRAIN_STYLE_URL, TERRAIN_PITCH, TERRAIN_BEARING } from './terrain-style.js';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import './map.css';

const mercatorY = (latitude) => Math.log(Math.tan(Math.PI / 4 + latitude * Math.PI / 360));

function fitOptions() {
  const overlay = window.matchMedia('(min-width: 1121px)').matches;
  return {
    padding: { top: 65, bottom: 60, left: 45, right: overlay ? 390 : 45 },
    pitch: TERRAIN_PITCH,
    bearing: TERRAIN_BEARING,
    duration: 0,
  };
}

function SamplePlot({ features, bounds, selectedId, onSelect, onNearby }) {
  const svgRef = useRef(null);
  const [[west, south], [east, north]] = bounds;
  const left = west * Math.PI / 180;
  const right = east * Math.PI / 180;
  const bottom = mercatorY(south);
  const top = mercatorY(north);
  const scale = Math.min(880 / (right - left), 480 / (top - bottom));
  const offsetX = (1000 - (right - left) * scale) / 2;
  const offsetY = (600 - (top - bottom) * scale) / 2;
  const project = ([longitude, latitude]) => [
    offsetX + (longitude * Math.PI / 180 - left) * scale,
    offsetY + (top - mercatorY(latitude)) * scale,
  ];

  function inspect(feature) {
    const position = project(feature.geometry.coordinates);
    const pixelScale = (svgRef.current?.getBoundingClientRect().width || 1000) / 1000;
    const neighbours = features.filter((candidate) => {
      const point = project(candidate.geometry.coordinates);
      return Math.hypot(point[0] - position[0], point[1] - position[1]) * pixelScale <= 24;
    });
    if (neighbours.length > 1) onNearby({ features: neighbours, anchorId: feature.id });
    else onSelect(feature);
  }

  return (
    <div className="sample-plot">
      <svg ref={svgRef} viewBox="0 0 1000 600" aria-label="Sample locations in a geographic plot">
        <title>Tok River sample locations. Basemap unavailable.</title>
        {[0, 1, 2, 3, 4].map((step) => {
          const longitude = west + (east - west) * step / 4;
          const x = project([longitude, north])[0];
          return <g key={`longitude-${step}`} className="plot-grid">
            <line x1={x} x2={x} y1="40" y2="560" />
            <text x={x} y="588" textAnchor="middle">{longitude.toFixed(3)}°</text>
          </g>;
        })}
        {[0, 1, 2].map((step) => {
          const latitude = south + (north - south) * step / 2;
          const y = project([west, latitude])[1];
          return <g key={`latitude-${step}`} className="plot-grid">
            <line x1="45" x2="955" y1={y} y2={y} />
            <text x="48" y={y - 8}>{latitude.toFixed(3)}° N</text>
          </g>;
        })}
        {features.map((feature) => {
          const [x, y] = project(feature.geometry.coordinates);
          const { sample_id: sampleId, area } = feature.properties;
          return <g key={feature.id} role="button" tabIndex="0"
            className={`plot-point plot-point--${area.toLowerCase()} ${selectedId === feature.id ? 'is-selected' : ''}`}
            transform={`translate(${x} ${y})`}
            aria-label={`Sample ${sampleId}, area ${area}, gold ${formatAssay(feature.properties, 'gold_primary')}`}
            aria-pressed={selectedId === feature.id} data-sample-id={sampleId}
            onClick={() => inspect(feature)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                inspect(feature);
              }
            }}>
            <title>{sampleId}</title>
            <circle className="point-target" r="13" />
            {area === 'A' ? <circle className="point-dot" r="5" /> : <rect className="point-dot" x="-5" y="-5" width="10" height="10" rx="2" />}
            {selectedId === feature.id && <circle className="point-ring" r="10" />}
          </g>;
        })}
      </svg>
    </div>
  );
}

export default function MapView({ features, selectedId, bounds, onSelect }) {
  const containerRef = useRef(null);
  const frameRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const featuresRef = useRef(features);
  const nearbyHeading = useRef(null);
  const selectRef = useRef(onSelect);
  const selectedRef = useRef(selectedId);
  const boundsRef = useRef(bounds);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('loading');
  const [fallback, setFallback] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [nearby, setNearby] = useState(null);

  selectRef.current = onSelect;
  featuresRef.current = features;
  selectedRef.current = selectedId;
  boundsRef.current = bounds;

  useEffect(() => {
    let cancelled = false;
    let map;
    let timeout;
    setStatus('loading');
    setFallback(false);
    setReady(false);

    async function initialise() {
      try {
        const { Map, NavigationControl, AttributionControl, TerrainControl, setWorkerUrl } = await import('maplibre-gl');
        const response = await fetch(TERRAIN_STYLE_URL);
        if (!response.ok) throw new Error('The geographic map style could not be loaded.');
        const style = createTerrainStyle(await response.json());
        if (cancelled) return;
        setWorkerUrl(workerUrl);
        map = new Map({
          container: containerRef.current,
          style,
          bounds: boundsRef.current,
          pitch: TERRAIN_PITCH,
          bearing: TERRAIN_BEARING,
          fitBoundsOptions: fitOptions(),
          attributionControl: false,
          pitchWithRotate: false,
          dragRotate: false,
          renderWorldCopies: false,
        });
        mapRef.current = map;
        map.addControl(new NavigationControl({ showCompass: true, visualizePitch: true }), 'bottom-left');
        map.addControl(new TerrainControl({ source: 'tok-terrain', exaggeration: 1.35 }), 'bottom-left');
        map.addControl(new AttributionControl({ compact: true }), 'bottom-right');
        map.getCanvas().setAttribute('aria-label', 'Map of Tok River sediment samples. Use sample markers or the sample records below.');
        map.on('load', () => {
          if (!cancelled) setStatus('ready');
          clearTimeout(timeout);
        });
        map.on('error', () => {
          if (!cancelled) setStatus('limited');
        });
        map.on('webglcontextlost', () => {
          if (!cancelled) {
            setFallback(true);
            setStatus('limited');
          }
        });
        map.on('movestart', () => {
          if (!cancelled) setNearby(null);
        });
        map.on('resize', () => {
          if (!cancelled) map.fitBounds(boundsRef.current, fitOptions());
        });
        timeout = setTimeout(() => {
          if (!cancelled && !map.isStyleLoaded()) setStatus('limited');
        }, 12000);
        setReady(true);
      } catch {
        if (!cancelled) {
          setFallback(true);
          setStatus('limited');
        }
      }
    }
    initialise();
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = [];
      map?.remove();
      mapRef.current = null;
    };
  }, [attempt]);

  useEffect(() => {
    if (!ready || fallback) return;
    setNearby(null);
    let cancelled = false;
    async function updateMarkers() {
      const { Marker } = await import('maplibre-gl');
      if (cancelled || !mapRef.current) return;
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = features.map((feature) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `sample-marker sample-marker--${feature.properties.area.toLowerCase()}`;
        button.classList.toggle('is-selected', feature.id === selectedRef.current);
        button.setAttribute('aria-pressed', String(feature.id === selectedRef.current));
        button.dataset.sampleId = feature.properties.sample_id;
        button.setAttribute('aria-label', `Sample ${feature.properties.sample_id}, area ${feature.properties.area}, gold ${formatAssay(feature.properties, 'gold_primary')}`);
        button.title = `${feature.properties.sample_id} · ${formatAssay(feature.properties, 'gold_primary')}`;
        button.appendChild(Object.assign(document.createElement('span'), { className: 'sample-marker-dot' }));
        button.addEventListener('click', (event) => {
          event.stopPropagation();
          const position = mapRef.current.project(feature.geometry.coordinates);
          const neighbours = featuresRef.current.filter((candidate) => {
            const point = mapRef.current.project(candidate.geometry.coordinates);
            return Math.hypot(point.x - position.x, point.y - position.y) <= 24;
          });
          if (neighbours.length > 1) {
            setNearby({ features: neighbours, anchorId: feature.id });
          } else {
            selectRef.current(feature);
          }
        });
        const marker = new Marker({ element: button })
          .setLngLat(feature.geometry.coordinates)
          .addTo(mapRef.current);
        return { id: feature.id, marker, button };
      });
    }
    updateMarkers();
    return () => { cancelled = true; };
  }, [features, ready, fallback]);

  useEffect(() => {
    if (nearby) nearbyHeading.current?.focus({ preventScroll: true });
  }, [nearby]);

  useEffect(() => {
    markersRef.current.forEach(({ id, button }) => {
      button.classList.toggle('is-selected', id === selectedId);
      button.setAttribute('aria-pressed', String(id === selectedId));
    });
  }, [selectedId, features, ready]);

  useEffect(() => {
    if (!ready || fallback || !mapRef.current) return;
    mapRef.current.fitBounds(boundsRef.current, fitOptions());
  }, [bounds, ready, fallback]);

  function focusFeature(id) {
    const marker = markersRef.current.find((entry) => entry.id === id);
    if (marker) marker.button.focus({ preventScroll: true });
    else {
      const feature = featuresRef.current.find((entry) => entry.id === id);
      [...(frameRef.current?.querySelectorAll('[data-sample-id]') || [])]
        .find((element) => element.dataset.sampleId === feature?.properties.sample_id)?.focus({ preventScroll: true });
    }
  }

  function closeNearby() {
    focusFeature(nearby?.anchorId);
    setNearby(null);
  }

  return <div ref={frameRef} className="evidence-map-frame" data-map-status={status} onKeyDown={(event) => {
    if (event.key === 'Escape' && nearby) closeNearby();
  }}>
    <div ref={containerRef} className="map-canvas" hidden={fallback} />
    {fallback && <SamplePlot features={features} bounds={bounds} selectedId={selectedId} onSelect={onSelect} onNearby={setNearby} />}
    {nearby && <div className="nearby-samples" role="dialog" aria-labelledby="nearby-title">
      <div className="nearby-heading"><h3 id="nearby-title" ref={nearbyHeading} tabIndex={-1}>Nearby samples</h3>
        <button type="button" onClick={closeNearby} aria-label="Close nearby samples">Close</button></div>
      <p>Choose a record from these overlapping locations.</p>
      <ul>{nearby.features.map((feature) => <li key={feature.id}>
        <button type="button" aria-label={`Inspect nearby sample ${feature.properties.sample_id}`} onClick={() => {
          focusFeature(feature.id);
          setNearby(null);
          selectRef.current(feature);
        }}><span>{feature.properties.sample_id}</span><span>{formatAssay(feature.properties, 'gold_primary')}</span></button>
      </li>)}</ul>
    </div>}
    {status !== 'ready' && <div className="map-status" role="status">
      <span>{status === 'loading' ? 'Loading geographic basemap…' : fallback
        ? 'Basemap unavailable. Sample locations are shown on a geographic plot.'
        : 'Basemap is limited. Sample locations remain available.'}</span>
      {status === 'limited' && <button type="button" onClick={() => setAttempt((value) => value + 1)}>Retry map</button>}
    </div>}
  </div>;
}
