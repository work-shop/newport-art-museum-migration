'use strict';

var RowMap = require('./abstracts/row-operator.js').RowMap;


var membership_category_header = 'Membership_Categories__c';
var premapping_membership_category_header = 'Old_Membership_Categories__c';

var membership_category_mapping = {
    "Artist's Guild-Household": "? (Not sure)",
    "Benefactor Membership": "Benefactor",
    "Conklin Shop Staff": "Staff",
    "Contributing Membership": "? (Contributing Membership)", // Validate where this should go?
    "Council Membership": "Council",
    "Faculty Membership": "Faculty",
    "gift certificate for household membership": "? (Not sure)", // Validate where this should go?
    "Family Membership": "? (Family Membership)", // Validate where this should go?
    "Griffon Shop Staff": "Staff",
    "Househeld Membership": "Household", // I assume that a househeld membership is a household membershop
    "Household Membership": "Household",
    "Household Membership-Staff": "Staff", // I assume that household membership "staff" should be a "staff" membership?
    "Individual Membership": "Individual",
    "LIFE Membership": "Life",
    "Military Household": "Military Household",
    "Military Household Membership": "Military Household",
    "Military Individual Membership": "Military",
    "MUSE Student Membership": "Student", // I assume that muse student should be a student membership?
    "Partners in Art B&B": "B&B",
    "Partners in Art Library": "Library",
    "Partners in Art-General": "? (Not sure)", // not sure where this should go
    "Partners in Art-nonprofit service organization": "? (Not sure)", // Not Sure where this should go.
    "Patron Membership": "Patron",
    "Patron Membership-Honorarium": "? (Patron)", // I Assume mapping Patron Membership to Patron is correct
    "Photo Guild": "Photo Guild",
    "Senior": "Senior",
    "Senior Family Membership": "? (Senior Household)",
    "Senior Household": "Senior Household",
    "Senior Household Membership": "Senior Household",
    "Senior Membership": "Senior",
    "Small Business": "? (Not sure)", // Check where this should go
    "Staff Membership": "Staff",
    "Student Membership": "Student",
    "Student Membership-MUSE": "Student",
    "Supporting  Membership": "Supporting",
    "Supporting Membership": "Supporting",
    "University Membership": "University",
    "Young Benefactor Membership": "? (Benefactor)" // Should this go to Benefactor
};

module.exports = RowMap(
    'Condensing Membership Categories',
    function( row ) {

        var proposed_change = membership_category_mapping[ row['Mem_Category'] ];

        row[ premapping_membership_category_header ] = row['Mem_Category'];

        row[ membership_category_header ] = (typeof proposed_change !== 'undefined' ) ? proposed_change : "? (Unrecognized Type)";

        return row;

    }
);
