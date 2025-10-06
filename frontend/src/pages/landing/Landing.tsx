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
import data from "./sample_geojson.json";
import VelocityLayer from "./VelocityLayer";
import HeatmapLayerConnectedComponents from "./HeatmapLayerConnectedComponents";
import velocitydata from "./ocean_velocity.json"; // Example velocity data
import vorticitydata from "./vorticity_data.json"; // Vorticity heatmap data

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
	const [showVelocity, setShowVelocity] = useState(true); // toggle state
	const [showVorticity, setShowVorticity] = useState(false); // vorticity toggle
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

				<div className="flex items-center gap-4">
					{/* Velocity Toggle */}
					<label className={`flex items-center gap-2 ${velocityReady ? "" : "opacity-50"}`}>
						<span className="text-sm">Velocity</span>
						<button
							type="button"
							onClick={() => velocityReady && setShowVelocity((s) => !s)}
							aria-pressed={showVelocity}
							aria-label="Toggle velocity layer"
							disabled={!velocityReady}
							className={`relative inline-flex h-6 w-11 items-center rounded-full transition
                ${showVelocity ? "bg-blue-600" : "bg-gray-500"}
                ${velocityReady ? "cursor-pointer" : "cursor-not-allowed"}`}
						>
							<span
								className={`inline-block h-5 w-5 transform rounded-full bg-white transition
                  ${showVelocity ? "translate-x-6" : "translate-x-1"}`}
							/>
						</button>
					</label>

					{/* Vorticity Toggle */}
					<label className="flex items-center gap-2">
						<span className="text-sm">Vorticity</span>
						<button
							type="button"
							onClick={() => setShowVorticity((s) => !s)}
							aria-pressed={showVorticity}
							aria-label="Toggle vorticity layer"
							className={`relative inline-flex h-6 w-11 items-center rounded-full transition cursor-pointer
                ${showVorticity ? "bg-purple-600" : "bg-gray-500"}`}
						>
							<span
								className={`inline-block h-5 w-5 transform rounded-full bg-white transition
                  ${showVorticity ? "translate-x-6" : "translate-x-1"}`}
							/>
						</button>
					</label>

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

				{/* Velocity overlay (respect toggle; only renders after data loads) */}
				{velocityReady && showVelocity && <VelocityLayer data={velocity} />}

				{/* Vorticity heatmap overlay */}
				{showVorticity && (
					<HeatmapLayerConnectedComponents
						data={vorticitydata}
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
