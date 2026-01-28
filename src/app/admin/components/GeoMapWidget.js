"use client";
import React, { useEffect, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { Tooltip as ReactTooltip } from "react-tooltip";
import 'react-tooltip/dist/react-tooltip.css';
import { getToken } from "../../../helpers/authUtils";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function GeoMapWidget() {
    const [data, setData] = useState([]);
    useEffect(() => {
        const token = getToken();
        fetch('/api/admin/analytics?type=map', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(res => {
                if (res.success && res.data.analytics.userDistribution) {
                    setData(res.data.analytics.userDistribution);
                }
            })
            .catch(err => console.error(err));
    }, []);

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
            <h3 className="text-lg font-bold text-gray-800 mb-2">User Distribution</h3>
            <div className="flex-1 w-full h-full relative overflow-hidden">
                <ComposableMap projection="geoMercator" projectionConfig={{ scale: 100 }} width={800} height={500} style={{ width: "100%" }}>
                    <ZoomableGroup>
                        <Geographies geography={geoUrl}>
                            {({ geographies }) =>
                                geographies.map((geo) => {
                                    const countryName = geo.properties.name;
                                    const countryData = data.find(d => d.id === countryName || d.id === geo.id);
                                    return (
                                        <Geography key={geo.rsmKey} geography={geo} data-tooltip-id="my-tooltip" data-tooltip-content={`${countryName}: ${countryData ? countryData.value : 0} users`} fill={countryData ? "#4f46e5" : "#D6D6DA"} stroke="#FFFFFF" strokeWidth={0.5} style={{ default: { outline: "none" }, hover: { fill: "#F53", outline: "none" }, pressed: { outline: "none" }, }} />
                                    );
                                })
                            }
                        </Geographies>
                    </ZoomableGroup>
                </ComposableMap>
                <ReactTooltip id="my-tooltip" />
            </div>
        </div>
    );
}
