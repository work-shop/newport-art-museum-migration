'use strict';

var Recipe = require('./recipe.js');


var reduce_to_individuals = require('./transformations/reduce-to-individuals.js');
var reduce_to_organizations = require('./transformations/reduce-to-organizations.js');

var filter_constituents = require('./transformations/filter-constituents.js');

var condense_solicit_codes = require('./transformations/condense-solicit-codes.js');
var concatinate_suffixes = require('./transformations/concatinate-suffixes.js');

var relabel_individual_columns = require('./transformations/relabel-individual-columns.js');
var individuals_sort_index = require('./transformations/individuals-sort-index.js');

var trim = require('./transformations/trim-nonfields.js');
var lift_to_dataframe = require('./transformations/lift-to-dataframe.js');

var duplicate_individuals = require('./validations/duplicate-individuals.js');





var recipes = {};

recipes[ 'Individuals__c' ] = Recipe(
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
        'From_Constituent__f'
    ],
    [
        reduce_to_individuals,
        filter_constituents,
        condense_solicit_codes,
        concatinate_suffixes,
        relabel_individual_columns,
        individuals_sort_index,
        trim
    ],
    [
        duplicate_individuals
    ]
);


module.exports = recipes;
