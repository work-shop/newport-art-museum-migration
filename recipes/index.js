'use strict';

var condense_solicit_codes = require('./transformations/condense-solicit-codes.js');
var reduce_to_individuals = require('./transformations/reduce-to-individuals.js');
var lift_to_dataframe = require('./transformations/lift-to-dataframe.js');
var relabel_columns = require('./transformations/relabel-columns.js');
var concatinate_suffixes = require('./transformations/concatinate-suffixes.js');

var get_transformation = require('./get-transformation.js');
var name = require('./name.js');


var recipes = {};


recipes[ name( 'r__Constituents', 'Individuals__c' ) ] = [

    reduce_to_individuals,
    condense_solicit_codes,
    concatinate_suffixes.transformation,
    relabel_columns

]


module.exports = recipes;
