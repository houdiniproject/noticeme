// Copyright (c) Houdini Project
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import chunk from 'lodash/chunk';
import sum from 'lodash/sum';
import concat from 'lodash/concat';
import flatten from 'lodash/flatten';
import fetch from 'node-fetch'

const NOTICE_SIZE = 250;

export interface ClearlyDefinedServiceResultItemType {
  content: string;
  summary: {
    total: number;
    warnings: {
      noDefinition: string[],
      noLicense: string[],
      noCopyright: string[],
    }
  }
}



abstract class Notice {
  constructor(readonly service: NoticeService) {

  }

  abstract get(coordinates: string[]): Promise<ClearlyDefinedServiceResultItemType>;
}



class SequentialNotice extends Notice {

  async get(coordinates: string[]): Promise<ClearlyDefinedServiceResultItemType> {
    const results = await this.getSequentialPromises(
      chunk(coordinates, NOTICE_SIZE)
        .map(i => () => this.service.noticePromise(i))
    )
    return {
      content: results.map((i) => i.content).join('\n'),
      summary: {
        total: sum(results.map(i => i.summary.total)),
        warnings: {
          noDefinition: flatten(concat(results.map(i => i.summary.warnings.noDefinition))),
          noLicense: flatten(concat(results.map(i => i.summary.warnings.noLicense))),
          noCopyright: flatten(concat(results.map(i => i.summary.warnings.noCopyright))),
        }
      }
    }
  }

  // from: https://hackernoon.com/functional-javascript-resolving-promises-sequentially-7aac18c4431e
  // permission given to include in open source code at: https://twitter.com/joelnet/status/1308879250402013187
  private getSequentialPromises(funcs: any[]): Promise<ClearlyDefinedServiceResultItemType[]> {
    return funcs.reduce((promise, func) =>
      promise.then((result: any) =>
        func().then(Array.prototype.concat.bind(result))),
      Promise.resolve([]))
  }
}

class SingleNotice extends Notice {
  get(coordinates: string[]): Promise<ClearlyDefinedServiceResultItemType> {
    return this.service.noticePromise(coordinates);
  }
}

export default class NoticeService {


  http: typeof fetch;
  url: string;

  constructor(url: string, http: typeof fetch) {
    this.url = url
    this.http = http
  }

  async generateNotice(coordinates: string[], chunkSize = 0): Promise<ClearlyDefinedServiceResultItemType> {
    return chunkSize && chunkSize > 0 ? new SequentialNotice(this).get(coordinates) : new SingleNotice(this).get(coordinates);
  }



  async noticePromise(coordinates: string[]): Promise<ClearlyDefinedServiceResultItemType> {
    return this.http(this.url, {
      method: 'post',
      body: JSON.stringify({ coordinates }),
      headers: { 'Content-Type': 'application/json' },
    }).then(
      (res) => {
        if (res.status < 400) {
          return res.json() as Promise<ClearlyDefinedServiceResultItemType>
        }
        else {
          throw new NoticeError(`Call to notice API returns status of ${res.status}`)
        }

      }).catch(error => {
        if (error instanceof NoticeError)
          throw error;
        else
          throw new NoticeError(error.toString());
      });
  }
}

class NoticeError extends Error {

}