"use strict";

var path = require('path');
var pkg = require('./package.json');

var CSVDataPipeline = require('./csv-data-pipeline.js');
var recipes = require('./recipes/index.js');
var name = require('./recipes/name.js');

const SOURCE = process.env.DATA_SOURCE;
const TARGET = process.env.DATA_TARGET;

const SOURCE_FILE = path.join( __dirname, pkg.dirs.source, [SOURCE, 'CSV'].join('.') );
const TARGET_FILE = path.join( __dirname, pkg.dirs.target, [TARGET, 'CSV'].join('.') );


CSVDataPipeline( SOURCE, TARGET )
    .source( SOURCE_FILE )
    .transformations( recipes[ name( SOURCE, TARGET ) ] )
    .target( TARGET_FILE );
