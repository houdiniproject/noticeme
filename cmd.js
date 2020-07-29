#!/usr/bin/env node
// Copyright (c) Houdini Project
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const noticeme = require('.');
require('colors');
const fs = require('fs');
const yargs = require('yargs');
const Diff = require('diff');

const noticeFilename = "NOTICE"

const argv = yargs
  .option('filename', {
    alias: 'f', 
    type: 'string', 
    default: noticeFilename, 
    description: 'notice filename'
  })
  .option('update', {
    alias: 'u',
    type: 'boolean',
    default: false,
    description: "update or create the notice file"
  })
  .option('included', {
    alias: 'i',
    type: 'string',
    default: null,
    description: 'additional file containing packages where you copied in code from but which aren\'t dependencies'
  })
  .help()
  .argv;

noticeme({path:'.', includedFile: argv.included}).then(notice => {

  if (!argv.update) {
    if (!fs.existsSync(argv.filename)){
      process.stderr.write(`The notice file ${argv.filename} does not exist. Generate one by running \`noticeme -u\`\n`)
      process.exit(1)
    }
    else {
      diff = Diff.diffLines( fs.readFileSync(argv.filename).toString(),notice)
        .filter((part) => part.added || part.removed)
      if (diff.length > 0)
      {
        process.stderr.write(`The notice file ${argv.filename} must be updated\n`)
        diff.forEach((part) => {
          // green for additions, red for deletions
          const color = part.added ? 'green' :
            part.removed ? 'red' : 'grey';
          const prefix = part.added ? "+ " : part.removed ?  "- " : "";
          const output = part.value.split('\n').map((i) => prefix + i).join('\n')
          process.stderr.write(output[color]);
        });

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
});