// HeatmapLayer - Show vorticity data with gradient from negative to positive
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

export default function HeatmapLayer({ data, options = {} }) {
	const map = useMap();

	useEffect(() => {
		if (!map || !data) return;

		// The vorticity data is normalized between 0 and 1
		// We interpret 0.5 as neutral, <0.5 as negative vorticity (cyclonic), >0.5 as positive (anticyclonic)

		const defaultOptions = {
			minOpacity: 0.9,
			radius: 4,
			blur: 5,
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
	}, [map, data, options]);

	return null;
}