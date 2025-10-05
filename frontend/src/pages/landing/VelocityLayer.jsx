// VelocityLayer.jsx
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-velocity";

export default function VelocityLayer({ data, options = {} }) {
    const map = useMap();

    useEffect(() => {
        if (!map || !data) return;

        const layer = L.velocityLayer({
            displayValues: true,
            displayOptions: {
                velocityType: "Global Wind",
                position: "bottomleft",
                emptyString: "No data",
                angleConvention: "bearingCW",
                speedUnit: "m/s",
            },
            maxVelocity: 25,
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
