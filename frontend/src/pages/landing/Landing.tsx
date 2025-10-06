// Landing.jsx
import { useEffect, useRef, useState } from "react";
import {
	MapContainer,
	TileLayer,
	Marker,
	Popup,
	useMap,
	Pane
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Removed demo GeoJSON layer and associated styling/onEach logic
import VelocityLayer from "./VelocityLayer";
import HeatmapLayerConnectedComponents from "./HeatmapLayerConnectedComponents";
import TemperatureSmoothLayer from "./TemperatureSmoothLayer";
import PhytoplanktonLayer from "./PhytoplanktonLayer";
import ChlorophyllLayer from "./ChlorophyllLayer";
import velocitydata from "./ocean_velocity.json"; // Example velocity data
import vorticitydata from "./vorticity_data.json"; // Vorticity heatmap data
import temperaturedata from "./temperature_data.json"; // Temperature heatmap data
import phytoplanktondata from "./phytoplankton_data.json"; // Phytoplankton concentration data
import chlorophylldata from "./chlorophyll_data.json"; // Chlorophyll-a concentration data

/** Imperatively fly the map when target changes */
function FlyTo({ target, zoom = 13 }) {
	const map = useMap();
	useEffect(() => {
		if (!target) return;
		const { lat, lng } = target;
		if (Number.isFinite(lat) && Number.isFinite(lng)) {
			map.flyTo([lat, lng], zoom, { duration: 0.8 });
		}
	}, [map, target, zoom]);
	return null;
}

export default function Landing() {
	const [coords, setCoords] = useState({ lat: "", lng: "" });
	const [target, setTarget] = useState(null);
	const [velocity, setVelocity] = useState(null);       // loaded velocity data
	const [activeLayers, setActiveLayers] = useState(new Set(['velocity'])); // Set of active layers for multi-selection
	const [legendHeights, setLegendHeights] = useState<Record<string, number>>({}); // Store actual legend heights
	const markerRef = useRef(null);

	// Load velocity data from /public/velocity.json (GRIB-like U/V format)
	useEffect(() => {
		// Simulate async loading
		const loadData = async () => {
			// In real app, fetch from server:
			// const res = await fetch('/velocity.json');
			// const json = await res.json();

			// velocitydata is an array, but leaflet-velocity needs it directly
			const json = velocitydata;
			setVelocity(json);
		};
		loadData();
	}, []);

	const featureStyle = () => ({
		weight: 1,
		color: "#3388ff",
		fillOpacity: 0.2,
	});

	const parse = (v) => Number.parseFloat(String(v).trim());
	const withinRange = (lat, lng) =>
		lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

	const handleSubmit = (e) => {
		e.preventDefault();
		const lat = parse(coords.lat);
		const lng = parse(coords.lng);
		if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
			alert("Enter numeric coordinates.");
			return;
		}
		if (!withinRange(lat, lng)) {
			alert("Latitude ∈ [-90,90], Longitude ∈ [-180,180].");
			return;
		}
		setTarget({ lat, lng });
	};

	// Auto-open popup after flying
	useEffect(() => {
		if (markerRef.current) {
			const t = setTimeout(() => markerRef.current?.openPopup(), 850);
			return () => clearTimeout(t);
		}
	}, [target]);

	const velocityReady = Boolean(velocity);

	const mapRef = useRef(null);

	useEffect(() => {
		const map = mapRef.current;
		if (!map) return;

		// Create a top pane for labels
		map.createPane("labels");
		const pane = map.getPane("labels");
		if (pane) {
			pane.style.zIndex = 650;
			pane.style.pointerEvents = "none";
		}
	}, []);

	// Enforce staying within a single world (no infinite horizontal wrap)
	useEffect(() => {
		const map: any = mapRef.current;
		if (!map) return;
		const bounds = L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180));
		map.setMaxBounds(bounds);
		const c = map.getCenter();
		const clampedLat = Math.max(-90, Math.min(90, c.lat));
		let lon = c.lng;
		if (lon < -180 || lon > 180) {
			lon = ((((lon + 180) % 360) + 360) % 360) - 180;
		}
		if (clampedLat !== c.lat || lon !== c.lng) {
			map.setView([clampedLat, lon], map.getZoom(), { animate: false });
		}
	}, []);

	return (
		<div className="flex flex-col h-screen">
			{/* Navbar */}
			<nav className="h-14 bg-gray-900 text-white flex items-center justify-between px-6 shadow-md">
				<span className="text-lg font-semibold tracking-wide">
					Wolfram&nbsp;-&nbsp; 🦈 SharksFromSpace
				</span>

				<div className="flex items-center gap-2">
					{/* Layer Selection Buttons */}
					<span className="text-sm text-gray-600 mr-2">Layers:</span>


					{/* Ocean Current Button */}
					<button
						type="button"
						onClick={() => {
							const newLayers = new Set(activeLayers);
							if (newLayers.has('velocity')) {
								newLayers.delete('velocity');
							} else {
								newLayers.add('velocity');
								// Remove eddies when adding velocity (mutually exclusive)
								newLayers.delete('eddies');
							}
							setActiveLayers(newLayers);
						}}
						disabled={!velocityReady}
						aria-pressed={activeLayers.has('velocity')}
						aria-label="Show ocean current layer"
						className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200
							${activeLayers.has('velocity')
								? 'bg-blue-600 text-white shadow-md'
								: velocityReady
									? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
									: 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
					>
						Ocean Current
					</button>

					{/* Mesoscale Eddies Button */}
					<button
						type="button"
						onClick={() => {
							const newLayers = new Set(activeLayers);
							if (newLayers.has('eddies')) {
								newLayers.delete('eddies');
							} else {
								newLayers.add('eddies');
								// Remove velocity when adding eddies (mutually exclusive)
								newLayers.delete('velocity');
							}
							setActiveLayers(newLayers);
						}}
						aria-pressed={activeLayers.has('eddies')}
						aria-label="Show mesoscale eddies layer"
						className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200
							${activeLayers.has('eddies')
								? 'bg-purple-600 text-white shadow-md'
								: 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
					>
						Mesoscale Eddies
					</button>

					{/* Temperature Button */}
					<button
						type="button"
						onClick={() => {
							const newLayers = new Set(activeLayers);
							if (newLayers.has('temperature')) {
								newLayers.delete('temperature');
							} else {
								newLayers.add('temperature');
							}
							setActiveLayers(newLayers);
						}}
						aria-pressed={activeLayers.has('temperature')}
						aria-label="Show temperature layer"
						className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200
							${activeLayers.has('temperature')
								? 'bg-orange-600 text-white shadow-md'
								: 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
					>
						Temperature
					</button>

					{/* Phytoplankton Button */}
					<button
						type="button"
						onClick={() => {
							const newLayers = new Set(activeLayers);
							if (newLayers.has('phytoplankton')) {
								newLayers.delete('phytoplankton');
							} else {
								newLayers.add('phytoplankton');
							}
							setActiveLayers(newLayers);
						}}
						aria-pressed={activeLayers.has('phytoplankton')}
						aria-label="Show phytoplankton layer"
						className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200
							${activeLayers.has('phytoplankton')
								? 'bg-green-600 text-white shadow-md'
								: 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
					>
						Phytoplankton
					</button>

					{/* Chlorophyll Button */}
					<button
						type="button"
						onClick={() => {
							const newLayers = new Set(activeLayers);
							if (newLayers.has('chlorophyll')) {
								newLayers.delete('chlorophyll');
							} else {
								newLayers.add('chlorophyll');
							}
							setActiveLayers(newLayers);
						}}
						aria-pressed={activeLayers.has('chlorophyll')}
						aria-label="Show chlorophyll layer"
						className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200
							${activeLayers.has('chlorophyll')
								? 'bg-teal-600 text-white shadow-md'
								: 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
					>
						Chlorophyll
					</button>

					{/* Coordinate Input Box */}
					<form
						onSubmit={handleSubmit}
						className="flex items-center gap-2 bg-white p-2 rounded-md shadow-md"
					>
						<input
							type="text"
							inputMode="decimal"
							placeholder="Latitude"
							value={coords.lat}
							onChange={(e) => setCoords((c) => ({ ...c, lat: e.target.value }))}
							className="w-28 px-2 py-1 text-sm text-gray-800 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<input
							type="text"
							inputMode="decimal"
							placeholder="Longitude"
							value={coords.lng}
							onChange={(e) => setCoords((c) => ({ ...c, lng: e.target.value }))}
							className="w-28 px-2 py-1 text-sm text-gray-800 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
						<button
							type="submit"
							className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium"
						>
							Go
						</button>
					</form>
				</div>
			</nav>

			{/* Map */}
			<MapContainer
				ref={mapRef}
				center={[10, 0]}
				zoom={4}
				scrollWheelZoom
				className="flex-1 w-full"
				renderer={L.canvas()}
				worldCopyJump={false}
				maxBounds={[[-90, -180], [90, 180]]}
				maxBoundsViscosity={1.0}
			>
				<TileLayer
					attribution='Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
					url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
					noWrap
				/>

				{/* Pane must exist BEFORE the label layers mount */}
				<Pane name="labels" style={{ zIndex: 650, pointerEvents: "none" }}>
					<TileLayer
						pane="labels"
						attribution="© Esri — World Boundaries & Places"
						url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
						noWrap
					/>
					<TileLayer
						pane="labels"
						attribution="© Esri — Ocean Reference"
						url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}"
						noWrap
					/>
				</Pane>


				{/* Ocean Current overlay - shown when velocity OR eddies is active */}
				{velocityReady && (activeLayers.has('velocity') || activeLayers.has('eddies')) && <VelocityLayer data={velocity} />}

				{/* Mesoscale eddies (vorticity) heatmap overlay */}
				{activeLayers.has('eddies') && (
					<HeatmapLayerConnectedComponents
						data={vorticitydata}
						showLegend={true}
						isVorticity={true}
					/>
				)}

				{/* Calculate dynamic legend positions based on active layers */}
				{(() => {
					// Collect active legends in display order (existing order determines vertical stacking baseline)
					const order: { key: string; defaultHeight: number }[] = [];
					if (activeLayers.has('chlorophyll')) order.push({ key: 'chlorophyll', defaultHeight: legendHeights.chlorophyll || 320 });
					if (activeLayers.has('phytoplankton')) order.push({ key: 'phytoplankton', defaultHeight: legendHeights.phytoplankton || 360 });
					if (activeLayers.has('temperature')) order.push({ key: 'temperature', defaultHeight: legendHeights.temperature || 260 });

					// Base vertical stacking (single column assumption)
					const bottomOffsets: Record<string, number> = {};
					let cumulative = 30;
					for (const item of order) {
						bottomOffsets[item.key] = cumulative;
						cumulative += item.defaultHeight + 20;
					}

					// Horizontal multi-column logic: if exactly 3 legends visible, make the third appear to the left of the first.
					const rightOffsets: Record<string, number | undefined> = {};
					if (order.length === 3) {
						// Strategy: Keep first two in right column (right=10). Move third to left by setting a larger right offset (~310px) so it appears left.
						// Determine approximate legend width (use chlorophyll width 270px + margin 30px)
						const horizontalShift = 270 + 30; // 300px
						// The third legend is the last in 'order'
						const third = order[2].key;
						// Move third left of the first: increase right offset
						rightOffsets[third] = 10 + horizontalShift; // e.g., 310px from right
						// Optionally align its vertical position with the first legend instead of stacked below; requirement only specifies horizontal move.
						bottomOffsets[third] = bottomOffsets[order[0].key];
					}

					return (
						<>
							{activeLayers.has('temperature') && (
								<TemperatureSmoothLayer
									data={temperaturedata}
									showLegend={true}
									legendBottomOffset={bottomOffsets.temperature}
									legendRightOffset={rightOffsets.temperature}
									onLegendHeight={(height: number) => {
										if (!legendHeights.temperature) {
											setLegendHeights(prev => ({ ...prev, temperature: height }));
										}
									}}
								/>
							)}

							{activeLayers.has('phytoplankton') && (
								<PhytoplanktonLayer
									data={phytoplanktondata}
									showLegend={true}
									legendBottomOffset={bottomOffsets.phytoplankton}
									legendRightOffset={rightOffsets.phytoplankton}
									onLegendHeight={(height: number) => {
										if (!legendHeights.phytoplankton) {
											setLegendHeights(prev => ({ ...prev, phytoplankton: height }));
										}
									}}
								/>
							)}

							{activeLayers.has('chlorophyll') && (
								<ChlorophyllLayer
									data={chlorophylldata}
									showLegend={true}
									legendBottomOffset={bottomOffsets.chlorophyll}
									legendRightOffset={rightOffsets.chlorophyll}
									onLegendHeight={(height: number) => {
										if (!legendHeights.chlorophyll) {
											setLegendHeights(prev => ({ ...prev, chlorophyll: height }));
										}
									}}
								/>
							)}
						</>
					);
				})()}

				{/* Fly & Mark target */}
				<FlyTo target={target} zoom={13} />
				{target && (
					<Marker position={[target.lat, target.lng]} ref={markerRef}>
						<Popup>
							<div className="text-sm">
								<strong>Pointed Location</strong>
								<br />
								Lat: {target.lat.toFixed(5)}, Lng: {target.lng.toFixed(5)}
							</div>
						</Popup>
					</Marker>
				)}
			</MapContainer>
		</div>
	);
}
