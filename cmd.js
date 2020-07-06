#!/usr/bin/env node
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const noticeme = require('.');
const fs = require('fs');
const {argv} = require('yargs')
let noticeFilename = "NOTICE"
if (argv._.length >= 1) {
  noticeFilename = argv._[0]
}
noticeme('.').then(notice => fs.writeFileSync(noticeFilename, notice));