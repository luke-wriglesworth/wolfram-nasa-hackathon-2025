// TemperatureHeatmapLayer - Display actual sea surface temperatures for shark habitat identification
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

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
				fontSize: '11px',
				fontFamily: 'Arial, sans-serif',
				maxWidth: '280px'
			}}
		>
			<div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#1a1a1a', fontSize: '13px' }}>
				🦈 Shark Habitat Suitability
			</div>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: '#FFD700', borderRadius: '2px', border: '2px solid #FFA500' }}></div>
					<span style={{ color: '#333', fontWeight: '600' }}>22-26°C Optimal</span>
				</div>
				<div style={{ fontSize: '10px', color: '#666', marginLeft: '28px', marginTop: '-2px' }}>
					Great White, Tiger, Bull Sharks
				</div>

				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: '#90EE90', borderRadius: '2px' }}></div>
					<span style={{ color: '#333' }}>18-22°C Good</span>
				</div>
				<div style={{ fontSize: '10px', color: '#666', marginLeft: '28px', marginTop: '-2px' }}>
					Blue, Mako, Thresher Sharks
				</div>

				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: '#FF6B6B', borderRadius: '2px' }}></div>
					<span style={{ color: '#333' }}>26-30°C Tropical</span>
				</div>
				<div style={{ fontSize: '10px', color: '#666', marginLeft: '28px', marginTop: '-2px' }}>
					Hammerhead, Reef, Nurse Sharks
				</div>

				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: '#00CED1', borderRadius: '2px' }}></div>
					<span style={{ color: '#333' }}>14-18°C Temperate</span>
				</div>
				<div style={{ fontSize: '10px', color: '#666', marginLeft: '28px', marginTop: '-2px' }}>
					Basking, Porbeagle Sharks
				</div>

				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: '#4169E1', borderRadius: '2px' }}></div>
					<span style={{ color: '#333' }}>10-14°C Cold Water</span>
				</div>
				<div style={{ fontSize: '10px', color: '#666', marginLeft: '28px', marginTop: '-2px' }}>
					Greenland, Sleeper Sharks
				</div>

				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: '#8B0000', borderRadius: '2px' }}></div>
					<span style={{ color: '#555' }}>30°C+ Too Warm</span>
				</div>

				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<div style={{ width: '20px', height: '12px', background: '#000080', borderRadius: '2px' }}></div>
					<span style={{ color: '#555' }}>Below 10°C Too Cold</span>
				</div>
			</div>
		</div>
	);
};

export default function TemperatureHeatmapLayer({ data, showLegend = true }) {
	const map = useMap();

	useEffect(() => {
		if (!map || !data) return;

		// Process temperature data - expecting [lat, lng, actualTempInCelsius]
		// We need to normalize actual temperatures to intensity values for the heatmap
		// while preserving the real temperature gradient

		// Find actual temperature range in the data
		const temps = data.map(point => point[2]);
		const minTemp = Math.min(...temps);
		const maxTemp = Math.max(...temps);

		console.log(`Temperature range in data: ${minTemp.toFixed(1)}°C to ${maxTemp.toFixed(1)}°C`);

		// Convert to heatmap format with intensity based on actual temperature
		// Using a wider range to ensure good contrast
		const tempRangeMin = -2;  // Expected minimum ocean temperature
		const tempRangeMax = 35;  // Expected maximum ocean temperature

		const heatmapData = data.map(point => {
			const temp = point[2];
			// Map temperature to 0-1 intensity
			const intensity = (temp - tempRangeMin) / (tempRangeMax - tempRangeMin);
			// Clamp to 0-1 range
			const clampedIntensity = Math.max(0, Math.min(1, intensity));
			return [point[0], point[1], clampedIntensity];
		});

		// Create gradient that maps to actual temperatures
		// Positions are normalized (0-1) mapping to tempRangeMin to tempRangeMax
		const gradient = {
			// -2°C (position 0)
			0.0: '#000080',      // Navy - Freezing
			// 5°C (position 0.189)
			0.189: '#0000CD',    // Medium Blue - Very Cold
			// 10°C (position 0.324)
			0.324: '#4169E1',    // Royal Blue - Cold Water Sharks
			// 14°C (position 0.432)
			0.432: '#00CED1',    // Dark Turquoise - Temperate Sharks
			// 18°C (position 0.540)
			0.540: '#90EE90',    // Light Green - Good Habitat
			// 22°C (position 0.648)
			0.648: '#FFD700',    // Gold - OPTIMAL START
			// 26°C (position 0.756)
			0.756: '#FFA500',    // Orange - OPTIMAL PEAK
			// 30°C (position 0.864)
			0.864: '#FF6B6B',    // Coral - Tropical Sharks
			// 35°C (position 1.0)
			1.0: '#8B0000'       // Dark Red - Too Warm
		};

		const options = {
			minOpacity: 0.5,
			maxZoom: 18,
			radius: 12,
			blur: 15,
			max: 1.0,
			gradient: gradient
		};

		const heatLayer = L.heatLayer(heatmapData, options);
		heatLayer.addTo(map);

		return () => {
			map.removeLayer(heatLayer);
		};
	}, [map, data]);

	return (
		<>
			<TemperatureLegend show={showLegend} />
		</>
	);
}