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

        const layer = L.velocityLayer({
            displayValues: true,
            displayOptions: {
                velocityType: "Ocean Current",
                position: "bottomleft",
                emptyString: "No data",
                angleConvention: "bearingCW",
                speedUnit: "m/s",
            },
            maxVelocity: 1,
            velocityScale: 0.04,
            particleAge: 20,
            lineWidth: 0.75,
            particleMultiplier: 1/10,
            data,
            ...options,
        });

        layer.addTo(map);
        return () => {
            map.removeLayer(layer);
        };
    }, [map, data, options]);

    return null;
}
