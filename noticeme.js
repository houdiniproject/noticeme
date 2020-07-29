// License: LGPL-3.0-or-later
// Copyright (c) Houdini Project
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const readPkgTree = require('read-package-tree');
const fetch = require('node-fetch');
const fs = require('fs')
const pathMod = require('path')

const npmjsCoordinates = ({ name, version }) =>
  'npm/npmjs/' + (name.includes('/') ? name : `-/${name}`) + `/${version}`;

function retrieveIncludedJson(path, file = 'included.json') {
  const includedPath = pathMod.join(process.cwd(), path, file);
  return fs.existsSync(includedPath) ? JSON.parse(fs.readFileSync(includedPath, 'utf8')).packages : [];
}

module.exports = function noticeme(path, rpt = readPkgTree, http = fetch) {
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

     
      coordinates = coordinates.concat(retrieveIncludedJson(path).
      map((package) => npmjsCoordinates(package)));


      http('https://api.clearlydefined.io/notices', {
        method: 'post',
        body: JSON.stringify({ coordinates }),
        headers: { 'Content-Type': 'application/json' },
      })
        .then(res => res.json())
        .then(json => resolve(json.content));
    });
  });
}