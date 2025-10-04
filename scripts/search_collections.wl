#!/usr/bin/env wolframscript
(* ::Title:: Collection Search Helper *)
(* Usage: wolframscript -file search_collections.wl -keyword ocean color --limit 20 [--pages N] [--contains TEXT] [--json] [--raw] [--debug] *)

Get[FileNameJoin[{DirectoryName[$InputFileName], "FetchUtils.wl"}]];
rawArgs = Rest[$ScriptCommandLine];
args = FetchUtils`ParseCLIArgs[rawArgs];
rawQ = KeyExistsQ[args, "raw"]; debugQ = KeyExistsQ[args, "debug"];
If[! KeyExistsQ[args, "keyword"],
    nonFlags = TakeWhile[rawArgs, ! StringStartsQ[#, "-"] &];
    If[nonFlags =!= {}, args["keyword"] = StringRiffle[nonFlags, " "]];
];
Catch[
    If[TrueQ @ Lookup[args, "help", False], FetchUtils`UsageAndQuit["Usage: search_collections.wl -keyword term [-provider PROVIDER] [--limit N] [--json] [--debug]", 0]];
    keyword = Lookup[args, "keyword", None];
    shortOverride = Lookup[args, "shortName", None];
    provider = Lookup[args, "provider", None];
    limit = Quiet @ Check[Interpreter["Integer"][Lookup[args, "limit", "25"]], 25];
    pages = Quiet @ Check[Interpreter["Integer"][Lookup[args, "pages", "1"]], 1];
    containsFilter = Lookup[args, "contains", None];
    verboseQ = False; (* cleaned: only --debug is supported now *)
    jsonQ = KeyExistsQ[args, "json"];
    queryAssoc = <||>;
    If[StringQ @ keyword, queryAssoc["Keyword"] = keyword];
    If[StringQ @ shortOverride, queryAssoc["ShortName"] = shortOverride];
    If[StringQ @ provider, queryAssoc["Provider"] = provider];
    FetchUtils`VerbosePrint[debugQ, "Searching collections", If[StringQ @ keyword, " keyword=" <> keyword, ""], If[StringQ @ shortOverride, " shortName=" <> shortOverride, ""], If[StringQ @ provider, " provider=" <> provider, ""]];
    allEntries = {}; resp =.; pageBodies = {};
    Do[
        resp = FetchUtils`CMRCollectionSearch[queryAssoc, "Limit" -> limit, "Page" -> pg, "IncludeBody" -> (rawQ || debugQ)];
        If[! AssociationQ[resp] || ! TrueQ[resp["success"]], Break[]];
        feed = Lookup[resp /. Missing[__] :> Null, "feed", <||>];
        part = Lookup[feed /. Missing[__] :> Null, "entry", {}];
        If[feed === <||> || part === {} || ! ListQ[part],
            parsedBody = Quiet @ Check[ImportString[Lookup[resp, "body", Lookup[resp, "raw", ""]], "JSON"], <||>];
            If[AssociationQ @ parsedBody,
                feed2 = Lookup[parsedBody, "feed", <||>];
                part2 = Lookup[feed2 /. Missing[__] :> Null, "entry", {}];
                If[feed === <||> && feed2 =!= <||>, feed = feed2];
                If[ListQ @ part2 && part2 =!= {}, part = part2];
            ];
        ];
    If[debugQ,
            WriteString[$Output, StringTemplate["[debug] page=`1` entriesExtracted=`2` keys=`3` feedKeys=`4`\n"][pg, If[ListQ @ part, Length @ part, -1], ToString[Keys[resp]], ToString[Keys[feed]]]];
            If[(! ListQ @ part || part === {}) && KeyExistsQ[resp, "body"], WriteString[$Output, "[debug] fallback body parsed.\n"]];
        ];
        If[ListQ @ part && part =!= {}, allEntries = Join[allEntries, part]];
        If[rawQ && KeyExistsQ[resp, "body"], AppendTo[pageBodies, Quiet @ Check[ImportString[resp["body"], "JSON"], resp["body"]]]];
        If[Length[part] < limit, Break[]];
    , {pg, 1, pages}];
    respFinal = If[ValueQ[resp], resp, <|"success" -> False|>];
    If[! TrueQ @ Lookup[respFinal, "success", False],
        out = <|"error" -> True, "status" -> Lookup[respFinal, "status", Null], "url" -> Lookup[respFinal, "url", Null], "cmrErrors" -> Lookup[respFinal, "errors", {}]|> /. Missing[__] :> Null;
        If[rawQ && KeyExistsQ[respFinal, "body"],
            dir = FileNameJoin[{DirectoryName[$InputFileName], "..", "data_cache", "collection_search"}];
            If[! DirectoryQ @ dir, CreateDirectory[dir, CreateIntermediateDirectories -> True]];
            rawParsed = Quiet @ Check[ImportString[respFinal["body"], "JSON"], respFinal["body"]];
            rawPath = FileNameJoin[{dir, "raw_collections_error.json"}]; Quiet @ Check[Export[rawPath, rawParsed, "JSON"], Null]; out["rawSaved"] = rawPath;
        ];
        WriteString[$Output, If[jsonQ, ExportString[out, "JSON", "Compact" -> False], ToString[out]] <> "\n"]; Throw[1, "UsageQuitTag"]
    ];
    If[! AssociationQ[resp] || ! KeyExistsQ[resp, "success"] || ! TrueQ[resp["success"]],
        out = <|"error" -> True, "status" -> Lookup[resp, "status", Null], "url" -> Lookup[resp, "url", Null], "cmrErrors" -> Lookup[resp, "errors", {}]|> /. Missing[__] :> Null;
        If[rawQ && KeyExistsQ[resp, "body"],
            dir = FileNameJoin[{DirectoryName[$InputFileName], "..", "data_cache", "collection_search"}];
            If[! DirectoryQ @ dir, CreateDirectory[dir, CreateIntermediateDirectories -> True]];
            rawParsed = Quiet @ Check[ImportString[resp["body"], "JSON"], resp["body"]];
            rawPath = FileNameJoin[{dir, "raw_collections_error.json"}]; Quiet @ Check[Export[rawPath, rawParsed, "JSON"], Null]; out["rawSaved"] = rawPath;
        ];
        WriteString[$Output, If[jsonQ, ExportString[out, "JSON", "Compact" -> False], ToString[out]] <> "\n"]; Throw[1, "UsageQuitTag"]
    ];
    entries = allEntries;
    If[containsFilter =!= None && StringLength[containsFilter] > 0,
        entries = Select[entries, StringContainsQ[ToString @ Lookup[#, "dataset_id", Lookup[#, "title", ""]], containsFilter, IgnoreCase -> True] &]
    ];
    If[entries === {},
        msg = <|"warning" -> "no_collections", "query" -> (queryAssoc /. Missing[__] :> Null), "pagesSearched" -> pages|>;
        If[rawQ && pageBodies =!= {},
            dir = FileNameJoin[{DirectoryName[$InputFileName], "..", "data_cache", "collection_search"}];
            If[! DirectoryQ @ dir, CreateDirectory[dir, CreateIntermediateDirectories -> True]];
            rawPath = FileNameJoin[{dir, "raw_collections_empty.json"}]; Quiet @ Check[Export[rawPath, pageBodies, "JSON"], Null]; msg["rawSaved"] = rawPath;
        ];
        WriteString[$Output, If[jsonQ, ExportString[msg, "JSON"], ToString[msg]] <> "\n"]; Throw[0, "UsageQuitTag"]
    ];
    clean = ReplaceAll[entries, Missing[__] :> Null];
    summ = Map[<|"id" -> Lookup[#, "id", Null], "short_name" -> Lookup[#, "short_name", Null], "version_id" -> Lookup[#, "version_id", Null], "title" -> Lookup[#, "dataset_id", Lookup[#, "title", Null]], "processed" -> Lookup[#, "has_formats", Null]|> &, clean];
    rawPath =.;
    If[rawQ && pageBodies =!= {},
        dir = FileNameJoin[{DirectoryName[$InputFileName], "..", "data_cache", "collection_search"}];
        If[! DirectoryQ @ dir, CreateDirectory[dir, CreateIntermediateDirectories -> True]];
        rawPath = FileNameJoin[{dir, "raw_collections.json"}]; Quiet @ Check[Export[rawPath, pageBodies, "JSON"], Null];
    ];
    (* Generic save support: --save [optionalPath] *)
    saveArg = Lookup[args, "save", None]; savePath =.;
    If[saveArg =!= None,
        dir = FileNameJoin[{DirectoryName[$InputFileName], "..", "data_cache", "collection_search"}];
        If[! DirectoryQ @ dir, CreateDirectory[dir, CreateIntermediateDirectories -> True]];
        defaultName = Module[{kw = Lookup[queryAssoc, "Keyword", "collections"], sanitized},
            sanitized = StringReplace[StringTrim[ToLowerCase[ToString @ kw]], Except[LetterCharacter | DigitCharacter] -> "_"];
            If[sanitized === "", sanitized = "collections"]; "collections_" <> sanitized <> ".json"
        ];
        savePath = Which[
            TrueQ @ saveArg, FileNameJoin[{dir, defaultName}],
            StringQ @ saveArg && FileNameTake[saveArg] === saveArg, (* relative simple file name *)
                FileNameJoin[{dir, If[StringEndsQ[saveArg, ".json"], saveArg, saveArg <> ".json"]}],
            StringQ @ saveArg,
                If[! DirectoryQ @ DirectoryName[saveArg], Quiet @ Check[CreateDirectory[DirectoryName[saveArg], CreateIntermediateDirectories -> True], Null]]; If[StringEndsQ[saveArg, ".json"], saveArg, saveArg <> ".json"],
            True, FileNameJoin[{dir, defaultName}]
        ];
        Quiet @ Check[Export[savePath, summ, "JSON"], Null];
    ];
    If[jsonQ,
        outputAssoc = <|"count" -> Length[summ], "collections" -> summ, "query" -> (queryAssoc /. Missing[__] :> Null)|>;
        If[rawQ && ValueQ[rawPath], outputAssoc["rawSaved"] = rawPath];
        If[ValueQ[savePath], outputAssoc["saved"] = savePath];
        WriteString[$Output, ExportString[outputAssoc, "JSON", "Compact" -> False] <> "\n"],
        (* Non-JSON: simple indexed listing *)
        Do[
            c = summ[[i]];
            rowStr = ToString @ StringRiffle[{i, ".", Lookup[c, "short_name", "?"], "v" <> ToString @ Lookup[c, "version_id", "?"], StringTake[Lookup[c, "title", ""], 120]}, " "];
            WriteString[$Output, rowStr <> "\n"];
        , {i, 1, Length[summ]}];
        If[ValueQ[savePath], WriteString[$Output, "[saved] " <> savePath <> "\n"]];
    ];
,
    "UsageQuitTag" &];
