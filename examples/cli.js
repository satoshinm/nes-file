#!/usr/bin/env node
'use strict';

const fs = require('fs');
const { parse } = require('../');

if (process.argv.length < 3) {
  process.stderr.write(`NES .nes file parser
Usage: node cli.js filename
`);
  process.exit(1);
}

const filename = process.argv.slice(2)[0];
const buf = fs.readFileSync(filename);
console.log(parse(buf));
