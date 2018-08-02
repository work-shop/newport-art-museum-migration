'use strict';

/**
 * This file assigns compiled actions to named input files.
 * These input files are specified as environment variables
 * at runtime, and should correspond to CSV files that we're seeking
 * to construct for the salesforce import.
 */
var recipes = {};

recipes.NPSP_Import_Profile__c = require('./build-npsp-import.js');
recipes.NPSP_Import_Payments__c = require('./build-npsp-pledged-payments.js');


module.exports = recipes;
