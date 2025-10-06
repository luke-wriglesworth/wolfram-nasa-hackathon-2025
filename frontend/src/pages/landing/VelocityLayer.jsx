// VelocityLayer.jsx
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-velocity";

export default function VelocityLayer({ data, options = {} }) {
    const map = useMap();
    const layerRef = useRef(null);

    useEffect(() => {
        if (!map || !data) return;

        const velocityLayer = L.velocityLayer({
            renderer: L.canvas(),
            displayValues: false,
            displayOptions: {
                velocityType: "Ocean Current",
                position: "bottomleft",
                emptyString: "No data",
                angleConvention: "bearingCW",
                speedUnit: "m/s",
            },
            maxVelocity: 2,
            velocityScale: 0.1,
            particleAge: 200,
            lineWidth: 0.9,
            particleMultiplier: 1/20,
            data,
            ...options,
        });
        layerRef.current = velocityLayer;
        velocityLayer.addTo(map);

        const handleMove = () => {
            if (layerRef.current && layerRef.current._map) {
                try {
                    layerRef.current._clearAndRestart();
                } catch (e) {
                    // Swallow transient errors if layer is in teardown
                }
            }
        };
        map.on('moveend zoomend resize', handleMove);

        return () => {
            map.off('moveend zoomend resize', handleMove);
            if (layerRef.current) {
                map.removeLayer(layerRef.current);
                layerRef.current = null;
            }
        };
    }, [map, data, options]);

    return null;
}
