'use strict';

var RowMap = require('./abstracts/row-operator.js').RowMap;

var sort_index_header = 'Sort_Index__f';

module.exports = RowMap(
    'Setting sort-index',
    function( row ) {

        row[ sort_index_header ] = row[ 'Name__n' ];

        return row;

    }
);
