"use strict";

var path = require('path');
var pkg = require('./package.json');

var CSVDataPipeline = require('./csv-data-pipeline.js');
var recipes = require('./recipes/index.js');

var mappings = require('./mappings.js');


const TARGET = process.env.DATA_TARGET;
const TARGET_FILE = path.join( __dirname, pkg.dirs.target, [TARGET, 'CSV'].join('.') );
const PRIMARY_SOURCES = mappings[ TARGET ].primary;
const SECONDARY_SOURCES = mappings[ TARGET ].secondary;

const PRIMARY_SOURCE_FILES = PRIMARY_SOURCES.map( function( source ) { return path.join( __dirname, pkg.dirs.source, [source, 'CSV'].join('.') ); });
const SECONDARY_SOURCE_FILES = SECONDARY_SOURCES.map( function( source ) { return path.join( __dirname, pkg.dirs.source, [source, 'CSV'].join('.') ); });

CSVDataPipeline( SECONDARY_SOURCES.concat( PRIMARY_SOURCES ), TARGET )
    .sources( PRIMARY_SOURCE_FILES, SECONDARY_SOURCE_FILES )
    .transformations( recipes[ TARGET ] )
    .target( TARGET_FILE );
