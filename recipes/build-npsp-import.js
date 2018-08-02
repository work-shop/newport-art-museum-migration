'use strict';

var Recipe = require('./recipe.js');
var fields = require('../fields.js').NPSPImport;

var npsp = require('./transformations/reduce-to-npsp-data.js');


module.exports = Recipe(
    'Build Base NPSP Import.',
    fields.headers,
    [
        npsp
    ],
    []
);
