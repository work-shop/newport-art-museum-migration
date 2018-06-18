'use strict';

var RowValidator = require('./abstracts/row-validator.js').RowValidator;

const first_name_header = 'First_Name__c';
const last_name_header = 'Last_Name__c';
const middle_name_header = 'Middle_Name__c';

function is_well_formed( name ) {

    var pattern = /^[a-z ,.'-]+$/i;

    return pattern.test( name );

}

module.exports = RowValidator(
    'Checking for malformed names',
    'Valid_Name__f',
    'No malformed name fields found.',
    'Found malformed name fields!',
    function( row, i, rows, secondary_files ) {

        var first_name = row[ first_name_header ];
        var last_name = row[ last_name_header ];
        var middle_name = row[ middle_name_header ];

        return is_well_formed( first_name ) && (is_well_formed( middle_name) || middle_name === '' ) && is_well_formed( last_name );

    }
);
