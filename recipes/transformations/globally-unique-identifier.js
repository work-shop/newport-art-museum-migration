'use strict';

var md5 = require('md5');

var RowMap = require('./abstracts/row-operator.js').RowMap;

var id_index_header = 'Unique_Migration_ID__f';

module.exports = function( salt_header, id_header ) {
    return RowMap(
        'Setting unique migration id.',
        function( row ) {

            row[ id_index_header ] = md5( row[ salt_header ] + row[ id_header ] );

            return row;

        }
    );
}
