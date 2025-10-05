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
PackageExport[NetCDFGeoBounds]
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
NetCDFGeoBounds::usage = "NetCDFGeoBounds[file, opts] returns geographic bounds using coordinate variables (/lat,/lon etc.) when present, else geospatial_* attribute fallback. Variable data are NOT loaded. Returns Association: Lat, Lon, LatVariable, LonVariable, FromCoordinates, LatVector, LonVector, SwappedOrientation (always False).";
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
EarthDataApplyScale[data_ ? ArrayQ, attrs_Association, eps_ : 1.*^-12] := Module[
    {scaleKey, dmin, dmax, vmin, vmax, scaled = data, fill},
    scaleKey = Lookup[attrs, "display_scale"];
    dmin = Lookup[attrs, "display_min", Missing["NotAvailable"]];
    dmax = Lookup[attrs, "display_max", Missing["NotAvailable"]];
    vmin = Lookup[attrs, "valid_min", dmin];
    vmax = Lookup[attrs, "valid_max", dmax];
    fill = Lookup[attrs, "_FillValue", None];
    scaled = ArrayReshape[N[scaled], DeleteElements[Dimensions[scaled], {1}]];
    If[ NumberQ[vmin] && NumberQ[vmax] && vmin < vmax,
        scaled = Clip[N[scaled], {vmin, vmax}]
    ];
    (* If[ scaleKey === "log",
        scaled = Log[Clip[scaled, {eps, Infinity}]];
        {fill, vmin, vmax, dmin, dmax} = Map[
            Log[If[NumberQ[#] && # > 0, #, eps]] &,
            {fill, vmin, vmax, dmin, dmax}
        ];
    ]; *)
    <|
        "Data" -> scaled,
        "LogScale" -> scaleKey === "log",
        "DisplayMin" -> dmin, "DisplayMax" -> dmax,
        "ValidMin" -> vmin, "ValidMax" -> vmax,
        "FillValue" -> fill
    |>
]

(* ---- Palette Plot ---- *)
Options[NetCDFPalettePlot] = Join[
    Options[ArrayPlot],
    {"LogScale" -> Automatic, "UseDisplayRange" -> True}
]
NetCDFPalettePlot[file_ ? StringQ, var_ ? StringQ, opts : OptionsPattern[]] := Module[
    {raw, attrs, meta, logQ, range, useDisp = TrueQ @ OptionValue["UseDisplayRange"], dataRangeOpt = OptionValue["DataRange"], fill, flatValid},
    raw = LoadNetCDFVariable[file, var];
    If[FailureQ[raw], Return[Failure["LoadFailed", <|"MessageTemplate" -> "Could not load variable `1` from file `2`.", "MessageParameters" -> {var, file}|>]]];
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
    ArrayPlot[
        If[logQ, meta["Data"], raw]
        ,
        FilterRules[{opts}, Options[ArrayPlot]],
        PlotRange -> range,
        Frame -> None,
        ColorRules -> {fill -> None},
        ColorFunctionScaling -> True,
        ColorFunction -> "SolarColors"
    ]
]

(* ---- Geo Image (bounding box) ---- *)
Options[NetCDFGeoBounds] = {"LatVariable" -> Automatic, "LonVariable" -> Automatic, "FallBackToAttributes" -> True};
NetCDFGeoBounds[file_ ? StringQ, opts : OptionsPattern[]] := Module[
    {latVarOpt, lonVarOpt, latCand, lonCand, latVar, lonVar, latVec, lonVec, latMin, latMax, lonMin, lonMax, gattrs, fromCoords = False},
    latVarOpt = OptionValue["LatVariable"]; lonVarOpt = OptionValue["LonVariable"];
    latCand = If[latVarOpt === Automatic, {"/lat", "lat", "latitude", "LAT", "LATITUDE"}, {latVarOpt}];
    lonCand = If[lonVarOpt === Automatic, {"/lon", "lon", "longitude", "LON", "LONGITUDE"}, {lonVarOpt}];
    latVar = SelectFirst[latCand, NumericArrayQ @ safeImport[file, {"NetCDF", "Data", #}] &, None];
    lonVar = SelectFirst[lonCand, NumericArrayQ @ safeImport[file, {"NetCDF", "Data", #}] &, None];
    gattrs = GetNetCDFGlobalAttributes[file];
    If[latVar =!= None && lonVar =!= None,
        latVec = Normal @ safeImport[file, {"NetCDF", "Data", latVar}];
        lonVec = Normal @ safeImport[file, {"NetCDF", "Data", lonVar}];
        If[VectorQ[latVec, NumericQ] && VectorQ[lonVec, NumericQ],
            fromCoords = True;
            latMin = Min[latVec]; latMax = Max[latVec];
            lonMin = Min[lonVec]; lonMax = Max[lonVec];,
            latVar = None; lonVar = None
        ];
    ];
    If[! TrueQ[fromCoords],
        If[TrueQ[OptionValue["FallBackToAttributes"]],
            {latMin, latMax} = Lookup[gattrs, {"geospatial_lat_min", "geospatial_lat_max"}, {None, None}];
            {lonMin, lonMax} = Lookup[gattrs, {"geospatial_lon_min", "geospatial_lon_max"}, {None, None}];,
            Return[Failure["NoBounds", <|"MessageTemplate" -> "No coordinate vectors or geospatial_* attributes available."|>]]
        ]
    ];
    <|
        "Lat" -> {latMin, latMax}, "Lon" -> {lonMin, lonMax}, "LatVariable" -> latVar, "LonVariable" -> lonVar,
        "FromCoordinates" -> fromCoords, "SwappedOrientation" -> False,
        "LatVector" -> If[fromCoords, latVec, Missing["NotAvailable"]],
        "LonVector" -> If[fromCoords, lonVec, Missing["NotAvailable"]],
        "Dimensions" -> If[fromCoords, {Length[latVec], Length[lonVec]}, Missing["NotAvailable"]]
    |>
];

Options[NetCDFGeoImage] = Options[Colorize]

NetCDFGeoImage[file_ ? StringQ, var_ ? StringQ, opts : OptionsPattern[]] := Module[
    {data, attrs, scaleMeta, scaled, fill, vmin, vmax, dmin, dmax, numericVals, chosenRange, rescaled, img, bounds, bbox},
    data = LoadNetCDFVariable[file, var];
    If[FailureQ[data], Return[Failure["LoadFailed", <|"MessageTemplate" -> "Could not load variable `1` from file `2`."|>, {var, file}]]];
    attrs = GetNetCDFVariableAttributes[file, var];
    scaleMeta = EarthDataApplyScale[data, attrs];
    scaled = scaleMeta["Data"]; fill = scaleMeta["FillValue"]; vmin = scaleMeta["ValidMin"]; vmax = scaleMeta["ValidMax"]; dmin = scaleMeta["DisplayMin"]; dmax = scaleMeta["DisplayMax"]; 
    numericVals = Select[Flatten @ scaled, NumericQ[#] && (!NumberQ[fill] || # =!= fill) &];
    chosenRange = Which[
        AllTrue[{vmin, vmax}, NumberQ], {vmin, vmax},
        AllTrue[{dmin, dmax}, NumberQ], {dmin, dmax},
        Length[numericVals] > 10, Quiet @ Check[Quantile[numericVals, {0.02, 0.98}], {Min[numericVals], Max[numericVals]}],
        True, {Min[numericVals], Max[numericVals]}
    ];
    rescaled = Round @ Rescale[scaled, chosenRange, {0, 255}];
    bounds = NetCDFGeoBounds[file];
    bbox = {bounds["Lat"], bounds["Lon"]};
    If[ ! MissingQ[bounds["Dimensions"]] && Dimensions[rescaled] =!= bounds["Dimensions"],
        rescaled = Transpose[rescaled]
    ];
    img = ColorReplace[
        Colorize[rescaled, FilterRules[{opts}, Options[Colorize]], ColorFunction -> "SolarColors"],
        Black -> Transparent
    ];
    <|"Image" -> img, "BoundingBox" -> bbox, "ValueRange" -> chosenRange, "FillValue" -> fill, "LogScale" -> scaleMeta["LogScale"]|>
]

(* ---- GeoDensityPlot ---- *)
Options[NetCDFGeoDensityPlot] = Join[
    Options[GeoDensityPlot],
    {"LatVariable" -> Automatic, "LonVariable" -> Automatic, "Subsample" -> 10}
];
NetCDFGeoDensityPlot[file_ ? StringQ, var_ ? StringQ, opts : OptionsPattern[]] := Module[
    {raw, attrs, bounds, latVec, lonVec, subsample, dims},
    raw = LoadNetCDFVariable[file, var, "Return" -> "Data"];
    If[FailureQ[raw], Return[Failure["LoadFailed", <|"MessageTemplate" -> "Could not load variable `1` from file `2`.", "MessageParameters" -> {var, file}|>]]];
    attrs = GetNetCDFVariableAttributes[file, var];
    bounds = NetCDFGeoBounds[file, "LatVariable" -> OptionValue["LatVariable"], "LonVariable" -> OptionValue["LonVariable"]];
    If[FailureQ[bounds], Return[bounds]];
    If[!TrueQ[bounds["FromCoordinates"]], Return[Failure["NoCoordinates", <|"MessageTemplate" -> "No coordinate vectors available for point mode."|>]]];
    latVec = bounds["LatVector"]; lonVec = bounds["LonVector"]; 
    If[!(VectorQ[latVec, NumericQ] && VectorQ[lonVec, NumericQ]), Return[Failure["InvalidCoords", <|"MessageTemplate" -> "Coordinate vectors invalid."|>]]];
    If[TrueQ[bounds["SwappedOrientation"]], raw = Transpose[raw]];
    dims = Dimensions[raw];
    If[dims =!= {Length[latVec], Length[lonVec]}, Return[Failure["DimMismatch", <|"MessageTemplate" -> "Data dimensions do not match coordinate vector lengths after orientation adjustment."|>]]];
    subsample = Replace[OptionValue["Subsample"], Except[_Integer ? Positive] -> 10];
    GeoDensityPlot[
        GeoPosition[Tuples[{latVec[[;; ;; subsample]], lonVec[[;; ;; subsample]]}]] -> Flatten[raw[[;; ;; subsample, ;; ;; subsample]]],
        FilterRules[{opts}, Options[GeoDensityPlot]]
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
