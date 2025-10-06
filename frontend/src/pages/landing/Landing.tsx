// Landing.jsx
import { useEffect, useRef, useState } from "react";
import {
	MapContainer,
	TileLayer,
	GeoJSON,
	Marker,
	Popup,
	useMap,
	Pane
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import sampleData from "./sample_geojson.json";
import type { GeoJsonObject } from "geojson";

const data: GeoJsonObject = {
	...sampleData,
	type: "FeatureCollection"
};
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

	const onEach = (feature, layer) => {
		const name = feature?.properties?.name ?? "Unnamed";
		layer.bindPopup(name);
	};

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
			>
				<TileLayer
					attribution='Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
					url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
				/>

				{/* Pane must exist BEFORE the label layers mount */}
				<Pane name="labels" style={{ zIndex: 650, pointerEvents: "none" }}>
					<TileLayer
						pane="labels"
						attribution="© Esri — World Boundaries & Places"
						url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
					/>
					<TileLayer
						pane="labels"
						attribution="© Esri — Ocean Reference"
						url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}"
					/>
				</Pane>

				<GeoJSON data={data} style={featureStyle} onEachFeature={onEach} />

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

				{/* Temperature smooth overlay - Sea Surface Temperature */}
				{activeLayers.has('temperature') && (
					<TemperatureSmoothLayer
						data={temperaturedata}
						showLegend={true}
						useCircles={true}  // Set to false for overlapping rectangles
						legendPosition={0}  // Top position
					/>
				)}

				{/* Phytoplankton concentration overlay */}
				{activeLayers.has('phytoplankton') && (
					<PhytoplanktonLayer
						data={phytoplanktondata}
						showLegend={true}
						useCircles={true}  // Set to false for grid rectangles
						legendPosition={1}  // Middle position
					/>
				)}

				{/* Chlorophyll-a concentration overlay */}
				{activeLayers.has('chlorophyll') && (
					<ChlorophyllLayer
						data={chlorophylldata}
						showLegend={true}
						useCircles={true}  // Set to false for grid rectangles
						legendPosition={2}  // Bottom position
					/>
				)}

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
