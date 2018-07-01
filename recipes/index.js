'use strict';


var recipes = {};


// recipes[ 'Individual__c' ] = require('./build-individuals.js');
//
// recipes['Organization__c'] = require('./build-organizations.js');
//
// recipes[ 'Household__c' ] = require('./build-households.js');
//
// recipes['Gift__c'] = require('./build-gifts.js');
//
// recipes[ 'Membership__c' ] = require('./build-memberships.js');
//
// recipes['Card__c'] = require('./build-cards.js');

recipes['Contact1__a'] = require('./build-primary-contacts.js');

recipes['NPSP_Import_Profile__c'] = require('./build-base-npsp-import.js');


module.exports = recipes;
