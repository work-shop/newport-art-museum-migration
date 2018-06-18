'use strict';

var moment = require('moment');
var RowMap = require('./abstracts/row-operator.js').RowMap;


function format_date( date ) {

    if ( typeof date !== 'undefined' && date !== '' ) {

        try {

            var split_date = date.split('/');

            split_date = split_date.map( function( a ) {

                if ( a.length === 4 || a.length === 2 ) {

                    return a;

                } else if ( a.length === 1 ) {

                    return '0' + a;

                } else {

                    return 'error';

                }

            });

            var two_slashes = split_date.length == 3;

            var units_valid = split_date.reduce( function( a, b ) {

                var pattern = /^[0-9]+$/i;

                var is_number = pattern.test( b );

                return a && is_number && (b.length === 1 || b.length === 2 || b.length === 4 );

            }, true);

            return ( two_slashes && units_valid ) ? [split_date[2], split_date[1], split_date[0]].join('-') : '';

        } catch ( e ) {

            return '';

        }

    } else {

        return '';
    }

}


module.exports = function( datefields ) {

    if ( typeof datefields === 'string' ) {
        datefields = [ datefields ];
    }

    return RowMap(
        'Formatting date fields for salesforce',
        function( row ) {

            datefields.forEach( function( header ) {

                row[ header ] = format_date( row[ header ] );

            });

            return row;

        }
    );
}
