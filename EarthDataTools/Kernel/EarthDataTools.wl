(* ::Package:: *)

Package["EarthDataTools`"]

(* ========== Package Exports ========== *)
PackageExport[ListNetCDFVariables]
PackageExport[ListNetCDFDatasets]
PackageExport[GetNetCDFGlobalAttributes]
PackageExport[GetNetCDFVariableAttributes]
PackageExport[EarthDataManifestRead]
PackageExport[LoadNetCDFVariable]
PackageExport[EarthDataApplyScale]
PackageExport[NetCDFPalettePlot]
PackageExport[NetCDFGeoImage]
PackageExport[NetCDFGeoDensityPlot]
PackageExport[ComputeNetCDFStats]
PackageExport[EarthDataVariableInfo]
PackageExport[EarthDataSelectVariables]


Scan[ClearAll, Names["EarthDataTools`*"]]

(* ---- Usage Messages ---- *)
ListNetCDFVariables::usage = "ListNetCDFVariables[file] returns dataset variable names present in a NetCDF file (excluding coordinate / dimension helper entries when possible).";
ListNetCDFDatasets::usage = "Alias of ListNetCDFVariables.";
GetNetCDFGlobalAttributes::usage = "GetNetCDFGlobalAttributes[file] returns an Association of global NetCDF attributes.";
GetNetCDFVariableAttributes::usage = "GetNetCDFVariableAttributes[file, var] returns an Association of attributes for variable var in the specified NetCDF file.";
EarthDataManifestRead::usage = "EarthDataManifestRead[path] imports a manifest.json (given a directory or file) returning a sanitized Association.";
LoadNetCDFVariable::usage = "LoadNetCDFVariable[file, var, opts] loads a variable's numeric data applying fill value masking and optional scaling; returns an array, Dataset or Association depending on Return option.";
EarthDataApplyScale::usage = "EarthDataApplyScale[data, attrs] transforms data for visualization per attribute hints (e.g. log scaling) without altering the original numeric meaning.";
NetCDFPalettePlot::usage = "NetCDFPalettePlot[file, var, opts] produces an ArrayPlot styled visualization using display_min / display_max or robust quantiles and optional log scaling.";
NetCDFGeoImage::usage = "NetCDFGeoImage[file, var] attempts to wrap a variable image with geographic bounding box metadata from global attributes (geospatial_*). Returns an Association.";
NetCDFGeoDensityPlot::usage = "NetCDFGeoDensityPlot[file, var, opts] produces a GeoDensityPlot strictly in point mode using /lat and /lon (or specified) coordinate variables. Options: LatVariable, LonVariable, MaxPoints, Return -> Plot|Association|Rules.";
ComputeNetCDFStats::usage = "ComputeNetCDFStats[file, var] returns basic statistics (Min, Max, Mean, StandardDeviation, ValidCount) after masking fill values.";
EarthDataVariableInfo::usage = "EarthDataVariableInfo[file, opts] returns a Dataset summarizing variables (dimensions, ranges, units, scaling).";
EarthDataSelectVariables::usage = "EarthDataSelectVariables[file, patt] selects variable names matching string/regex pattern patt.";


withFileExists[file_, expr_] := If[! FileExistsQ[file], Message[withFileExists::nofile, file]; Throw[$Failed, $tag], expr]
withFileExists::nofile = "File `1` was not found."

safeImport[file_, spec_] := Quiet @ Check[Import[file, spec], $Failed]

toAssoc[x_] := Which[
    AssociationQ[x], x,
    MatchQ[x, {(_Rule | _RuleDelayed) ..}], Association @ Normal @ x,
    True, <||>
]

(* ---- Variable Listing ---- *)
ListNetCDFVariables[file_ ? StringQ] := Module[{dsets},
    dsets = safeImport[file, "NetCDF"];
    If[dsets === $Failed || dsets === Null, {}, DeleteDuplicates @ Select[dsets, StringQ]]
]
ListNetCDFDatasets = ListNetCDFVariables

(* ---- Attributes ---- *)
GetNetCDFGlobalAttributes[file_ ? StringQ] := Module[{raw = safeImport[file, {"NetCDF", "Attributes"}]}, toAssoc @ raw]

GetNetCDFVariableAttributes[file_ ? StringQ, var_ ? StringQ] := Module[{raw},
    raw = safeImport[file, {"NetCDF", "Attributes", var}];
    toAssoc @ raw
]

(* ---- Manifest Reader ---- *)
EarthDataManifestRead[path_ ? StringQ] := Module[{file, raw},
    file = If[DirectoryQ[path], FileNameJoin[{path, "manifest.json"}], path];
    If[! FileExistsQ[file], Return[$Failed]];
    raw = Quiet @ Check[Import[file, "RawJSON"], $Failed];
    If[raw === $Failed, Quiet @ Check[Import[file, "JSON"], $Failed], raw]
]

(* ---- Load Variable ---- *)
Options[LoadNetCDFVariable] = {"Return" -> "Data", "ApplyFillValue" -> False}
(* ApplyFillValue retained for backward compatibility but ignored: fill values are no longer converted to Missing *)
LoadNetCDFVariable[file_ ? StringQ, var_ ? StringQ, opts : OptionsPattern[]] := Module[
    {data, attrs, fill, ret = OptionValue["Return"]},
    data = safeImport[file, {"NetCDF", "Data", var}];
    If[! NumericArrayQ[data], Return[$Failed]];
    data = Normal @ data;
    attrs = GetNetCDFVariableAttributes[file, var];
    fill = Lookup[attrs, "_FillValue", None];
    (* No substitution of fill sentinel; raw values preserved *)
    Switch[ret,
        "Data", data,
        "Association", <|"Data" -> data, "Attributes" -> attrs, "FillValue" -> fill|>,
        "Dataset", Dataset @ <|"Variable" -> var, "Data" -> data, "Attributes" -> attrs, "FillValue" -> fill|>,
        _, data
    ]
]

(* ---- Scaling Helper ---- *)
EarthDataApplyScale[data_ ? ArrayQ, attrs_Association] := Module[
    {scaleType, dmin, dmax, scaled = data, fill},
    scaleType = ToLowerCase @ ToString @ Lookup[attrs, "display_scale_type", Lookup[attrs, "scale_type", ""]];
    dmin = Lookup[attrs, "display_min", None];
    dmax = Lookup[attrs, "display_max", None];
    fill = Lookup[attrs, "_FillValue", None];
    Which[
        StringStartsQ[scaleType, "log"],
            scaled = Map[
                If[NumberQ[fill] && # === fill, fill, Log10 @ Clip[#, {10.^-12, Infinity}]] &,
                scaled,
                {Depth[scaled] - 1}
            ],
        True, Null
    ];
    <|"Data" -> scaled, "DisplayMin" -> dmin, "DisplayMax" -> dmax, "LogScale" -> StringStartsQ[scaleType, "log"], "FillValue" -> fill|>
]

(* ---- Palette Plot ---- *)
Options[NetCDFPalettePlot] = {ColorFunction -> "SolarColors", "LogScale" -> Automatic, "UseDisplayRange" -> True, PlotLegends -> Automatic, "DataRange" -> Automatic}
NetCDFPalettePlot[file_ ? StringQ, var_ ? StringQ, opts : OptionsPattern[]] := Module[
    {raw, attrs, meta, logQ, range, useDisp = TrueQ @ OptionValue["UseDisplayRange"], cf = OptionValue[ColorFunction], legend = OptionValue[PlotLegends], dataRangeOpt = OptionValue["DataRange"], fill, flatValid},
    raw = LoadNetCDFVariable[file, var, "Return" -> "Data"];
    If[raw === $Failed, Return[$Failed]];
    attrs = GetNetCDFVariableAttributes[file, var];
    fill = Lookup[attrs, "_FillValue", None];
    meta = EarthDataApplyScale[raw, attrs];
    logQ = Replace[OptionValue["LogScale"], Automatic :> Lookup[meta, "LogScale", False]];
    flatValid = Select[Flatten @ raw, If[NumberQ[fill], # =!= fill, True] &];
    range = Which[
        useDisp && AllTrue[Lookup[meta, {"DisplayMin", "DisplayMax"}], NumberQ], Lookup[meta, {"DisplayMin", "DisplayMax"}],
        NumberQ[dataRangeOpt], {0, dataRangeOpt},
        MatchQ[dataRangeOpt, {_ ? NumberQ, _ ? NumberQ}], dataRangeOpt,
        Length[flatValid] > 10, Quiet @ Check[Quantile[flatValid, {0.02, 0.98}], {Min[flatValid], Max[flatValid]}],
        True, {Min[flatValid], Max[flatValid]}
    ];
    ArrayPlot[If[logQ, meta["Data"], raw], ColorFunction -> cf, PlotRange -> range, ColorFunctionScaling -> True,
        PlotLegends -> legend /. Automatic :> (If[legend === Automatic, BarLegend[{cf, range}, LabelStyle -> Directive[FontSize -> 10]], None])]
]

(* ---- Geo Image (bounding box) ---- *)
NetCDFGeoImage[file_ ? StringQ, var_ ? StringQ] := Module[
    {gattrs, raw, latMin, latMax, lonMin, lonMax, img, bbox},
    gattrs = GetNetCDFGlobalAttributes[file];
    raw = LoadNetCDFVariable[file, var, "Return" -> "Data"];
    If[raw === $Failed, Return[$Failed]];
    {latMin, latMax} = Lookup[gattrs, {"geospatial_lat_min", "geospatial_lat_max"}, {None, None}];
    {lonMin, lonMax} = Lookup[gattrs, {"geospatial_lon_min", "geospatial_lon_max"}, {None, None}];
    img = NetCDFPalettePlot[file, var, PlotLegends -> None];
    bbox = {{latMin, lonMin}, {latMax, lonMax}};
    <|"Image" -> img, "BoundingBox" -> bbox, "HasGeoBounds" -> AllTrue[Flatten[bbox], NumberQ]|>
]

(* ---- GeoDensityPlot ---- *)
Options[NetCDFGeoDensityPlot] = Join[
    Options[GeoDensityPlot],
    {
        PlotLegends -> Automatic, "Return" -> "Plot", 
        "LatVariable" -> Automatic, "LonVariable" -> Automatic, "MaxPoints" -> Infinity
    }
]
NetCDFGeoDensityPlot[file_ ? StringQ, var_ ? StringQ, opts : OptionsPattern[]] := Module[
    {raw, attrs, fill, latVarOpt, lonVarOpt, latVar, lonVar, latCand, lonCand, latVec, lonVec, dims, nLat, nLon, maxPoints, total,
    strideLat, strideLon, latIdx, lonIdx, sampled = False, rules, ret},
    raw = LoadNetCDFVariable[file, var, "Return" -> "Data"];
    If[raw === $Failed, Return[$Failed]];
    attrs = GetNetCDFVariableAttributes[file, var];
    fill = Lookup[attrs, "_FillValue", None];
    (* Coordinate variable resolution *)
    latVarOpt = OptionValue["LatVariable"]; lonVarOpt = OptionValue["LonVariable"];
    latCand = If[latVarOpt === Automatic, {"/lat", "lat", "latitude", "LAT", "LATITUDE"}, {latVarOpt}];
    lonCand = If[lonVarOpt === Automatic, {"/lon", "lon", "longitude", "LON", "LONGITUDE"}, {lonVarOpt}];
    latVar = SelectFirst[latCand, NumericArrayQ @ safeImport[file, {"NetCDF", "Data", #}] &, None];
    lonVar = SelectFirst[lonCand, NumericArrayQ @ safeImport[file, {"NetCDF", "Data", #}] &, None];
    If[latVar === None || lonVar === None, Return[$Failed]];
    latVec = Normal @ safeImport[file, {"NetCDF", "Data", latVar}];
    lonVec = Normal @ safeImport[file, {"NetCDF", "Data", lonVar}];
    If[!(VectorQ[latVec, NumericQ] && VectorQ[lonVec, NumericQ]), Return[$Failed]];
    dims = Dimensions[raw];
    Which[
        dims === {Length[latVec], Length[lonVec]}, Null,
        dims === {Length[lonVec], Length[latVec]}, raw = Transpose[raw]; {latVec, lonVec} = {lonVec, latVec},
        True, Null
    ];
    {nLat, nLon} = Dimensions[raw];
    maxPoints = OptionValue["MaxPoints"];
    total = nLat * nLon;
    If[ IntegerQ[maxPoints] && maxPoints > 0 && total > maxPoints,
        strideLat = Ceiling[nLat / Sqrt[maxPoints]];
        strideLon = Ceiling[nLon / Sqrt[maxPoints]];
        latIdx = Range[1, nLat, strideLat];
        lonIdx = Range[1, nLon, strideLon];
        sampled = True,
        latIdx = Range[nLat]; lonIdx = Range[nLon]
    ];

    rules = GeoPosition[Tuples[{latVec, lonVec}]] -> Flatten[raw];
    ret = OptionValue["Return"];

    Which[
        ret === "Rules", rules,
        ret === "Association", <|
            "Rules" -> rules,
            "Bounds" -> <|"Lat" -> {Min[latVec], Max[latVec]}, "Lon" -> {Min[lonVec], Max[lonVec]}|>,
            "LatVariable" -> latVar,
            "LonVariable" -> lonVar,
            "Sampled" -> sampled,
            "PointCount" -> Length[rules],
            "FillValue" -> fill,
            "VariableAttributes" -> attrs
        |>,
        True, GeoDensityPlot[
            rules,
            FilterRules[{opts}, Options[GeoDensityPlot]]
        ]
    ]
]

(* ---- Statistics ---- *)
ComputeNetCDFStats[file_ ? StringQ, var_ ? StringQ] := Module[
    {data, flat, attrs, fill, valid},
    data = LoadNetCDFVariable[file, var, "Return" -> "Data"];
    If[data === $Failed, Return[$Failed]];
    attrs = GetNetCDFVariableAttributes[file, var];
    fill = Lookup[attrs, "_FillValue", None];
    flat = Flatten @ data;
    valid = Select[flat, NumericQ[#] && If[NumberQ[fill], # =!= fill, True] &];
    <|
        "Min" -> Quiet @ Check[Min[valid], Missing["NotAvailable"]],
        "Max" -> Quiet @ Check[Max[valid], Missing["NotAvailable"]],
        "Mean" -> Quiet @ Check[Mean[valid], Missing["NotAvailable"]],
        "StandardDeviation" -> Quiet @ Check[StandardDeviation[valid], Missing["NotAvailable"]],
        "ValidCount" -> Length[valid],
        "FillValue" -> fill
    |>
]

(* ---- Variable Info Summary ---- *)
Options[EarthDataVariableInfo] = {"SampleFraction" -> 0.02}
EarthDataVariableInfo[file_ ? StringQ, opts : OptionsPattern[]] := Module[
    {vars, fr = OptionValue["SampleFraction"], rows},
    vars = ListNetCDFVariables[file];
    rows = Table[
        Module[{data, attrs, dims, flat, samp, stats, logQ},
            data = LoadNetCDFVariable[file, v, "Return" -> "Data"];
            attrs = GetNetCDFVariableAttributes[file, v];
            dims = If[ArrayQ[data], Dimensions[data], Missing["NotArray"]];
            flat = If[ArrayQ[data], Flatten[data], {}];
            samp = If[ArrayQ[data], RandomSample[flat, UpTo[Ceiling[Length[flat] fr]]], {}];
            stats = Quiet @ Check[{Min[samp], Max[samp]}, {Missing["NA"], Missing["NA"]}];
            logQ = StringStartsQ[ToLowerCase @ ToString @ Lookup[attrs, "display_scale_type", ""], "log"];
            <|
                "Variable" -> v,
                "Dimensions" -> dims,
                "SampleMin" -> First[stats],
                "SampleMax" -> Last[stats],
                "DisplayMin" -> Lookup[attrs, "display_min", Missing["NA"]],
                "DisplayMax" -> Lookup[attrs, "display_max", Missing["NA"]],
                "Units" -> Lookup[attrs, "units", Lookup[attrs, "Units", Missing["NA"]]],
                "LogScale" -> logQ
            |>
        ],
        {v, vars}
    ];
    Dataset @ rows
]

(* ---- Variable selection ---- *)
EarthDataSelectVariables[file_ ? StringQ, patt_] := Select[ListNetCDFVariables[file], StringMatchQ[#, patt] &]
