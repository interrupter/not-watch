#!/usr/bin/env node

import minimist from "minimist";
import execshell from "exec-sh";
import path from "node:path";
import * as watch from "./main.js";

const argv = minimist(process.argv.slice(2));
console.log(argv);
if (argv._.length === 0) {
    console.error(
        [
            "Usage: watch <command> [...directory]",
            "[--wait=<seconds>]",
            "[--filter=<file>]",
            "[--interval=<seconds>]",
            "[--ignoreDotFiles]",
            "[--ignoreUnreadable]",
            "[--ignoreDirectoryPattern]",
        ].join(" ")
    );
    process.exit();
}

let watchTreeOpts = {};
let command = argv._[0];
let dirs = [];

let i;
let argLen = argv._.length;
if (argLen > 1) {
    for (i = 1; i < argLen; i++) {
        dirs.push(argv._[i]);
    }
} else {
    dirs.push(process.cwd());
}

let waitTime = Number(argv.wait || argv.w);
if (argv.interval || argv.i) {
    watchTreeOpts.interval = Number(argv.interval || argv.i || 0.2);
}

if (argv.ignoreDotFiles || argv.d) watchTreeOpts.ignoreDotFiles = true;

if (argv.ignoreUnreadable || argv.u) watchTreeOpts.ignoreUnreadableDir = true;

if (argv.ignoreDirectoryPattern || argv.p) {
    let match = (argv.ignoreDirectoryPattern || argv.p).match(
        /^\/(.*)\/([gimuy]*)$/
    );
    watchTreeOpts.ignoreDirectoryPattern = new RegExp(match[1], match[2]);
}

if (argv.filter || argv.f) {
    try {
        watchTreeOpts.filter = require(path.resolve(
            process.cwd(),
            argv.filter || argv.f
        ));
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

let wait = false;

let dirLen = dirs.length;
let skip = dirLen - 1;
for (i = 0; i < dirLen; i++) {
    let dir = dirs[i];
    console.error("> Watching", dir);
    watch.watchTree(dir, watchTreeOpts, function (f, curr, prev) {
        if (skip) {
            skip--;
            return;
        }
        if (wait) return;
        execshell(command);
        if (waitTime > 0) {
            wait = true;
            setTimeout(function () {
                wait = false;
            }, waitTime * 1000);
        }
    });
}
