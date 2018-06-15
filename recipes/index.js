'use strict';

var reduce_to_individuals = require('./transformations/reduce-to-individuals.js');
var reduce_to_organizations = require('./transformations/reduce-to-organizations.js');


var condense_solicit_codes = require('./transformations/condense-solicit-codes.js');

var lift_to_dataframe = require('./transformations/lift-to-dataframe.js');
var relabel_columns = require('./transformations/relabel-columns.js');
var concatinate_suffixes = require('./transformations/concatinate-suffixes.js');

var get_transformation = require('./get-transformation.js');


var recipes = {};


recipes[ 'Individuals__c' ] = [

    reduce_to_individuals,
    condense_solicit_codes,
    concatinate_suffixes,
    relabel_columns

].map( get_transformation );


recipes[ 'Organizations__c' ] = [

    reduce_to_organizations,
    condense_solicit_codes,
    relabel_columns

].map( get_transformation );


module.exports = recipes;
