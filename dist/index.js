module.exports =
/******/ (function(modules, runtime) { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete installedModules[moduleId];
/******/ 		}
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	__webpack_require__.ab = __dirname + "/";
/******/
/******/ 	// the startup function
/******/ 	function startup() {
/******/ 		// Load entry module and return exports
/******/ 		return __webpack_require__(770);
/******/ 	};
/******/
/******/ 	// run startup
/******/ 	return startup();
/******/ })
/************************************************************************/
/******/ ({

/***/ 129:
/***/ (function(module) {

module.exports = require("child_process");

/***/ }),

/***/ 186:
/***/ (function(module) {

module.exports = eval("require")("node-fetch");


/***/ }),

/***/ 747:
/***/ (function(module) {

module.exports = require("fs");

/***/ }),

/***/ 765:
/***/ (function(module) {

module.exports = require("process");

/***/ }),

/***/ 770:
/***/ (function(__unusedmodule, __unusedexports, __webpack_require__) {

const child_process = __webpack_require__(129);
const process = __webpack_require__(765);
const { readFile } = __webpack_require__(747).promises;

const core = __webpack_require__(970);
const fetch = __webpack_require__(186);

const GITHUB_API = 'https://api.github.com';

const xhr = (baseUrl, headers) => Object.fromEntries(['get', 'put', 'post', 'delete', 'patch']
  .map(verb => [verb, async (url, body) => {
    const res = await fetch(baseUrl + url, {
      method: verb.toUpperCase(),
      body: body && JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
    });

    if (!res.ok) {
      throw new Error(res.statusText);
    }

    return res.json();
  }])
);

function repoFiles() {
  return child_process.execSync('md5sum $(find . -type f ! -path "*/.*")')
    .toString()
    .trim()
    .split('\n')
    .map(line => {
      const [hash, p] = line.trim().split(/\s+/);
      return {
        path: p.slice(1),
        hash
      };
    });
}

function getContentType(id) {
  if (/\.(js|ellx)$/.test(id)) {
    return 'text/javascript';
  }
  if (/\.(md)$/.test(id)) {
    return 'text/plain';
  }
  return 'text/plain';
}

async function sync() {
  core.info('RUNNING');
  const repo = process.env.GITHUB_REPOSITORY;
  const targetSha = process.env.GITHUB_SHA;
  const currentRef = process.env.GITHUB_REF;
  const ellxUrl = core.getInput('ellx-url');
  const token = core.getInput('github-token');

  const tagName = 'ellx-sync/' + (/^refs\/heads\/(.+)/.exec(currentRef) || [, 'latest'])[1];
  const releaseVersion = (/^refs\/heads\/release\/(.+)/.exec(currentRef) || [])[1];
  const suffix = releaseVersion ? '@' + releaseVersion : '';

  const files = repoFiles();

  const ghApi = xhr(GITHUB_API, {
    authorization: `Bearer ${token}`
  });

  const ellxApi = xhr(ellxUrl);

  // Check repo visibility, and whether we have the tag already
  const [meta, ellxTag] = await Promise.all([
    ghApi.get(`/repos/${repo}`),
    ghApi.get(`/repos/${repo}/git/matching-refs/tags/${tagName}`)
  ]);

  const toUpload = await ellxApi.put('/sync/' + repo + suffix, {
    repo,
    token,
    acl: meta.private ? 'private' : 'public',
    description: meta.description,
    targetSha,
    tagName,
    currentSha: ellxTag[0] && ellxTag[0].object.sha,
    files
  }).catch(core.error);

  const uploads = await Promise.all(
    toUpload.map(
      async ({ path, uploadUrl }) => fetch(uploadUrl, {
        method: 'PUT',
        body: await readFile('.' + path, 'utf8'),
        headers: {
          'Content-Type': getContentType(path),
          'Cache-Control': 'max-age=31536000' // TODO: fix for private projects
        },
      }).catch(core.error)
    )
  );

  if (uploads.every(i => i.ok)) {
    core.info(['Successfully synced']
      .concat(toUpload.map(({ path }) => path.slice(1)))
      .join('\n')
    );
  }
  else {
    const errIdx = uploads.findIndex(r => !r.ok);
    core.error(`Failed to upload ${toUploads[errIdx].path.slice(1)}: ${r.statusText}`);
  }
}

sync().catch(error => core.setFailed(error.message));


/***/ }),

/***/ 970:
/***/ (function(module) {

module.exports = eval("require")("@actions/core");


/***/ })

/******/ });