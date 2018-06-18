'use strict';

var RowValidator = require('./abstracts/row-validator.js').RowValidator;

var membership_category_header = 'Membership_Program__c';

module.exports = RowValidator(
    'Checking for valid membership programs',
    'Has_Valid_Programs__f',
    'No invalid programs found!',
    'Found potentially invalid programs!',
    function( row, i, rows, secondary_files ) {

        var category = row[ membership_category_header ];

        return !category.startsWith('?');

    }
);
