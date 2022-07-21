// Copyright (c) Houdini Project
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import fs from 'fs';
import fetch from 'node-fetch';
import NoticeService from './noticeService';
import readPkgTree from 'read-package-tree';

interface PackageNode {
  name: string
  package: {
    name: string
    version: string
    license: string
  }
  children: PackageNode[]
}


const npmjsCoordinates = ({ name, version }: { name: string, version: string }): string =>
  'npm/npmjs/' + (name.includes('/') ? name : `-/${name}`) + `/${version}`;

function retrieveIncludedJson(path: string): { name: string; version: string; }[] {
  return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf8')).packages : [];
}

function argNormalization(args: { path: string, includedFile: string | null, chunkSize?: number | null, rpt?: typeof readPkgTree | null, http?: typeof fetch }): { chunkSize: number; rpt: typeof readPkgTree; http: typeof fetch; path: string; includedFile: string | null; } {

  return {
    ...args,
    chunkSize: args.chunkSize || 0,
    rpt: args.rpt || readPkgTree,
    http: args.http || fetch,
  }

}


export default async function noticeme(args: { path: string, includedFile: string | null, chunkSize?: number | null, rpt?: typeof readPkgTree | null, http?: typeof fetch }): Promise<string> {
  const { path, includedFile, chunkSize, rpt, http } = argNormalization(args);

 return new Promise((resolve, reject) => {
    rpt(path, function (err:any, { children }:{children:PackageNode[]}) {
      if (err) reject(err);

      const pkgJsonLicenses = new Map();
      let coordinates = children.map(({ package:pkg, children: more }:PackageNode ) => {
        children.push(...more);
        const coordinate = npmjsCoordinates(pkg);

        // TODO: make use of these as fallback
        pkgJsonLicenses.set(coordinate, pkg.license);

        return coordinate;
      });

     
      if (includedFile){
        coordinates = coordinates.concat(retrieveIncludedJson(includedFile).
            map((pkg) => npmjsCoordinates(pkg)));
      };

     
      if (includedFile){
        coordinates = coordinates.concat(retrieveIncludedJson(includedFile).
            map((pkg) => npmjsCoordinates(pkg)));
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