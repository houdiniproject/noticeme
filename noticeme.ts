// Copyright (c) Houdini Project
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import fs from 'fs';
import fetch from 'node-fetch';
import NoticeService from './noticeService';
import {Arborist} from '@npmcli/arborist';

interface PackageNode {
  name: string
  package: {
    name: string
    version: string
    license: string
  }
  children: PackageNode[]
}

async function arboristPromise(arborist: Arborist, path: string): Promise<PackageNode[]> {
  const actual = (await arborist.loadActual());
  
  return Array.from(actual.children.entries()).sort((item) => item[0]).map((item) => item[1]);

}


const npmjsCoordinates = ({ name, version }: { name: string, version: string }): string =>
  'npm/npmjs/' + (name.includes('/') ? name : `-/${name}`) + `/${version}`;

function retrieveIncludedJson(path: string): { name: string; version: string; }[] {
  return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf8')).packages : [];
}

function argNormalization(args: { path: string, includedFile: string | null, chunkSize?: number | null, arborist?: Arborist | null, http?: typeof fetch }): { chunkSize: number; arborist: Arborist; http: typeof fetch; path: string; includedFile: string | null; } {

  return {
    ...args,
    chunkSize: args.chunkSize || 0,
    arborist: args.arborist || new Arborist(),
    http: args.http || fetch,
  }

}


export default async function noticeme(args: { path: string, includedFile: string | null, chunkSize?: number | null, arborist?: Arborist | null, http?: typeof fetch }): Promise<string> {
  const { path, includedFile, chunkSize, arborist, http } = argNormalization(args);
  const children = await arboristPromise(arborist, path);

  const pkgJsonLicenses = new Map();
  let coordinates = children.map(({ package: pkg, children: more }) => {
    children.push(...more);
    const coordinate = npmjsCoordinates(pkg);

    // TODO: make use of these as fallback
    pkgJsonLicenses.set(coordinate, pkg.license);

    return coordinate;
  });


  if (includedFile) {
    coordinates = coordinates.concat(retrieveIncludedJson(includedFile).
      map((pkg) => npmjsCoordinates(pkg)));
  }

  const service = new NoticeService('https://api.clearlydefined.io/notices', http);

  const json = await service.generateNotice(coordinates, chunkSize)
  return json.content;
}