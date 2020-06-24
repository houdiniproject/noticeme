#!/usr/bin/env node
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const noticeme = require('.');
const fs = require('fs');

noticeme('.').then(notice => fs.writeFileSync('NOTICE', notice));