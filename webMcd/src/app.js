#!/usr/bin/env node

'use strict';

var semver = require('semver')
const chalk = require('chalk')

var version = require('./../package.json').engines.node

if (!semver.satisfies(process.version, version)) {
    let msg = `Minimum required node version is ${version}, Installed node ` + `version is ${process.version}`;
    console.log(`${chalk.red(msg)}`)
    process.exit(1)
}

const initialize = require("./initialize");