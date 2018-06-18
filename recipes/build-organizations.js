'use strict';

var Recipe = require('./recipe.js');


var reduce_to_organizations = require('./transformations/reduce-to-organizations.js');
var condense_solicit_codes = require('./transformations/condense-solicit-codes.js');
var relabel_organization_columns = require('./transformations/relabel-organization-columns.js');
var globally_unique_identifier = require('./transformations/globally-unique-identifier.js')( 'Record_Type__f', 'RE_ID__c' );
var organizations_sort_index = require('./transformations/sort-index-organizations.js');
var trim = require('./transformations/trim-nonfields.js');


module.exports = Recipe(
    'Build Organizations__c.',
    [
        'RE_ID__c',
        'Name__n',
        'Solicit_Codes__c'
    ],
    [
        reduce_to_organizations,
        condense_solicit_codes,
        relabel_organization_columns,
        globally_unique_identifier,
        organizations_sort_index,
        trim
    ],
    []
);
