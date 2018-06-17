'use strict';

var RowValidator = require('./abstracts/row-validator.js').RowValidator;

const first_name_header = 'First_Name__c';
const last_name_header = 'Last_Name__c';
const middle_name_header = 'Middle_Name__c';

function pred( i ) { return i - 1; }
function succ( i ) { return i + 1; }

function duplicates( fn, ln, mn, index, update, rows, row ) {

    if ( typeof rows[ index ] !== 'undefined' && rows[ index ][ first_name_header ] === fn && rows[ index ][ last_name_header ] === ln ) {

        if ( typeof rows[ index ][ middle_name_header ] !== 'undefined' && rows[ index ][ middle_name_header ] !== mn ) {

            return 0;

        } else {

            return 1 + duplicates( fn, ln, mn, update( index ), update, rows );

        }

    } else {

        return 0;

    }
}


module.exports = RowValidator(
    'Checking for Possible Duplicate Individual',
    'Is_Unique__f',
    'No duplicates found',
    'Found possible duplicates!',
    function( row, i, rows, secondary_files ) {

        var first_name = row[ first_name_header ];
        var last_name = row[ last_name_header ];
        var middle_name = row[ middle_name_header ];

        var j_l = i - 1;
        var j_h = i + 1;

        return (duplicates( first_name, last_name, middle_name, j_l, pred, rows ) + duplicates( first_name, last_name, middle_name, j_h, succ, rows )) == 0;

    }
);
