// PhytoplanktonLayer - Display phytoplankton concentration with smooth blending
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

// PhytoplanktonLegend component
const PhytoplanktonLegend = ({ show, metadata, position = 1, totalLegends = 1, explicitBottom, onHeight }) => {
	if (!show) return null;

	// Calculate position dynamically based on position and total legends
	// Each legend needs about 360px of height to accommodate all items without overlap
	const legendRef = useRef(null);
	const legendHeight = 360;
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
    aria-label="Phytoplankton concentration legend with shark habitat explanation"
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
      🌊 Phytoplankton Concentration
    </div>

    {/* Metadata */}
    <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px', lineHeight: '1.3' }}>
      Variable: <strong>prococcus_moana</strong><br />
      Units: <strong>cells mL⁻¹</strong><br />
      Date: 2025-10-03
    </div>

    {/* Legend bins */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {/* Extremely High */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '22px', height: '12px', background: 'rgb(255, 0, 0)', borderRadius: '2px' }}></div>
        <span style={{ color: '#333', fontWeight: 600 }}>&gt;600 000 — Algal bloom / variable</span>
      </div>

      {/* High */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '22px', height: '12px', background: 'rgb(0, 128, 255)', borderRadius: '2px' }}></div>
        <span style={{ color: '#333', fontSize: '11px' }}>300 000–600 000 — Excellent feeding grounds</span>
      </div>

      {/* Moderate-High */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '22px', height: '12px', background: 'rgb(0, 200, 0)', borderRadius: '2px' }}></div>
        <span style={{ color: '#333', fontSize: '11px' }}>100 000–300 000 — Good productivity (favorable)</span>
      </div>

      {/* Moderate */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '22px', height: '12px', background: 'rgb(173, 255, 47)', borderRadius: '2px' }}></div>
        <span style={{ color: '#333', fontSize: '11px' }}>30 000–100 000 — Moderate habitat</span>
      </div>

      {/* Low */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '22px', height: '12px', background: 'rgb(255, 255, 0)', borderRadius: '2px' }}></div>
        <span style={{ color: '#333', fontSize: '11px' }}>10 000–30 000 — Low productivity</span>
      </div>

      {/* Very Low */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '22px', height: '12px', background: 'rgb(255, 215, 0)', borderRadius: '2px' }}></div>
        <span style={{ color: '#666', fontSize: '11px' }}>&lt;10 000 — Ocean desert (poor)</span>
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
      Phytoplankton form the base of the marine food web.
      Higher concentrations support zooplankton and forage fish,
      creating better feeding conditions for pelagic sharks.
      <br />
      <em>Optimal shark habitat typically aligns with 1×10⁵–5×10⁵ cells mL⁻¹ — moderately productive waters that balance food availability and oxygen levels.</em>
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
      Min: 2 Max: 826 016 Mean: 227 932 (cells mL⁻¹)
    </div>

    {/* Attribution */}
    <div style={{ marginTop: '6px', fontSize: '9.5px', color: '#999', fontStyle: 'italic' }}>
      Data source: <strong>prococcus_moana model dataset</strong> (2025-10-03)
    </div>
  </div>
);
};

// Function to get color based on phytoplankton concentration
// Dramatic color scale: Red (desert) -> Yellow -> Green -> Blue-green (rich)
const getPhytoplanktonColor = (concentration) => {
	// Direct concentration thresholds (cells/ml)
	// Red for ocean deserts, transitioning through yellow/green to blue-green for rich waters

	if (concentration < 10000) return 'rgba(139, 0, 0, 0.7)';           // Dark Red - Ocean desert
	if (concentration < 25000) return 'rgba(220, 20, 60, 0.7)';         // Crimson - Extremely poor
	if (concentration < 50000) return 'rgba(255, 69, 0, 0.7)';          // Red-Orange - Very poor
	if (concentration < 75000) return 'rgba(255, 140, 0, 0.7)';         // Dark Orange - Poor
	if (concentration < 100000) return 'rgba(255, 215, 0, 0.7)';        // Gold - Below average
	if (concentration < 150000) return 'rgba(255, 255, 0, 0.7)';        // Yellow - Low-Moderate
	if (concentration < 200000) return 'rgba(173, 255, 47, 0.7)';       // GreenYellow - Moderate
	if (concentration < 250000) return 'rgba(0, 255, 0, 0.7)';          // Lime - Good
	if (concentration < 300000) return 'rgba(0, 205, 102, 0.7)';        // Medium Spring Green - Very Good
	if (concentration < 400000) return 'rgba(0, 139, 139, 0.7)';        // Dark Cyan - High
	if (concentration < 500000) return 'rgba(0, 100, 150, 0.7)';        // Deep Blue-Green - Very High
	return 'rgba(0, 50, 100, 0.8)';                                     // Very Deep Blue - Extremely Rich
};

export default function PhytoplanktonLayer({
	data,
	showLegend = true,
	legendPosition = 1,
	totalLegends = 1,
	legendBottomOffset,
	onLegendHeight
}) {
	const map = useMap();

	useEffect(() => {
		if (!map || !data) return;

		// Extract actual data array and metadata
		const phytoData = data.data || data;
		const metadata = data.metadata || null;

		if (!phytoData || phytoData.length === 0) return;

		// Create a feature group to hold all shapes
		const featureGroup = L.featureGroup();

		// Get min/max values for color scaling
		const values = phytoData.map(p => p[2]);
		const minVal = metadata?.min_value || Math.min(...values);
		const maxVal = metadata?.max_value || Math.max(...values);

		// Determine grid spacing robustly (smallest positive delta)
		const lats = [...new Set(phytoData.map(p => p[0]))].sort((a, b) => a - b);
		const lons = [...new Set(phytoData.map(p => p[1]))].sort((a, b) => a - b);

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

		console.log(`Creating phytoplankton layer with ${phytoData.length} points`);
		console.log(`Concentration range: ${minVal.toFixed(1)} to ${maxVal.toFixed(1)} ${metadata?.units || 'cells/ml'}`);

		// Always render square-ish grid rectangles (degree-based)
		phytoData.forEach(point => {
			const [lat, lon, concentration] = point;
			const half = (cellSize * overlapFactor) / 2;
			const bounds = [
				[lat - half, lon - half],
				[lat + half, lon + half]
			];
			const rect = L.rectangle(bounds, {
				stroke: false,
				fillColor: getPhytoplanktonColor(concentration),
				fillOpacity: 0.5,
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
		<PhytoplanktonLegend
			show={showLegend}
			metadata={data?.metadata}
			position={legendPosition}
			totalLegends={totalLegends}
			explicitBottom={legendBottomOffset}
			onHeight={onLegendHeight}
		/>
	);
}