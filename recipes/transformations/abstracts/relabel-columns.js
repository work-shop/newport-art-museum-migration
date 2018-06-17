"use strict";

var RowMap = require('./row-operator.js').RowMap;

module.exports = function( name_mapping ) {

    return RowMap(
        'Relabeling columns',
        function( row ) {

            for ( var header in name_mapping ) {
                if ( name_mapping.hasOwnProperty( header ) ) {
                    if ( typeof row[ header ] !== 'undefined' ) {

                        row[ name_mapping[ header ] ] = row[ header ];

                    }
                }
            }

            return row;

        }
    );

}
