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
			aria-label="Chlorophyll-a concentration legend"
			style={{
				position: 'absolute',
				bottom: bottomOffset,
				right: '10px',
				backgroundColor: 'rgba(255, 255, 255, 0.95)',
				padding: '12px',
				borderRadius: '8px',
				boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
				zIndex: 1000 + position, // Ensure proper stacking
				fontSize: '12px',
				fontFamily: 'Arial, sans-serif',
				maxWidth: '90vw',
				width: '240px'
			}}
		>
			<div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#1a1a1a', fontSize: '13px' }}>
				🌊 Chlorophyll-a Concentration
			</div>

			{metadata && (
				<div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
					Date: {metadata.date}<br/>
					Units: {metadata.units}
				</div>
			)}

			<div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
				{/* Ultra High - Eutrophic waters */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: 'rgba(0, 255, 200, 0.8)', borderRadius: '2px', border: '1px solid #00CCA0' }}></div>
					<span style={{ color: '#333', fontWeight: '600' }}>&gt;20 Eutrophic</span>
				</div>

				{/* Very High - Highly productive */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: 'rgba(0, 255, 255, 0.7)', borderRadius: '2px' }}></div>
					<span style={{ color: '#333', fontSize: '11px' }}>10-20 Very High</span>
				</div>

				{/* High - Rich waters */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: 'rgba(64, 224, 208, 0.7)', borderRadius: '2px' }}></div>
					<span style={{ color: '#333', fontSize: '11px' }}>5-10 High</span>
				</div>

				{/* Moderately High */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: 'rgba(0, 206, 209, 0.7)', borderRadius: '2px' }}></div>
					<span style={{ color: '#333', fontSize: '11px' }}>2-5 Moderate-High</span>
				</div>

				{/* Moderate - Good productivity */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: 'rgba(0, 191, 255, 0.7)', borderRadius: '2px' }}></div>
					<span style={{ color: '#333', fontSize: '11px' }}>1-2 Moderate</span>
				</div>

				{/* Low-Moderate */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: 'rgba(70, 130, 180, 0.7)', borderRadius: '2px' }}></div>
					<span style={{ color: '#333', fontSize: '11px' }}>0.5-1 Fair</span>
				</div>

				{/* Low - Mesotrophic */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: 'rgba(100, 149, 237, 0.7)', borderRadius: '2px' }}></div>
					<span style={{ color: '#333', fontSize: '11px' }}>0.2-0.5 Low</span>
				</div>

				{/* Very Low */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: 'rgba(147, 112, 219, 0.7)', borderRadius: '2px' }}></div>
					<span style={{ color: '#666', fontSize: '11px' }}>0.1-0.2 Very Low</span>
				</div>

				{/* Oligotrophic - Clear waters */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: 'rgba(138, 43, 226, 0.7)', borderRadius: '2px' }}></div>
					<span style={{ color: '#666', fontSize: '11px' }}>0.05-0.1 Oligotrophic</span>
				</div>

				{/* Ultra-oligotrophic */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: 'rgba(75, 0, 130, 0.7)', borderRadius: '2px' }}></div>
					<span style={{ color: '#666', fontSize: '11px' }}>&lt;0.05 Ultra-low</span>
				</div>
			</div>

			<div style={{ marginTop: '10px', fontSize: '10px', color: '#888', fontStyle: 'italic' }}>
				Higher chlorophyll = More primary production = Better feeding grounds
			</div>
		</div>
	);
};

// Function to get color based on chlorophyll-a concentration (mg/m³)
// DISTINCT Color scale: Purple (ultra-low) -> Cyan -> Teal -> Turquoise (high)
const getChlorophyllColor = (concentration) => {
	// Chlorophyll-a concentration thresholds in mg/m³
	// Using a purple-to-turquoise scale to be distinct from other layers

	if (concentration < 0.05) return 'rgba(75, 0, 130, 0.7)';        // Indigo - Ultra-oligotrophic
	if (concentration < 0.1) return 'rgba(138, 43, 226, 0.7)';       // Blue Violet - Oligotrophic
	if (concentration < 0.2) return 'rgba(147, 112, 219, 0.7)';      // Medium Purple - Very low
	if (concentration < 0.5) return 'rgba(100, 149, 237, 0.7)';      // Cornflower Blue - Low
	if (concentration < 1.0) return 'rgba(70, 130, 180, 0.7)';       // Steel Blue - Low-Moderate
	if (concentration < 2.0) return 'rgba(0, 191, 255, 0.7)';        // Deep Sky Blue - Moderate
	if (concentration < 5.0) return 'rgba(0, 206, 209, 0.7)';        // Dark Turquoise - Moderate-High
	if (concentration < 10.0) return 'rgba(64, 224, 208, 0.7)';      // Turquoise - High
	if (concentration < 20.0) return 'rgba(0, 255, 255, 0.7)';       // Cyan - Very High
	return 'rgba(0, 255, 200, 0.8)';                                 // Bright Turquoise - Eutrophic
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