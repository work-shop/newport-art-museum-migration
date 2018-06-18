'use strict';

var Recipe = require('./recipe.js');

var reduce_to_individuals = require('./transformations/reduce-to-individuals.js');
var filter_constituents = require('./transformations/filter-constituents.js');
var condense_solicit_codes = require('./transformations/condense-solicit-codes.js');
var concatinate_suffixes = require('./transformations/concatinate-suffixes.js');
var relabel_individual_columns = require('./transformations/relabel-individual-columns.js');
var reformat_individual_date_fields = require('./transformations/reformat-dates.js')([ 'Birthday__c' ]);
var globally_unique_identifier = require('./transformations/globally-unique-identifier.js')( 'Record_Type__f', 'RE_ID__c' );
var individuals_sort_index = require('./transformations/sort-index-individuals.js');
var trim = require('./transformations/trim-nonfields.js');

var check_duplicate_individuals = require('./validations/duplicate-individuals.js');
var check_malformed_names = require('./validations/malformed-names.js');


module.exports = Recipe(
    'Build Individuals__c.',
    [
        'RE_ID__c',
        'RE_Constituent_ID__c',
        'First_Name__c',
        'Middle_Name__c',
        'Last_Name__c',
        'Suffixes__c',
        'Birthday__c',
        'Salutation__c',
        'RE_No_Valid_Address__f',
        'Is_Constituent__c',
        'From_Constituent__f',
        'Name__n',
        'Solicit_Codes__c'
    ],
    [
        reduce_to_individuals,
        filter_constituents,
        condense_solicit_codes,
        concatinate_suffixes,
        relabel_individual_columns,
        reformat_individual_date_fields,
        globally_unique_identifier,
        individuals_sort_index,
        trim
    ],
    [
        check_duplicate_individuals,
        check_malformed_names
    ]
);
