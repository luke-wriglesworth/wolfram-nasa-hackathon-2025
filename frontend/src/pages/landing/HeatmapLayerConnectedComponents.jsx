// HeatmapLayer - Show heatmap data with configurable gradient
import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

// Legend component for shark habitat temperature
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

// Legend component for vorticity and mesoscale eddies
const VorticityLegend = ({ show }) => {
	if (!show) return null;

	return (
		<div
			aria-label="Ocean eddy detection guide"
			style={{
				position: 'absolute',
				bottom: '30px',
				right: '10px',
				backgroundColor: 'rgba(255, 255, 255, 0.98)',
				padding: '14px',
				borderRadius: '8px',
				boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
				zIndex: 1000,
				fontSize: '12px',
				fontFamily: 'Arial, sans-serif',
				maxWidth: '320px',
				border: '1px solid #ddd'
			}}
		>
			<div style={{ fontWeight: 'bold', marginBottom: '12px', color: '#1a1a1a', fontSize: '14px' }}>
				🌀 Ocean Eddy Detection
			</div>

			{/* How to use section */}
			<div style={{
				backgroundColor: '#f0f8ff',
				padding: '10px',
				borderRadius: '4px',
				border: '1px solid #b0d4ff'
			}}>
				<div style={{ fontWeight: '600', color: '#1a1a1a', fontSize: '12px', marginBottom: '8px' }}>
					How to Use:
				</div>
				<div style={{
					fontSize: '11px',
					color: '#444',
					lineHeight: '1.5'
				}}>
					<div style={{ marginBottom: '8px' }}>
						<strong style={{ color: '#d32f2f' }}>Isolated red blobs</strong> = Anticyclonic eddies<br/>
						<span style={{ color: '#666', marginLeft: '8px', fontSize: '10px' }}>
							→ Sharks prefer these (warm-core)
						</span>
					</div>

					<div style={{ marginBottom: '8px' }}>
						<strong style={{ color: '#388e3c' }}>Isolated green blobs</strong> = Cyclonic eddies<br/>
						<span style={{ color: '#666', marginLeft: '8px', fontSize: '10px' }}>
							→ Less shark activity (cold-core)
						</span>
					</div>

					<div style={{
						marginTop: '10px',
						padding: '6px',
						backgroundColor: '#fff3e0',
						borderRadius: '3px',
						fontSize: '10px',
						lineHeight: '1.4'
					}}>
						<strong>Why red is better:</strong> Anticyclonic eddies have warmer water at depth, allowing sharks to dive deeper and hunt mesopelagic prey that would normally be too cold to reach.
					</div>

					<div style={{
						marginTop: '8px',
						textAlign: 'center'
					}}>
						<a
							href="https://www.pnas.org/doi/10.1073/pnas.1903067116"
							target="_blank"
							rel="noopener noreferrer"
							style={{
								fontSize: '10px',
								color: '#1976d2',
								textDecoration: 'none',
								padding: '4px 8px',
								backgroundColor: '#e3f2fd',
								borderRadius: '3px',
								display: 'inline-block',
								border: '1px solid #90caf9',
								transition: 'all 0.2s'
							}}
							onMouseEnter={(e) => {
								e.target.style.backgroundColor = '#bbdefb';
								e.target.style.borderColor = '#64b5f6';
							}}
							onMouseLeave={(e) => {
								e.target.style.backgroundColor = '#e3f2fd';
								e.target.style.borderColor = '#90caf9';
							}}
						>
							📚 Read about mesoscale eddies and sharks
						</a>
					</div>
				</div>
			</div>
		</div>
	);
};

export default function HeatmapLayer({ data, gradient, options = {}, showLegend = false, isTemperature = false, isVorticity = false }) {
	const map = useMap();
	const [zoomLevel, setZoomLevel] = useState(map ? map.getZoom() : 5);

	// Listen to zoom changes
	useEffect(() => {
		if (!map) return;

		const handleZoom = () => {
			setZoomLevel(map.getZoom());
		};

		map.on('zoomend', handleZoom);

		return () => {
			map.off('zoomend', handleZoom);
		};
	}, [map]);

	useEffect(() => {
		if (!map || !data) return;

		// If gradient is provided, use simple heatmap (for temperature)
		// Otherwise, use dual-layer approach for vorticity
		if (gradient) {
			let processedData = data;

			// If this is temperature data, normalize from actual celsius to 0-1 for heatmap
			if (isTemperature) {
				// Temperature range: typically -2°C to 35°C for ocean temps
				const minTemp = -2;
				const maxTemp = 35;

				processedData = data.map(point => {
					const temp = point[2];
					// Normalize temperature to 0-1 range for heatmap visualization
					const normalized = (temp - minTemp) / (maxTemp - minTemp);
					const clampedValue = Math.max(0, Math.min(1, normalized));
					return [point[0], point[1], clampedValue];
				});
			}

			// Simple heatmap with custom gradient
			const defaultOptions = {
				minOpacity: 0.4,
				radius: 6,
				blur: 8,
				max: 1.0,
				gradient: gradient,
				...options,
			};

			const heatLayer = L.heatLayer(processedData, defaultOptions);
			heatLayer.addTo(map);

			return () => {
				map.removeLayer(heatLayer);
			};
		}

		// Original vorticity logic for dual layers
		// The vorticity data is normalized between 0 and 1
		// We interpret 0.5 as neutral, <0.5 as negative vorticity (cyclonic), >0.5 as positive (anticyclonic)

		// Dynamically adjust parameters based on zoom level
		// Two levels: zoomed out (≤6) and zoomed in (>6)
		const zoomParams = zoomLevel <= 5
			? { radius: 4, blur: 5, minOpacity: 0.2 }  // Zoomed out - normal view
			: { radius: 6, blur: 5, minOpacity: 0.5 }; // Zoomed in - larger radius to maintain visibility

		const defaultOptions = {
			minOpacity: zoomParams.minOpacity,
			radius: zoomParams.radius,
			blur: zoomParams.blur,
			max: 1.0,
			...options,
		};

		// Create two separate layers for negative and positive vorticity
		const layers = [];

		// Filter for negative vorticity (cyclonic - cyan/teal for visibility on ocean)
		const negativeVorticityData = data
			.filter(point => point[2] < 0.45) // Slight threshold to reduce noise
			.map(point => {
				// Intensity based on distance from 0.5
				const intensity = (0.5 - point[2]) * 2;
				return [point[0], point[1], intensity];
			});

		if (negativeVorticityData.length > 0) {
			const negativeLayer = L.heatLayer(negativeVorticityData, {
				...defaultOptions,
				gradient: {
					0.0: 'rgba(50, 255, 50, 0)',      // Transparent green
					0.2: 'rgba(100, 255, 100, 0.2)',  // Light green
					0.4: 'rgba(150, 255, 150, 0.3)',  // Pale green
					0.6: 'rgba(200, 255, 200, 0.4)',  // Very light green
					0.8: 'rgba(230, 255, 230, 0.5)',  // Almost white-green
					1.0: 'rgba(240, 255, 240, 0.7)'   // White with green tint
				}
			});
			negativeLayer.addTo(map);
			layers.push(negativeLayer);
		}

		// Filter for positive vorticity (anticyclonic - warm red/coral for contrast)
		const positiveVorticityData = data
			.filter(point => point[2] > 0.55) // Slight threshold to reduce noise
			.map(point => {
				// Intensity based on distance from 0.5
				const intensity = (point[2] - 0.5) * 2;
				return [point[0], point[1], intensity];
			});

		if (positiveVorticityData.length > 0) {
			const positiveLayer = L.heatLayer(positiveVorticityData, {
				...defaultOptions,
				gradient: {
					0.0: 'rgba(255, 100, 100, 0)',    // Transparent coral
					0.2: 'rgba(255, 120, 80, 0.2)',   // Light coral
					0.4: 'rgba(255, 100, 60, 0.3)',   // Coral
					0.6: 'rgba(255, 80, 40, 0.4)',    // Orange-red
					0.8: 'rgba(255, 60, 20, 0.5)',    // Deep orange-red
					1.0: 'rgba(220, 40, 0, 0.7)'      // Dark red-orange
				}
			});
			positiveLayer.addTo(map);
			layers.push(positiveLayer);
		}

		// Cleanup function to remove layers when component unmounts or data changes
		return () => {
			layers.forEach(layer => map.removeLayer(layer));
		};
	}, [map, data, gradient, options, isTemperature, zoomLevel]);

	return (
		<>
			{isVorticity ? (
				<VorticityLegend show={showLegend} />
			) : (
				<TemperatureLegend show={showLegend && isTemperature} />
			)}
		</>
	);
}