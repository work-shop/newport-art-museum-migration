'use strict';

var RowMap = require('./abstracts/row-operator.js').RowMap;

var sort_index_header = 'Sort_Index__f';
var last_name_header = 'Contact1 Last Name __c';
var first_name_header = 'Contact1 First Name __c'

module.exports = RowMap(
    'Setting sort-index',
    function( row ) {

        row[ sort_index_header ] = row[ last_name_header ] + ', ' + row[ first_name_header ];

        return row;

    }
);
