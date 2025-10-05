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
            maxVelocity: 1.0,
            velocityScale: 0.01,
            particleAge: 90,
            lineWidth: 2,
            particleMultiplier: 1/50,
            colorScale: [
                "rgb(36,104,180)",
                "rgb(60,157,194)",
                "rgb(128,205,193)",
                "rgb(151,218,168)",
                "rgb(198,231,181)",
                "rgb(238,247,217)",
                "rgb(255,238,159)",
                "rgb(252,217,125)",
                "rgb(255,182,100)",
                "rgb(252,150,75)",
                "rgb(250,112,52)",
                "rgb(245,64,32)",
                "rgb(237,45,28)",
                "rgb(220,24,32)",
                "rgb(180,0,35)"
            ],
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
