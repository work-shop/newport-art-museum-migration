'use strict';


var recipes = {};


recipes[ 'Individual__c' ] = require('./build-individuals.js');

recipes['Organization__c'] = require('./build-organizations.js');

recipes[ 'Household__c' ] = require('./build-households.js');

recipes['Gift__c'] = require('./build-gifts.js');

recipes[ 'Membership__c' ] = require('./build-memberships.js');

recipes['Card__c'] = require('./build-cards.js');


module.exports = recipes;
