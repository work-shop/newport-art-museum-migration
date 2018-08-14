'use strict';

var Recipe = require('./recipe.js');
var fields = require('../fields.js').NPSPImportAddresses;

var npsp_addresses = require('./transformations/reduce-to-npsp-address-data.js');


module.exports = Recipe(
    'Build Enriched NPSP Account Addresses.',
    fields.headers,
    [
        npsp_addresses
    ],
    []
);
