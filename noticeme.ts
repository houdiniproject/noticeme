// Copyright (c) Houdini Project
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const readPkgTree = require('read-package-tree');
const fetch = require('node-fetch');
const fs = require('fs');
const pathMod = require('path');
const NoticeService = require('./noticeService');

const npmjsCoordinates = ({ name, version }) =>
  'npm/npmjs/' + (name.includes('/') ? name : `-/${name}`) + `/${version}`;

function retrieveIncludedJson(path) {
  return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf8')).packages : [];
}

module.exports = function noticeme({path, includedFile, chunkSize=0, rpt=readPkgTree, http = fetch}) {
  return new Promise((resolve, reject) => {
    rpt(path, function (err, { children }) {
      if (err) reject(err);

      const pkgJsonLicenses = new Map();
      let coordinates = children.map(({ package, children: more }) => {
        children.push(...more);
        const coordinate = npmjsCoordinates(package);

        // TODO: make use of these as fallback
        pkgJsonLicenses.set(coordinate, package.license);

        return coordinate;
      });

     
      if (includedFile){
        coordinates = coordinates.concat(retrieveIncludedJson(includedFile).
            map((package) => npmjsCoordinates(package)));
      }

      const service = new NoticeService('https://api.clearlydefined.io/notices', http);
      service.generateNotice(coordinates, chunkSize).then(json => 
        resolve(json.content)
      ).catch(error => {
        reject(error);
      })

    });
  });
}