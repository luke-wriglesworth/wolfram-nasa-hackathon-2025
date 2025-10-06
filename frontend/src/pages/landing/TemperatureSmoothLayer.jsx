// TemperatureSmoothLayer - Display temperature with smooth blending
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

// TemperatureLegend component (final version)
const TemperatureLegend = ({ show }) => {
	if (!show) return null;

	return (
		<div
			aria-label="Shark habitat temperature legend"
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
				maxWidth: '90vw',
				width: '200px'
			}}
		>
			<div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#1a1a1a', fontSize: '13px' }}>
				🦈 Shark Habitat Temperature
			</div>

			<div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
				{/* Optimal */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: '#FFD700', borderRadius: '2px', border: '2px solid #FFA500' }}></div>
					<span style={{ color: '#333', fontWeight: '600' }}>22–26°C Optimal</span>
				</div>

				{/* Good */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: '#ADFF2F', borderRadius: '2px' }}></div>
					<span style={{ color: '#333' }}>18–22°C Good</span>
				</div>

				{/* Tropical Species */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: '#FF6B6B', borderRadius: '2px' }}></div>
					<span style={{ color: '#333' }}>26–30°C Tropical Species</span>
				</div>

				{/* Temperate Species */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: '#7FFF00', borderRadius: '2px' }}></div>
					<span style={{ color: '#333' }}>14–18°C Temperate Species</span>
				</div>

				{/* Cold-Water Species */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: '#00CED1', borderRadius: '2px' }}></div>
					<span style={{ color: '#333' }}>10–14°C Cold-Water Species</span>
				</div>

				{/* Cold-Adapted Species */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: '#4169E1', borderRadius: '2px' }}></div>
					<span style={{ color: '#333' }}>5–10°C Cold-Adapted Species</span>
				</div>

				{/* Limited Activity */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: '#8B0000', borderRadius: '2px' }}></div>
					<span style={{ color: '#666', fontSize: '11px' }}>30°C+ Limited Activity</span>
				</div>

				{/* Rare Sightings */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: '#0000CD', borderRadius: '2px' }}></div>
					<span style={{ color: '#666', fontSize: '11px' }}>0–5°C Rare Sightings</span>
				</div>

				{/* No Sharks */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: '#000080', borderRadius: '2px' }}></div>
					<span style={{ color: '#666', fontSize: '11px' }}>Below 0°C No Sharks</span>
				</div>
			</div>
		</div>
	);
};

// Function to get color based on temperature with better gradient
const getTemperatureColor = (temp) => {
	// More gradual color transitions
	if (temp < 0) return 'rgba(0, 0, 128, 0.6)';        // Navy - Freezing
	if (temp < 3) return 'rgba(0, 0, 180, 0.6)';        // Dark Blue
	if (temp < 5) return 'rgba(0, 0, 205, 0.6)';        // Medium Blue
	if (temp < 8) return 'rgba(30, 60, 225, 0.6)';      // Lighter Blue
	if (temp < 10) return 'rgba(65, 105, 225, 0.6)';    // Royal Blue
	if (temp < 12) return 'rgba(0, 150, 209, 0.6)';     // Turquoise Blue
	if (temp < 14) return 'rgba(0, 206, 209, 0.6)';     // Dark Turquoise
	if (temp < 16) return 'rgba(64, 224, 208, 0.6)';    // Turquoise
	if (temp < 18) return 'rgba(144, 238, 144, 0.6)';   // Light Green
	if (temp < 20) return 'rgba(152, 251, 152, 0.6)';   // Pale Green
	if (temp < 22) return 'rgba(173, 255, 47, 0.6)';    // Green Yellow
	if (temp < 24) return 'rgba(255, 215, 0, 0.6)';     // Gold
	if (temp < 26) return 'rgba(255, 165, 0, 0.6)';     // Orange
	if (temp < 28) return 'rgba(255, 140, 90, 0.6)';    // Light Coral
	if (temp < 30) return 'rgba(255, 107, 107, 0.6)';   // Coral
	if (temp < 35) return 'rgba(139, 0, 0, 0.6)';       // Dark Red
	return 'rgba(75, 0, 0, 0.6)';                        // Very Dark Red
};

export default function TemperatureSmoothLayer({ data, showLegend = true, useCircles = false }) {
	const map = useMap();

	useEffect(() => {
		if (!map || !data || data.length === 0) return;

		// Create a feature group to hold all shapes
		const featureGroup = L.featureGroup();

		// Find the grid spacing from the data
		const lats = [...new Set(data.map(p => p[0]))].sort((a, b) => a - b);
		const lons = [...new Set(data.map(p => p[1]))].sort((a, b) => a - b);

		// Calculate grid spacing
		const latSpacing = lats.length > 1 ? Math.abs(lats[1] - lats[0]) : 5;
		const lonSpacing = lons.length > 1 ? Math.abs(lons[1] - lons[0]) : 5;

		console.log(`Creating smooth temperature layer with ${data.length} points`);

		if (useCircles) {
			// Create overlapping circles for smooth blending
			data.forEach(point => {
				const [lat, lon, temp] = point;

				// Radius slightly larger than spacing for overlap
				const radiusInDegrees = Math.max(latSpacing, lonSpacing) * 0.75;
				const radiusInMeters = radiusInDegrees * 111000;

				const circle = L.circle([lat, lon], {
					radius: radiusInMeters,
					stroke: false,
					fillColor: getTemperatureColor(temp),
					fillOpacity: 0.5,
					interactive: false
				});

				circle.addTo(featureGroup);
			});
		} else {
			// Create rectangles with overlap for blending
			data.forEach(point => {
				const [lat, lon, temp] = point;

				// Make rectangles slightly larger for overlap
				const overlapFactor = 1.15;
				const bounds = [
					[lat - (latSpacing * overlapFactor)/2, lon - (lonSpacing * overlapFactor)/2],
					[lat + (latSpacing * overlapFactor)/2, lon + (lonSpacing * overlapFactor)/2]
				];

				const rect = L.rectangle(bounds, {
					stroke: false,
					fillColor: getTemperatureColor(temp),
					fillOpacity: 0.55,
					interactive: false,
					smoothFactor: 1.0
				});

				rect.addTo(featureGroup);
			});
		}

		// Add click handler for temperature info
		featureGroup.on('click', function(e) {
			const clickLat = e.latlng.lat;
			const clickLon = e.latlng.lng;

			// Find closest data point
			let closest = null;
			let minDist = Infinity;

			data.forEach(point => {
				const [lat, lon, temp] = point;
				const dist = Math.sqrt(Math.pow(lat - clickLat, 2) + Math.pow(lon - clickLon, 2));
				if (dist < minDist) {
					minDist = dist;
					closest = { lat, lon, temp };
				}
			});

			if (closest) {
				L.popup()
					.setLatLng([closest.lat, closest.lon])
					.setContent(`
						<div style="font-size: 12px;">
							<strong>Temperature: ${closest.temp.toFixed(1)}°C</strong><br/>
							Location: ${closest.lat.toFixed(2)}°, ${closest.lon.toFixed(2)}°<br/>
							${closest.temp >= 30 ? '🔥 Very Hot' :
							  closest.temp >= 26 ? '🌴 Tropical' :
							  closest.temp >= 22 ? '☀️ Warm' :
							  closest.temp >= 18 ? '🌤️ Moderate' :
							  closest.temp >= 14 ? '🌡️ Temperate' :
							  closest.temp >= 10 ? '🌊 Cool' :
							  closest.temp >= 5 ? '❄️ Cold' :
							  closest.temp >= 0 ? '🧊 Very Cold' : '🏔️ Freezing'}
						</div>
					`)
					.openOn(map);
			}
		});

		// Add the feature group to the map
		featureGroup.addTo(map);

		// Cleanup function
		return () => {
			map.removeLayer(featureGroup);
		};
	}, [map, data, useCircles]);

	return (
		<>
			<TemperatureLegend show={showLegend} />
		</>
	);
}