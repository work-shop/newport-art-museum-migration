'use strict';

var RowValidator = require('./abstracts/row-validator.js').RowValidator;

var membership_category_header = 'Membership_Categories__c';

module.exports = RowValidator(
    'Checking for valid membership categories',
    'Has_Valid_Categories__f',
    'No invalid categories found!',
    'Found potentially invalid categories!',
    function( row, i, rows, secondary_files ) {

        var category = row[ membership_category_header ];

        return !category.startsWith('?');

    }
);
