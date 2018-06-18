'use strict';

var Recipe = require('./recipe.js');
var MembershipSalt = require('./salts.js').r__Memberships;

var condense_membership_categories = require('./transformations/condense-membership-categories.js');
var condense_membership_programs = require('./transformations/condense-membership-programs.js');
var format_dates = require('./transformations/reformat-dates.js')([ 'Start_Date__c', 'Expiration_Date__c', 'Last_Renewed_Date__c', 'Last_Dropped_Date__c', 'Last_Changed_Date__c' ]);
var relabel_membership_columns = require('./transformations/relabel-membership-columns.js');
var globally_unique_identifier = require('./transformations/globally-unique-identifier.js')( MembershipSalt, 'RE_ID__c' );
var membership_sort_index = require('./transformations/sort-index-memberships.js');
var trim = require('./transformations/trim-nonfields.js');

var check_membership_categories = require('./validations/check-membership-categories.js');
var check_membership_programs = require('./validations/check-membership-programs.js');


module.exports = Recipe(
    'Build Memberships__c.',
    [
        'RE_ID__c',
        'Name__n',
        'Start_Date__c',
        'Expiration_Date__c',
        'Last_Changed_Date__c',
        'Last_Dropped_Date__c',
        'Last_Renewed_Date__c',
        'Membership_Categories__c',
        'Membership_Program__c',
        'Membership_Status__c',
        'Total_Children__c',
        'Total_Members__c',
        'Total_Years_of_Membership__c',
        'Times_Renewed__c',
        'Consecutive_Years_of_Membership__c'
    ],
    [
        condense_membership_categories,
        condense_membership_programs,
        relabel_membership_columns,
        format_dates,
        globally_unique_identifier,
        membership_sort_index,
        trim
    ],
    [
        check_membership_categories,
        check_membership_programs,
        // TODO: need to check that valid dates exist for memberships that should have dates.
    ]
);
