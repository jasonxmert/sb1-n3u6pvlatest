"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import dynamic from 'next/dynamic';
import GlobeLabel from './globe/globe-label';

const Globe = dynamic(() => import('./globe/globe-component'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-square md:aspect-[4/3] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
});

interface Marker {
  name: string;
  state: string;
  country: string;
  postcode: string;
  lat: number;
  lng: number;
  size: number;
  color: string;
}

interface Label {
  text: string;
  lat: number;
  lng: number;
  size: number;
  color: string;
  name: string;
  state: string;
  country: string;
  postcode: string;
}

interface InteractiveGlobeProps {
  searchResults: any;
}

export default function InteractiveGlobe({ searchResults }: InteractiveGlobeProps) {
  const [mounted, setMounted] = useState(false);
  const [countries, setCountries] = useState<any>({ features: [] });
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const globeRef = useRef<any>(null);

  const handleResize = useCallback(() => {
    if (!mounted) return;
    const container = document.getElementById('globe-container');
    if (container) {
      const width = container.clientWidth;
      const height = width * (window.innerWidth >= 768 ? 0.75 : 1);
      setDimensions({ width, height });
    }
  }, [mounted]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchData = async () => {
      try {
        const response = await fetch('https://unpkg.com/world-atlas/countries-110m.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setCountries(data);
      } catch (error) {
        console.error('Failed to load geographical data:', error);
      }
    };

    fetchData();
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize, mounted]);

  const focusGlobe = useCallback((lat: number, lng: number) => {
    if (!globeRef.current) return;

    const altitude = window.innerWidth >= 768 ? 1.8 : 2.2;
    globeRef.current.pointOfView({
      lat,
      lng,
      altitude
    }, 1000);
  }, []);

  useEffect(() => {
    if (!mounted || !searchResults?.places?.[0]) return;

    const place = searchResults.places[0];
    const lat = parseFloat(place.latitude);
    const lng = parseFloat(place.longitude);

    if (!isNaN(lat) && !isNaN(lng)) {
      const newMarker: Marker = {
        name: place["place name"],
        state: place.state,
        country: searchResults.country,
        postcode: searchResults["post code"],
        lat,
        lng,
        size: 3,
        color: '#ff4444'
      };

      const newLabel: Label = {
        text: `${place["place name"]}, ${searchResults["post code"]}`,
        lat,
        lng,
        size: 1.5,
        color: '#ffffff',
        name: place["place name"],
        state: place.state,
        country: searchResults.country,
        postcode: searchResults["post code"]
      };

      setMarkers([newMarker]);
      setLabels([newLabel]);

      // Focus the globe on the new location with a slight delay to ensure rendering
      setTimeout(() => focusGlobe(lat, lng), 100);
    }
  }, [searchResults, mounted, focusGlobe]);

  if (!mounted) return null;

  return (
    <div className="my-8 md:my-16">
      <div id="globe-container" className="relative w-full bg-transparent">
        <Globe
          globeRef={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-day.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          atmosphereColor="rgba(200,230,255,0.2)"
          atmosphereAltitude={0.1}
          atmosphereGlow={0}
          pointsData={markers}
          pointAltitude={0.01}
          pointColor="color"
          pointRadius="size"
          pointsMerge={false}
          pointResolution={32}
          pointLabel={(d: any) => `${d.name}, ${d.postcode}`}
          labelsData={labels}
          labelLat={d => d.lat}
          labelLng={d => d.lng}
          labelAltitude={0.01}
          labelRotation={0}
          labelSize={2}
          labelIncludeDot={true}
          labelDotRadius={0.5}
          labelColor={() => '#ffffff'}
          labelResolution={2}
          labelText="text"
          labelComponent={GlobeLabel}
          polygonsData={countries.features}
          polygonCapColor={() => '#1a1a1a'}
          polygonSideColor={() => '#242424'}
          polygonStrokeColor={() => '#333'}
          onGlobeReady={() => {
            if (globeRef.current) {
              if (globeRef.current.renderer()) {
                globeRef.current.renderer().setClearColor(0x000000, 0);
              }
              globeRef.current.pointOfView({
                lat: 20,
                lng: 0,
                altitude: window.innerWidth >= 768 ? 2.5 : 3
              });
            }
          }}
          rendererConfig={{
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: false,
            logarithmicDepthBuffer: true
          }}
        />
      </div>
    </div>
  );
}