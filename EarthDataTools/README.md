# EarthDataTools Paclet

Utilities for working with NASA EarthData / CMR NetCDF granules in the Wolfram Language.

## Features
- List variables inside a NetCDF granule.
- Retrieve global + per-variable attributes.
- Load variables with fill-value masking.
- Apply attribute-informed visualization scaling (including log scale hints).
- Generate palette plots and (basic) geographic bounding box metadata.
- Compute quick statistics & build variable summary datasets.
- Read previously generated manifest.json files from the downloader scripts.

## Quick Start
Install locally (developer mode):
```
PacletInstall["/absolute/path/to/wolfram-nasa-hackathon-2025/EarthDataTools"]
Needs["EarthDataTools`"]
```

List variables:
```
vars = ListNetCDFVariables[file]
```

Attributes:
```
glob = GetNetCDFGlobalAttributes[file];
vattrs = GetNetCDFVariableAttributes[file, First[vars]];
```

Load data & visualize:
```
ArrayPlot @ LoadNetCDFVariable[file, "picoeuk_moana"]
NetCDFPalettePlot[file, "picoeuk_moana"]
```

Variable summary:
```
EarthDataVariableInfo[file]
```

Manifest:
```
manifest = EarthDataManifestRead["data_cache/granules/<concept-id>/"]
```

## Exported Symbols
ListNetCDFVariables, ListNetCDFDatasets, GetNetCDFGlobalAttributes, GetNetCDFVariableAttributes, EarthDataManifestRead, LoadNetCDFVariable, EarthDataApplyScale, NetCDFPalettePlot, NetCDFGeoImage, ComputeNetCDFStats, EarthDataVariableInfo, EarthDataSelectVariables

## Notes
- The NetCDFGeoImage function currently returns an Association with an Image and bounding box instead of a true GeoImage if metadata is incomplete.
- Log scaling uses base-10; values <= 0 are clipped to a small positive threshold for visualization.

## Roadmap Ideas
- Parallel variable loading & caching.
- Automated legend with scientific units label.
- GeoImage construction using GeoPosition arrays if provided as coordinate variables.
- Additional export helpers (GeoTIFF, CloudOptimizedGeoTIFF).
