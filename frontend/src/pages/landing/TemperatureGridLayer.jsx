// TemperatureGridLayer - Display actual sea surface temperatures as a grid
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

// Temperature Legend component
const TemperatureLegend = ({ show }) => {
	if (!show) return null;

	return (
		<div
			style={{
				position: 'absolute',
				bottom: '30px',
				right: '10px',
				backgroundColor: 'rgba(255, 255, 255, 0.95)',
				padding: '12px',
				borderRadius: '8px',
				boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
				zIndex: 1000,
				fontSize: '12px',
				fontFamily: 'Arial, sans-serif',
				maxWidth: '200px'
			}}
		>
			<div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#1a1a1a', fontSize: '13px' }}>
				Sea Surface Temperature
			</div>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: '#8B0000', borderRadius: '2px' }}></div>
					<span style={{ color: '#333' }}>30°C+ Very Hot</span>
				</div>

				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: '#FF6B6B', borderRadius: '2px' }}></div>
					<span style={{ color: '#333' }}>26-30°C Tropical</span>
				</div>

				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: '#FFD700', borderRadius: '2px' }}></div>
					<span style={{ color: '#333', fontWeight: '600' }}>22-26°C Warm</span>
				</div>

				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: '#ADFF2F', borderRadius: '2px' }}></div>
					<span style={{ color: '#333' }}>18-22°C Moderate</span>
				</div>

				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: '#90EE90', borderRadius: '2px' }}></div>
					<span style={{ color: '#333' }}>14-18°C Temperate</span>
				</div>

				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: '#00CED1', borderRadius: '2px' }}></div>
					<span style={{ color: '#333' }}>10-14°C Cool</span>
				</div>

				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: '#4169E1', borderRadius: '2px' }}></div>
					<span style={{ color: '#333' }}>5-10°C Cold</span>
				</div>

				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: '#0000CD', borderRadius: '2px' }}></div>
					<span style={{ color: '#333' }}>0-5°C Very Cold</span>
				</div>

				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: '#000080', borderRadius: '2px' }}></div>
					<span style={{ color: '#333' }}>Below 0°C Freezing</span>
				</div>
			</div>
		</div>
	);
};

// Function to get color based on temperature
const getTemperatureColor = (temp) => {
	// Map actual temperature to color
	if (temp < 0) return 'rgba(0, 0, 128, 0.7)';        // Navy - Freezing
	if (temp < 5) return 'rgba(0, 0, 205, 0.7)';        // Medium Blue - Very Cold
	if (temp < 10) return 'rgba(65, 105, 225, 0.7)';    // Royal Blue - Cold
	if (temp < 14) return 'rgba(0, 206, 209, 0.7)';     // Dark Turquoise - Cool
	if (temp < 18) return 'rgba(144, 238, 144, 0.7)';   // Light Green - Temperate
	if (temp < 22) return 'rgba(173, 255, 47, 0.7)';    // Green Yellow - Good
	if (temp < 26) return 'rgba(255, 215, 0, 0.7)';     // Gold - OPTIMAL
	if (temp < 30) return 'rgba(255, 107, 107, 0.7)';   // Coral - Tropical
	if (temp < 35) return 'rgba(139, 0, 0, 0.7)';       // Dark Red - Very Warm
	return 'rgba(75, 0, 0, 0.7)';                        // Very Dark Red - Extreme
};

export default function TemperatureGridLayer({ data, showLegend = true }) {
	const map = useMap();

	useEffect(() => {
		if (!map || !data || data.length === 0) return;

		// Create a feature group to hold all rectangles
		const featureGroup = L.featureGroup();

		// Find the grid spacing from the data
		// Assuming uniform grid spacing
		const lats = [...new Set(data.map(p => p[0]))].sort((a, b) => a - b);
		const lons = [...new Set(data.map(p => p[1]))].sort((a, b) => a - b);

		// Calculate approximate grid spacing
		const latSpacing = lats.length > 1 ? Math.abs(lats[1] - lats[0]) : 5;
		const lonSpacing = lons.length > 1 ? Math.abs(lons[1] - lons[0]) : 5;

		console.log(`Creating temperature grid with spacing: ${latSpacing}° x ${lonSpacing}°`);
		console.log(`Processing ${data.length} temperature points`);

		// Create smoother visualization using circles instead of rectangles
		data.forEach(point => {
			const [lat, lon, temp] = point;

			// Calculate radius based on grid spacing for better overlap
			// Slightly larger than grid spacing to create smooth transitions
			const radiusInDegrees = Math.max(latSpacing, lonSpacing) * 0.7;

			// Convert to meters (approximate)
			const radiusInMeters = radiusInDegrees * 111000; // 1 degree ≈ 111km

			// Create circle with temperature-based color
			const circle = L.circle([lat, lon], {
				radius: radiusInMeters,
				color: 'transparent',  // No border
				fillColor: getTemperatureColor(temp),
				fillOpacity: 0.5,  // Lower opacity for overlapping blend effect
				weight: 0,
				interactive: true,
				className: 'temperature-circle'  // For potential CSS styling
			});

			// Add popup with temperature info
			circle.bindPopup(`
				<div style="font-size: 12px;">
					<strong>Temperature: ${temp.toFixed(1)}°C</strong><br/>
					Location: ${lat.toFixed(2)}°, ${lon.toFixed(2)}°<br/>
					${temp >= 30 ? '🔥 Very Hot' :
					  temp >= 26 ? '🌴 Tropical' :
					  temp >= 22 ? '☀️ Warm' :
					  temp >= 18 ? '🌤️ Moderate' :
					  temp >= 14 ? '🌡️ Temperate' :
					  temp >= 10 ? '🌊 Cool' :
					  temp >= 5 ? '❄️ Cold' :
					  temp >= 0 ? '🧊 Very Cold' : '🏔️ Freezing'}
				</div>
			`);

			circle.addTo(featureGroup);
		});

		// Add the feature group to the map
		featureGroup.addTo(map);

		// Cleanup function
		return () => {
			map.removeLayer(featureGroup);
		};
	}, [map, data]);

	return (
		<>
			<TemperatureLegend show={showLegend} />
		</>
	);
}