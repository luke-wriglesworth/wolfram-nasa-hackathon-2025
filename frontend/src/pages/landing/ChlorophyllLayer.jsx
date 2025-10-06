// ChlorophyllLayer - Display chlorophyll-a concentration with smooth blending
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

// ChlorophyllLegend component
const ChlorophyllLegend = ({ show, metadata, position = 2, totalLegends = 1, explicitBottom, onHeight }) => {
	if (!show) return null;

	// Calculate position dynamically based on position and total legends
	// Each legend needs about 320px of height to accommodate all items
	const legendRef = useRef(null);
	const legendHeight = 320;
	const spacing = 20;
	const bottomOffset = explicitBottom != null
		? `${explicitBottom}px`
		: `${30 + (totalLegends - position - 1) * (legendHeight + spacing)}px`;

	useEffect(() => {
		if (legendRef.current && onHeight) {
			onHeight(legendRef.current.offsetHeight);
		}
	}, [onHeight]);

return (
  <div
    ref={legendRef}
    aria-label="Chlorophyll-a concentration legend with shark habitat explanation"
    style={{
      position: 'absolute',
      bottom: bottomOffset,
      right: '10px',
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      padding: '14px',
      borderRadius: '10px',
      boxShadow: '0 3px 8px rgba(0, 0, 0, 0.3)',
      zIndex: 1000 + position,
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '95vw',
      width: '270px'
    }}
  >
    {/* Header */}
    <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#1a1a1a', fontSize: '13px' }}>
      🌊 Chlorophyll-a Concentration (mg m⁻³)
    </div>

    {/* Metadata */}
    <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px', lineHeight: '1.3' }}>
      Variable: <strong>chlor_a</strong><br />
      Units: <strong>mg m⁻³</strong><br />
      Date: 2025-10-03
    </div>

    {/* Legend bins */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {/* Hyper-eutrophic */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '22px', height: '12px', background: 'rgb(255, 0, 0)', borderRadius: '2px' }}></div>
        <span style={{ color: '#333', fontWeight: 600 }}>&gt;20 — Algal Bloom / Hypoxic Risk</span>
      </div>

      {/* Eutrophic */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '22px', height: '12px', background: 'rgb(255, 165, 0)', borderRadius: '2px' }}></div>
        <span style={{ color: '#333', fontSize: '11px' }}>5 – 20 — Highly Productive (Excellent Feeding)</span>
      </div>

      {/* Mesotrophic */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '22px', height: '12px', background: 'rgb(255, 255, 0)', borderRadius: '2px' }}></div>
        <span style={{ color: '#333', fontSize: '11px' }}>1 – 5 — Moderate Productivity (Preferred Habitat)</span>
      </div>

      {/* Oligotrophic */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '22px', height: '12px', background: 'rgb(0, 255, 0)', borderRadius: '2px' }}></div>
        <span style={{ color: '#333', fontSize: '11px' }}>0.3 – 1 — Low Productivity (Common Ocean)</span>
      </div>

      {/* Ultra-oligotrophic */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '22px', height: '12px', background: 'rgb(0, 128, 255)', borderRadius: '2px' }}></div>
        <span style={{ color: '#333', fontSize: '11px' }}>0.1 – 0.3 — Very Low (Limited Prey)</span>
      </div>

      {/* Oceanic Gyres */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '22px', height: '12px', background: 'rgb(0, 0, 128)', borderRadius: '2px' }}></div>
        <span style={{ color: '#666', fontSize: '11px' }}>&lt;0.1 — Ocean Deserts (Poor Habitat)</span>
      </div>
    </div>

    {/* Ecological explanation */}
    <div
      style={{
        marginTop: '12px',
        fontSize: '10.5px',
        color: '#444',
        lineHeight: '1.4',
        background: 'rgba(240, 248, 255, 0.6)',
        borderRadius: '6px',
        padding: '6px 8px'
      }}
    >
      <strong>Ecological relevance:</strong><br />
      Chlorophyll-a indicates phytoplankton biomass — the foundation of marine food webs.
      Regions with <em>moderate to high chlorophyll</em> (1–20 mg m⁻³) support zooplankton
      and forage fish, forming rich feeding grounds for pelagic sharks.
      <br />
      <em>Sharks often aggregate along productivity fronts and coastal upwelling zones where prey density peaks.</em>
    </div>

    {/* Dataset summary */}
    <div
      style={{
        marginTop: '10px',
        fontSize: '10px',
        color: '#777',
        borderTop: '1px solid #ddd',
        paddingTop: '6px',
        lineHeight: '1.3'
      }}
    >
      <strong>Data summary:</strong><br />
      Min: 0.008 Max: 85.24 Mean: 0.34 (mg m⁻³)
    </div>

    {/* Attribution */}
    <div style={{ marginTop: '6px', fontSize: '9.5px', color: '#999', fontStyle: 'italic' }}>
      Data source: <strong>NASA PACE (chlor_a)</strong> — global ocean color product.
    </div>
  </div>
);
};
// Function to get color based on chlorophyll-a concentration (mg m⁻³)
// EXACT palette (solid colors) synchronized with legend chips:
// <0.1      : #000080 (Oceanic Gyres / extremely clear)
// 0.1–0.3   : #0080FF (Ultra-oligotrophic)
// 0.3–1     : #00FF00 (Oligotrophic)
// 1–5       : #FFFF00 (Mesotrophic)
// 5–20      : #FFA500 (Eutrophic)
// >20       : #FF0000 (Algal Bloom / Hyper-eutrophic)
const getChlorophyllColor = (concentration) => {
  if (concentration < 0.1) return '#000080';
  if (concentration < 0.3) return '#0080FF';
  if (concentration < 1.0) return '#00FF00';
  if (concentration < 5.0) return '#FFFF00';
  if (concentration < 20.0) return '#FFA500';
  return '#FF0000';
};

export default function ChlorophyllLayer({
	data,
	showLegend = true,
	legendPosition = 2,
	totalLegends = 1,
	legendBottomOffset,
	onLegendHeight
}) {
	const map = useMap();

	useEffect(() => {
		if (!map || !data) return;

		// Extract actual data array and metadata
		const chloroData = data.data || data;
		const metadata = data.metadata || null;

		if (!chloroData || chloroData.length === 0) return;

		// Create a feature group to hold all shapes
		const featureGroup = L.featureGroup();

		// Get min/max values for color scaling
		const values = chloroData.map(p => p[2]);
		const minVal = metadata?.min_value || Math.min(...values);
		const maxVal = metadata?.max_value || Math.max(...values);

		// Determine grid spacing robustly (smallest positive delta)
		const lats = [...new Set(chloroData.map(p => p[0]))].sort((a, b) => a - b);
		const lons = [...new Set(chloroData.map(p => p[1]))].sort((a, b) => a - b);

		const calcSpacing = (arr, fallback) => {
			if (arr.length < 2) return fallback;
			const diffs = [];
			for (let i = 1; i < arr.length; i++) {
				const d = Math.abs(arr[i] - arr[i-1]);
				if (d > 0) diffs.push(d);
			}
			return diffs.length ? Math.min(...diffs) : fallback;
		};

		const latSpacing = calcSpacing(lats, 0.2);
		const lonSpacing = calcSpacing(lons, 0.2);
		const cellSize = Math.min(latSpacing, lonSpacing);
		const overlapFactor = 1.12; // slight overlap for smoother visual blending

		console.log(`Creating chlorophyll layer with ${chloroData.length} points`);
		console.log(`Concentration range: ${minVal.toFixed(3)} to ${maxVal.toFixed(3)} ${metadata?.units || 'mg/m³'}`);

		// Always render square-ish grid rectangles (degree-based)
		chloroData.forEach(point => {
			const [lat, lon, concentration] = point;
			const half = (cellSize * overlapFactor) / 2;
			const bounds = [
				[lat - half, lon - half],
				[lat + half, lon + half]
			];
      const rect = L.rectangle(bounds, {
        stroke: false,
        fillColor: getChlorophyllColor(concentration),
        fillOpacity: 0.6, // slightly stronger since colors are solid now
        interactive: false
      });
			rect.addTo(featureGroup);
		});

		// Add the feature group to the map
		featureGroup.addTo(map);

		// Cleanup function
		return () => {
			map.removeLayer(featureGroup);
		};
	}, [map, data]);

	return (
		<ChlorophyllLegend
			show={showLegend}
			metadata={data?.metadata}
			position={legendPosition}
			totalLegends={totalLegends}
			explicitBottom={legendBottomOffset}
			onHeight={onLegendHeight}
		/>
	);
}