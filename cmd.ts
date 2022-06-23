#!/usr/bin/env node
// Copyright (c) Houdini Project
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import 'colors';

import noticeme from './noticeme';
import fs from 'fs';
import yargs from 'yargs';
import { diff_match_patch } from 'diff-match-patch';

const noticeFilename = "NOTICE"

const argv = yargs.options(
  {
    filename: {
      alias: 'f',
      type: 'string',
      default: noticeFilename,
      description: 'notice filename'
    },
    update: {

      alias: 'u',
      type: 'boolean',
      default: false,
      description: "update or create the notice file"
    },
    included: {
      alias: 'i',
      type: 'string',
      default: null,
      description: 'additional file containing packages where you copied in code from but which aren\'t dependencies'
    },
    chunksize: {
      alias: 's',
      type: 'number',
      default: null,
      description: "Creating a notice with more than 250 packages can cause a timeout of ClearlyDefined.io. To avoid this," +
        "you can pass the number of packages to put into a single chunk here. In the end, they'll all get combined into a single" +
        "NOTICE file."
    }

  }
).help().parseSync();

noticeme({ path: '.', includedFile: argv.included, chunkSize: argv.chunksize }).then(notice => {

  if (!argv.update) {
    if (!fs.existsSync(argv.filename)) {
      process.stderr.write(`The notice file ${argv.filename} does not exist. Generate one by running \`noticeme -u\`\n`)
      process.exit(1)
    }
    else {
      const dmp = new diff_match_patch();
      const diff = dmp.diff_main(fs.readFileSync(argv.filename).toString(), notice)
        .filter((part) => part[0] !== 0)
      if (diff.length > 0) {
        process.stderr.write(`The notice file ${argv.filename} must be updated\n`)
        diff.forEach((part) => {
          const change = part[0] === -1 ? 'removed' : part[0] === 1 ? 'added' : ''
          // green for additions, red for deletions
          const color = change === 'added' ? 'green' :
            change === 'removed' ? 'red' : 'grey';
          const prefix = change === 'added' ? "+ " : change === 'removed' ? "- " : "";
          const output = part[1].split('\n').map((i) => prefix + i).join('\n')
          process.stderr.write(output[color]);
        });
        process.stderr.write('\n')
        process.exit(2)
      }
      process.stdout.write(`The notice file ${argv.filename} is already up to date\n`)
      process.exit(0)
    }
  }
  else {
    fs.writeFileSync(argv.filename, notice)
    process.stdout.write(`The notice file ${argv.filename} is now up to date\n`)
    process.exit(0)
  }
}).catch(error => {
  process.stderr.write(`noticeme had the following error: ${error.toString()}`)
  process.exit(3)
});