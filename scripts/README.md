Wolfram Language Fetch Scripts
================================

This folder contains Wolfram Language (`.wl`) scripts and helper packages to programmatically search, discover, and download satellite / oceanographic datasets relevant to the shark habitat modeling exploration.

Datasets / Parameters Targeted:
- Mesoscale eddies (from sea level anomaly & geostrophic velocity fields; e.g. SWOT)
- Sea surface temperature (SST) (e.g. MODIS, GHRSST)
- Chlorophyll concentration (ocean color; MODIS / PACE / OCI)
- Phytoplankton carbon (PACE Level-3 derived products)

Core Files:
* `FetchUtils.wl` – shared utilities (CMR queries, download helpers, manifest build, token headers)
* `search_collections.wl` – discover collections (keywords/provider, pagination, optional raw body)
* `fetch_collection.wl` – generic granule fetcher by concept ID (pagination, filters, link heuristics, manifest)

Quick Start:
1. Find candidate collections (example searches for MOANA collections):

```bash
wolframscript -file search_collections.wl -keyword "MOANA" --limit 50 --pages 2 --json --save
```

Inspect the JSON output; copy a `collection` `id` (concept ID) like `C3752309934-OB_CLOUD`.

2. Download a few granules:

```bash
wolframscript -file fetch_collection.wl -concept C3752309934-OB_CLOUD --limit 20 --pages 1 --debug --save
```

3. Examine `data_cache/granules/<concept>/manifest.json`.

Authentication:

```bash
export EARTHDATA_TOKEN="<your-token>"
```

`fetch_collection.wl` Flags:
* `-concept C##########-PROVIDER` (required)
* `--shortName NAME`, `--version VER`, `--provider PROVIDER`
* `--start YYYY-MM-DD --end YYYY-MM-DD`
* `--region "{lonMin,lonMax,latMin,latMax}"`
* `--limit N`, `--pages N|ALL`
* `--filter-ext nc,zip,hdf`
* `--dump-links`
* `--introspect`
* `--force`
* `--save`
* `--debug`

`search_collections.wl` Flags:
* `-keyword STRING`, `--shortName NAME`, `--provider PROVIDER`
* `--limit N`, `--pages N|ALL`
* `--json`, `--save`, `--force`

Output Layout:

```
data_cache/
    granules/
        <CONCEPT_ID>/
            *.nc
            manifest.json
            granules_list.json
            links_dump.json
```

Manifest Schema (excerpt):

```json
{
    "schemaVersion": "1.1.0",
    "tool": "SharksFromSpaceFetcher",
    "generated": "2025-10-04T12:34:56",
    "query": { "concept": "C...", "pages": "1", "pageLimit": 20 },
    "statusSummary": { "total": 20, "withLinks": 20, "downloaded": 20 },
    "downloads": [ { "file": "/abs/path/file.nc", "size": 123456, "md5": "..." } ],
    "entries": [ { "id": "G...", "title": "..." } ]
}
```
If `--introspect` is used, each download with a netCDF gets `"variables"`.

Troubleshooting:
| Symptom | Hint |
| ------- | ---- |
| No downloads | Use `--debug`; inspect skip reasons. |
| Auth warnings | Set `EARTHDATA_TOKEN`. |
| Small manifest | Update scripts (old fallback stub). |
| Empty variables | Non-netCDF or import failed. |

Planned Enhancements:
* Parallel + retry/backoff
* SHA256 checksum validation
* S3 temporary credential flow
* Eddy detection pipeline
* Tests for argument parsing & manifest integrity

