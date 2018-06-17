'use strict';

var RowMap = require('./abstracts/row-operator.js').RowMap;

module.exports = RowMap(
    'Trimming column-set',
    function( row ) {

        for ( var header in row ) {

            if ( header.lastIndexOf( '__' ) !== header.length - 3 )  {

                delete row[ header ];

            }

        }

        return row;

    }
);
