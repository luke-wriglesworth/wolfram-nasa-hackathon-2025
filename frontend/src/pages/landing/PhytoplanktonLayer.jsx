// PhytoplanktonLayer - Display phytoplankton concentration with smooth blending
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

// PhytoplanktonLegend component
const PhytoplanktonLegend = ({ show, metadata, position = 1 }) => {
	if (!show) return null;

	// Calculate position based on index (0=top, 1=middle, 2=bottom)
	const bottomOffset = position === 0 ? '430px' : position === 1 ? '230px' : '30px';

	return (
		<div
			aria-label="Phytoplankton concentration legend"
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
				🌊 Phytoplankton Concentration
			</div>

			{metadata && (
				<div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
					Date: {metadata.date}<br/>
					Units: {metadata.units}
				</div>
			)}

			<div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
				{/* Extremely Rich - Prime feeding */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: 'rgba(0, 50, 100, 0.8)', borderRadius: '2px', border: '1px solid #004080' }}></div>
					<span style={{ color: '#333', fontWeight: '600' }}>&gt;500k Rich Waters</span>
				</div>

				{/* Very High */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: 'rgba(0, 100, 150, 0.7)', borderRadius: '2px' }}></div>
					<span style={{ color: '#333', fontSize: '11px' }}>400-500k Very High</span>
				</div>

				{/* High */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: 'rgba(0, 139, 139, 0.7)', borderRadius: '2px' }}></div>
					<span style={{ color: '#333', fontSize: '11px' }}>300-400k High</span>
				</div>

				{/* Very Good */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: 'rgba(0, 205, 102, 0.7)', borderRadius: '2px' }}></div>
					<span style={{ color: '#333', fontSize: '11px' }}>250-300k Very Good</span>
				</div>

				{/* Good */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: 'rgba(0, 255, 0, 0.7)', borderRadius: '2px' }}></div>
					<span style={{ color: '#333', fontSize: '11px' }}>200-250k Good</span>
				</div>

				{/* Moderate */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: 'rgba(173, 255, 47, 0.7)', borderRadius: '2px' }}></div>
					<span style={{ color: '#333', fontSize: '11px' }}>150-200k Moderate</span>
				</div>

				{/* Low-Moderate */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: 'rgba(255, 255, 0, 0.7)', borderRadius: '2px' }}></div>
					<span style={{ color: '#333', fontSize: '11px' }}>100-150k Fair</span>
				</div>

				{/* Below Average */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: 'rgba(255, 215, 0, 0.7)', borderRadius: '2px' }}></div>
					<span style={{ color: '#666', fontSize: '11px' }}>75-100k Below Avg</span>
				</div>

				{/* Poor */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: 'rgba(255, 140, 0, 0.7)', borderRadius: '2px' }}></div>
					<span style={{ color: '#666', fontSize: '11px' }}>50-75k Poor</span>
				</div>

				{/* Very Poor */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: 'rgba(255, 69, 0, 0.7)', borderRadius: '2px' }}></div>
					<span style={{ color: '#666', fontSize: '11px' }}>25-50k Very Poor</span>
				</div>

				{/* Extremely Poor */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: 'rgba(220, 20, 60, 0.7)', borderRadius: '2px' }}></div>
					<span style={{ color: '#666', fontSize: '11px' }}>10-25k Barren</span>
				</div>

				{/* Ocean Desert */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: 'rgba(139, 0, 0, 0.7)', borderRadius: '2px' }}></div>
					<span style={{ color: '#666', fontSize: '11px' }}>&lt;10k Desert</span>
				</div>
			</div>

			<div style={{ marginTop: '10px', fontSize: '10px', color: '#888', fontStyle: 'italic' }}>
				Higher phytoplankton = More prey fish = Better shark habitat
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

export default function PhytoplanktonLayer({ data, showLegend = true, useCircles = false, legendPosition = 1 }) {
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

		// Find the grid spacing from the data
		const lats = [...new Set(phytoData.map(p => p[0]))].sort((a, b) => a - b);
		const lons = [...new Set(phytoData.map(p => p[1]))].sort((a, b) => a - b);

		// Calculate grid spacing
		const latSpacing = lats.length > 1 ? Math.abs(lats[1] - lats[0]) : 0.2;
		const lonSpacing = lons.length > 1 ? Math.abs(lons[1] - lons[0]) : 0.2;

		console.log(`Creating phytoplankton layer with ${phytoData.length} points`);
		console.log(`Concentration range: ${minVal.toFixed(1)} to ${maxVal.toFixed(1)} ${metadata?.units || 'cells/ml'}`);

		if (useCircles) {
			// Create overlapping circles for smooth blending
			phytoData.forEach(point => {
				const [lat, lon, concentration] = point;

				// Fixed smaller radius for better visualization
				// Using a fixed 8km radius for all circles
				const radiusInMeters = 8000; // 8km radius

				const circle = L.circle([lat, lon], {
					radius: radiusInMeters,
					stroke: false,
					fillColor: getPhytoplanktonColor(concentration),
					fillOpacity: 0.5,
					interactive: false
				});

				circle.addTo(featureGroup);
			});
		} else {
			// Create rectangles for grid visualization
			phytoData.forEach(point => {
				const [lat, lon, concentration] = point;

				// Create rectangle bounds
				const bounds = [
					[lat - latSpacing/2, lon - lonSpacing/2],
					[lat + latSpacing/2, lon + lonSpacing/2]
				];

				const rect = L.rectangle(bounds, {
					stroke: false,
					fillColor: getPhytoplanktonColor(concentration),
					fillOpacity: 0.5,
					interactive: false
				});

				rect.addTo(featureGroup);
			});
		}

		// Add the feature group to the map
		featureGroup.addTo(map);

		// Cleanup function
		return () => {
			map.removeLayer(featureGroup);
		};
	}, [map, data, useCircles]);

	return <PhytoplanktonLegend show={showLegend} metadata={data?.metadata} position={legendPosition} />;
}