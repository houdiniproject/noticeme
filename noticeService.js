// Copyright (c) Houdini Project
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
const chunk = require('lodash/chunk');
const sum = require('lodash/sum');
const assign = require('lodash/assign');
const concat = require('lodash/concat');

const NOTICE_SIZE = 250;

class NoticeService {
  
  constructor(url, http){
    this.url = url
    this.http = http
  }

  generateNotice(coordinates, chunkSize = 0) {
    var noticePromise = null;
    if (chunkSize && chunkSize > 0) {
      noticePromise = this.getSequentialPromises(
        chunk(coordinates, NOTICE_SIZE)
        .map(i => () => this.noticePromise(i))
        )
    }
    else {
      noticePromise = this.noticePromise(coordinates)
    }
    return noticePromise.then((results) => 
      
      {
        return {
          content: results instanceof Array ? results.map((i) => i.content).join('\n') : results.content,
          summary: {
            total: results instanceof Array ? sum(results.map(i => i.summary.total)) : results.summary.total,
            warnings: {
              noDefinition: results instanceof Array ? concat(results.map(i => i.summary.warnings.noDefinition)) : results.summary.warnings.noDefinition,
              noLicense: results instanceof Array ? concat(results.map(i => i.summary.warnings.noLicense)) : results.summary.warnings.noLicense,
              noCopyright: results instanceof Array ? concat(results.map(i => i.summary.warnings.noCopyright)): results.summary.warnings.noCopyright,
            }
          }
        }
      });
    
  }
  
  // from: https://hackernoon.com/functional-javascript-resolving-promises-sequentially-7aac18c4431e
  // permission given to include in open source code at: https://twitter.com/joelnet/status/1308879250402013187
  getSequentialPromises(funcs) {
    return funcs.reduce((promise, func) =>
      promise.then(result =>
        func().then(Array.prototype.concat.bind(result))),
        Promise.resolve([]))
  }

  noticePromise(coordinates) {
    return this.http(this.url, {
        method: 'post',
        body: JSON.stringify({ coordinates }),
        headers: { 'Content-Type': 'application/json' },
      }).then(
        (res) => {
          if (res.status < 400) {
            return res.json()
          }
          else {
            throw new NoticeError(`Call to notice API returns status of ${res.status}`)
          }
            
        })
        .catch(error => {
          if (error instanceof NoticeError)
            throw error;
          else
            throw new NoticeError(error.toString());
        });
  }
}

class NoticeError extends Error {

}




module.exports = NoticeService;