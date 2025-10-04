#!/usr/bin/env wolframscript
(* ::Title:: Generic Collection Granule Downloader *)
(* Usage:
   wolframscript -file scripts/fetch_collection.wl -concept C##########-PROVIDER \
     [-start YYYY-MM-DD -end YYYY-MM-DD] \
     [-region "{lonMin,lonMax,latMin,latMax}"] \
     [--limit N] [--pages P|ALL] [--force] [--debug] [--shortName NAME] \
     [--version VER] [--provider PROVIDER] [--save] [--dump-links] \
      [--filter-ext nc,zip] [--introspect]
*)

Get[FileNameJoin[{DirectoryName[$InputFileName], "FetchUtils.wl"}]];
args = FetchUtils`ParseCLIArgs[Rest @ $ScriptCommandLine];

log[flag_, parts__] := FetchUtils`VerbosePrint[flag, parts];

parseArgs[a_Association] := Module[
    {concept, shortName, version, provider, limit, pagesSpec, pagesMax, pagesAllQ, regionString, regionSpec, region, startDate, endDate, temporal,
     forceQ, debugQ, saveQ, dumpLinksQ, introspectQ, filterExtArg, filterExts, tokenPresentQ},
    concept      = Lookup[a, "concept", Lookup[a, "collection", None]];
    shortName    = Lookup[a, "shortName", None];
    version      = Lookup[a, "version", None];
    provider     = Lookup[a, "provider", None];
    limit        = Quiet @ Check[Interpreter["Integer"][Lookup[a, "limit", "200"]], 200];
    pagesSpec    = Lookup[a, "pages", "1"]; pagesAllQ = StringMatchQ[ToUpperCase @ pagesSpec, "ALL"]; pagesMax = If[pagesAllQ, Infinity, Quiet @ Check[Interpreter["Integer"][pagesSpec], 1]];
    regionString = Lookup[a, "region", None];
    regionSpec   = If[StringQ @ regionString, FetchUtils`ParseRegionString[regionString], None];
    region       = If[ListQ @ regionSpec, regionSpec, None];
    startDate    = Lookup[a, "start", None];
    endDate      = Lookup[a, "end", None];
    temporal     = If[StringQ @ startDate && StringLength[startDate] > 0 && StringQ @ endDate && StringLength[endDate] > 0,
        FetchUtils`DateRangeISO8601[DateObject @ startDate, DateObject @ endDate], None];
    forceQ       = KeyExistsQ[a, "force"];
    debugQ       = KeyExistsQ[a, "debug"]; (* cleaned: only --debug enables diagnostics *)
    saveQ        = KeyExistsQ[a, "save"];
    dumpLinksQ   = KeyExistsQ[a, "dump-links"] || KeyExistsQ[a, "links"];
    introspectQ  = KeyExistsQ[a, "introspect"] || KeyExistsQ[a, "nc-vars"];
    filterExtArg = Lookup[a, "filter-ext", Lookup[a, "ext", None]];
    filterExts   = If[StringQ @ filterExtArg, DeleteCases[StringTrim /@ StringSplit[ToLowerCase @ filterExtArg, ","], ""], None];
    tokenPresentQ = (FetchUtils`GetEarthdataHeaders[] =!= {});
    <|
        "concept" -> concept, "shortName" -> shortName, "version" -> version, "provider" -> provider,
        "limit" -> limit, "pagesSpec" -> pagesSpec, "pagesMax" -> pagesMax, "pagesAllQ" -> pagesAllQ,
        "region" -> region, "temporal" -> temporal, "forceQ" -> forceQ, "debugQ" -> debugQ, "saveQ" -> saveQ,
        "dumpLinksQ" -> dumpLinksQ, "introspectQ" -> introspectQ, "filterExts" -> filterExts, "tokenPresentQ" -> tokenPresentQ
    |>
];

usage[] := WriteString[$Output, "Usage: fetch_collection.wl -concept C##########-PROVIDER [options]\n"];

isDataLink[link_] := Module[{rel = ToString @ Lookup[link, "rel", ""], href = ToString @ Lookup[link, "href", ""], type = ToString @ Lookup[link, "type", ""]},
    Or[StringMatchQ[rel, ___ ~~ ("data#" | "s3#") ~~ ___],
       StringMatchQ[href, ___ ~~ (".nc" | ".nc4" | ".hdf" | ".h5" | ".zip")],
       StringMatchQ[type, ___ ~~ ("netcdf" | "hdf") ~~ ___]] &&
    ! StringMatchQ[rel, ___ ~~ ("browse#" | "metadata#" | "service#") ~~ ___]
];

extensionAllowedQ[filterExts_, href_] := If[filterExts === None, True,
    With[{low = ToLowerCase[href]}, AnyTrue[filterExts, StringEndsQ[low, "." <> #] &]]
];

selectBaseName[url_] := Module[{pathParts = URLParse[url, "Path"]},
    Which[
        StringQ[pathParts], FileNameTake[pathParts],
        ListQ[pathParts] && pathParts =!= {}, Last[pathParts],
        True, FileNameTake[url]
    ]
];

downloadAuth[url_, dest_, force_, headers_] := Module[{http, status, body},
    If[FileExistsQ[dest] && ! TrueQ[force], Return[dest]];
    If[headers === {}, Return[FetchUtils`DownloadIfNeeded[url, dest, force]]];
    http = Quiet @ Check[URLRead[HTTPRequest[url, <|"Headers" -> headers|>]], $Failed];
    If[Head[http] =!= HTTPResponse, Return[$Failed]];
    status = http["StatusCode"]; body = http["Body"];
    Which[
        200 <= status < 300,
            Which[
                MatchQ[body, _ByteArray], Export[dest, FromCharacterCode[Normal @ body], "String"],
                StringQ[body], Export[dest, body, "String"],
                True, Null
            ]; If[FileExistsQ[dest], dest, $Failed],
        MemberQ[{401, 403}, status], $Failed,
        True, $Failed
    ]
];

fetchGranules[conf_Association] := Module[
    {all = {}, page = 1, finished = False, limit = conf["limit"], pagesMax = conf["pagesMax"], shortName = conf["shortName"], 
     temporal = conf["temporal"], region = conf["region"], concept = conf["concept"], version = conf["version"], provider = conf["provider"], resp, part},
    While[page <= pagesMax && ! finished,
        resp = FetchUtils`CMRGranuleSearch[<|"ShortName" -> shortName, "Temporal" -> temporal, "BoundingBox" -> region, "CollectionConceptId" -> concept, "Version" -> version, "Provider" -> provider|>, "Limit" -> limit, "Page" -> page];
        If[! AssociationQ @ resp || ! TrueQ @ resp["success"],
            Return[{$Failed, <|"error" -> True, "page" -> page, "status" -> Lookup[resp, "status", Null], "cmrErrors" -> Lookup[resp, "errors", {}]|>}]
        ];
        part = Lookup[Lookup[resp, "feed", <||>], "entry", {}];
        If[ListQ @ part && part =!= {}, all = Join[all, part]];
        log[conf["debugQ"], "page", page, "got", Length @ part];
        If[Length[part] < limit, finished = True];
        page++;
    ];
    {all, None}
];

processDownloads[conf_Association, granules_List] := Module[
    {outDir, headers, forceQ = conf["forceQ"], filterExts = conf["filterExts"], dumpLinksQ = conf["dumpLinksQ"], introspectQ = conf["introspectQ"], tokenPresentQ = conf["tokenPresentQ"], downloads, resList, summaryAssoc, manifest, manifestPath, successCount, authEvents, linksDumpPath},
    outDir = FileNameJoin[{DirectoryName[$InputFileName], "..", "data_cache", "granules", conf["concept"]}];
    If[! DirectoryQ @ outDir, CreateDirectory[outDir, CreateIntermediateDirectories -> True]];
    headers = FetchUtils`GetEarthdataHeaders[];
    downloads = Reap[Do[
        Module[{links = Lookup[g, "links", {}], dataLinks, url, baseName, filePath, dlRes},
            dataLinks = Select[links, isDataLink];
            If[dataLinks === {}, Sow[<|"skipped" -> True, "reason" -> "no_data_link", "granuleId" -> Lookup[g, "id", Missing["id"]]|>],
                url = Lookup[First[dataLinks], "href", None];
                If[! StringQ @ url || ! extensionAllowedQ[filterExts, url], Sow[<|"skipped" -> True, "reason" -> If[StringQ @ url, "ext_filter", "bad_href"], "granuleId" -> Lookup[g, "id", Missing["id"]]|>],
                    baseName = selectBaseName[url];
                    filePath = FileNameJoin[{outDir, baseName}];
                    If[FileExistsQ[filePath] && ! forceQ, Sow[filePath],
                        dlRes = downloadAuth[url, filePath, forceQ, headers];
                        Which[
                            StringQ[dlRes] && FileExistsQ[dlRes], Sow[dlRes],
                            True, Sow[<|"failed" -> url|>]
                        ]
                    ]
                ]
            ]
        ]
    , {g, granules}]];
    resList = If[downloads === {} || downloads === Null, {}, Flatten[downloads[[2]]]];
    If[dumpLinksQ, linksDumpPath = Quiet @ Check[Export[FileNameJoin[{outDir, "links_dump.json"}], Association /@ (Lookup[#, "links", {}] & /@ granules), "JSON"], Null]];
    manifest = FetchUtils`BuildManifest[<|"concept" -> conf["concept"], "shortName" -> conf["shortName"], "temporal" -> conf["temporal"], "boundingBox" -> If[ListQ @ conf["region"], StringRiffle[conf["region"], ","], None], "pages" -> conf["pagesSpec"], "pageLimit" -> conf["limit"]|>, granules, resList];
    If[introspectQ,
        manifest["downloads"] = Map[If[AssociationQ[#] && KeyExistsQ[#, "file"], Module[{vars = Quiet @ Check[Import[# ["file"], "Datasets"], $Failed]}, If[ListQ[vars], Append[#, "variables" -> vars], #]], #]&, manifest["downloads"]]
    ];
    manifestPath = FileNameJoin[{outDir, "manifest.json"}];
    Module[{safeJSON, cleaned, json, outBytes},
        safeJSON[expr_] := Which[
            AssociationQ[expr], Association @ KeyValueMap[#1 -> safeJSON[#2] &, expr],
            ListQ[expr], safeJSON /@ expr,
            MatchQ[expr, _Missing], Null,
            expr === $Failed, Null,
            Head[expr] === ByteArray, Normal[expr],
            MatchQ[expr, _String | _Integer | _Real | _?BooleanQ | Null], expr,
            Head[expr] === DateObject, DateString[expr, "ISODateTime"],
            Head[expr] === Function, "<Function>",
            Head[expr] === Symbol, ToString[Unevaluated[expr]],
            True, ToString[expr]
        ];
        cleaned = safeJSON[manifest];
        json = Quiet @ Check[ExportString[cleaned, "JSON", "Compact" -> False], $Failed];
        If[! StringQ[json], json = ExportString[<|"error" -> True, "reason" -> "manifest serialization failed"|>, "JSON", "Compact" -> False]];
        Quiet @ Check[Export[manifestPath, json, "String"], Null];
        outBytes = Quiet @ Check[FileByteCount[manifestPath], -1];
        If[conf["debugQ"], log[True, "[manifest] bytes=", outBytes]];
    ];
    If[conf["saveQ"], Quiet @ Check[Export[FileNameJoin[{outDir, "granules_list.json"}], granules, "JSON"], Null]];
    successCount = Count[resList, _String];
    authEvents   = Count[resList, _?(AssociationQ[#] && KeyExistsQ[#, "auth_required"] & )];
    summaryAssoc = <|"ok" -> True, "granuleCount" -> Length[granules], "downloaded" -> successCount, "authRequired" -> authEvents, "tokenPresent" -> tokenPresentQ, "introspected" -> introspectQ, "manifest" -> manifestPath, "linksDump" -> If[dumpLinksQ, FileNameJoin[{outDir, "links_dump.json"}], Null]|>;
    {summaryAssoc, 0}
];

main[] := Catch[
    Module[{conf, granules, err, summary, code},
        If[TrueQ @ Lookup[args, "help", False], usage[]; Throw[0, "exit"]];
        conf = parseArgs[args];
        If[! StringQ @ conf["concept"], WriteString[$Output, ExportString[<|"error" -> True, "message" -> "Must supply -concept"|>, "JSON"] <> "\n"]; Throw[1, "exit"]];
        log[conf["debugQ"], "concept=", conf["concept"], If[StringQ @ conf["shortName"], " short=" <> conf["shortName"], ""], If[conf["temporal"] =!= None, " temporal=" <> conf["temporal"], ""], If[ListQ @ conf["region"], " region=" <> StringRiffle[conf["region"], ","], ""]];
        {granules, err} = fetchGranules[conf];
        If[granules === {}, WriteString[$Output, ExportString[<|"warning" -> "no_granules", "concept" -> conf["concept"]|>, "JSON"] <> "\n"]; Throw[0, "exit"]];
        {summary, code} = processDownloads[conf, granules];
        If[conf["debugQ"] && ! conf["tokenPresentQ"] && summary["authRequired"] > 0,
            WriteString[$Output, "[warning] Some downloads required authentication; set EARTHDATA_TOKEN.\n"]
        ];
        WriteString[$Output, ExportString[summary /. { $Failed -> Null }, "JSON", "Compact" -> False] <> "\n"]; Throw[code, "exit"];
    ], "exit"];

code = main[];
If[IntegerQ[code], code, 0]
