// TemperatureSmoothLayer - Display temperature with smooth blending
import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

// TemperatureLegend component with dynamic stacking support
const TemperatureLegend = ({
	show,
	position = 0,          // index among visible legends
	totalLegends = 1,
	gap = 12,
	baseBottom = 20,
	explicitBottom,        // externally provided bottom offset
	explicitRight,         // externally provided right offset (for multi-column layout)
	onHeight
}) => {
	const legendRef = useRef(null);
	const [height, setHeight] = useState(null);
	const [computedBottom, setComputedBottom] = useState(baseBottom);
	const reportedRef = useRef(false);

	// Measure only once (or when show toggles from false->true)
	useEffect(() => {
		if (!show) return;
		if (legendRef.current) {
			const h = legendRef.current.offsetHeight;
			setHeight(prev => (prev == null ? h : prev));
			if (!reportedRef.current && onHeight) {
				reportedRef.current = true;
				onHeight(h);
			}
		}
	}, [show]);

		useEffect(() => {
			if (height != null && explicitBottom == null) {
				setComputedBottom(baseBottom + position * (height + gap));
			}
		}, [height, position, baseBottom, gap, explicitBottom]);

	if (!show) return null;

	const bottomVal = explicitBottom != null ? explicitBottom : computedBottom;

return (
  <div
    ref={legendRef}
    aria-label="Sea surface temperature legend (Aqua MODIS SST4)"
    style={{
      position: 'absolute',
      bottom: `${bottomVal}px`,
      right: explicitRight != null ? `${explicitRight}px` : '10px',
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      padding: '14px',
      borderRadius: '10px',
      boxShadow: '0 3px 8px rgba(0, 0, 0, 0.3)',
      zIndex: 1000 + position,
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '95vw',
      width: '270px',
      border: '1px solid #ddd',
      transition: 'bottom 0.25s ease'
    }}
  >
    {/* Header */}
    <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#1a1a1a', fontSize: '13px' }}>
      🌊 Sea Surface Temperature (SST)
    </div>

    {/* Legend bins */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {[
        { color: '#FFD700', border: '2px solid #FFA500', label: '22–26°C — Optimal', textColor: '#333', bold: true },
        { color: '#ADFF2F', label: '18–22°C — Good', textColor: '#333' },
        { color: '#FF6B6B', label: '26–30°C — Tropical species', textColor: '#333' },
        { color: '#7FFF00', label: '14–18°C — Temperate species', textColor: '#333' },
        { color: '#00CED1', label: '10–14°C — Cold-water species', textColor: '#333' },
        { color: '#4169E1', label: '5–10°C — Cold-adapted species', textColor: '#333' },
        { color: '#8B0000', label: '30°C+ — Limited activity', textColor: '#666', small: true },
        { color: '#0000CD', label: '0–5°C — Rare sightings', textColor: '#666', small: true },
        { color: '#000080', label: 'Below 0°C — No sharks', textColor: '#666', small: true }
      ].map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '22px',
              height: '12px',
              background: item.color,
              borderRadius: '2px',
              border: item.border || '1px solid #ccc'
            }}
          ></div>
          <span
            style={{
              color: item.textColor,
              fontSize: item.small ? '11px' : '11.5px',
              fontWeight: item.bold ? 600 : 400
            }}
          >
            {item.label}
          </span>
        </div>
      ))}
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
      Sea surface temperature strongly influences shark distributions.
      Warmer (22–26°C) waters favor tropical and pelagic species, while cooler zones support
      temperate and cold-adapted species. Extreme temperatures reduce activity and foraging success.
    </div>

    {/* Dataset metadata */}
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
      <strong>Dataset:</strong><br />
      <span style={{ fontSize: '10px' }}>
        <strong>Aqua MODIS SST4</strong> — Level-3 Mapped (L3m), 9 km, Daytime<br />
        Variable: <strong>sst4</strong> Units: <strong>°C</strong><br />
        Date: 2025-10-03
      </span>
    </div>

    {/* Attribution */}
    <div style={{ marginTop: '6px', fontSize: '9.5px', color: '#999', fontStyle: 'italic' }}>
      Source: NASA OceanColor (OBPG) — Near Real-Time SST4
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

export default function TemperatureSmoothLayer({
	data,
	showLegend = true,
	legendPosition = 0,
	totalLegends = 1,
	legendBottomOffset,           // external stacking position (number of px)
	legendRightOffset,            // optional horizontal shift (px from right)
	onLegendHeight                // callback with measured legend height
}) {
	const map = useMap();

	useEffect(() => {
		if (!map || !data || data.length === 0) return;

		// Create a feature group to hold all shapes
		const featureGroup = L.featureGroup();

		// Find the grid spacing from the data
		const lats = [...new Set(data.map(p => p[0]))].sort((a, b) => a - b);
		const lons = [...new Set(data.map(p => p[1]))].sort((a, b) => a - b);

		// Calculate grid spacing more robustly (use smallest positive delta)
		const latSpacing = (() => {
			if (lats.length < 2) return 5;
			const diffs = [];
			for (let i = 1; i < lats.length; i++) {
				const d = Math.abs(lats[i] - lats[i - 1]);
				if (d > 0) diffs.push(d);
			}
			return diffs.length ? Math.min(...diffs) : 5;
		})();

		const lonSpacing = (() => {
			if (lons.length < 2) return 5;
			const diffs = [];
			for (let i = 1; i < lons.length; i++) {
				const d = Math.abs(lons[i] - lons[i - 1]);
				if (d > 0) diffs.push(d);
			}
			return diffs.length ? Math.min(...diffs) : 5;
		})();

		// Force square cells by using the smaller spacing for both directions
		const cellSize = Math.min(latSpacing, lonSpacing);

		console.log(`Creating smooth temperature layer with ${data.length} points`);

		// Always use rectangles (grid mode)
		data.forEach(point => {
			const [lat, lon, temp] = point;

			// Slight overlap for visual smoothing
			const overlapFactor = 1.15;
			const bounds = [
				[lat - (cellSize * overlapFactor)/2, lon - (cellSize * overlapFactor)/2],
				[lat + (cellSize * overlapFactor)/2, lon + (cellSize * overlapFactor)/2]
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
	}, [map, data]);

	return (
		<>
			<TemperatureLegend
				show={showLegend}
				position={legendPosition}
				totalLegends={totalLegends}
				explicitBottom={typeof legendBottomOffset === 'number' ? legendBottomOffset : undefined}
				explicitRight={typeof legendRightOffset === 'number' ? legendRightOffset : undefined}
				onHeight={onLegendHeight}
			/>
		</>
	);
}