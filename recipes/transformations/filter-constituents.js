'use strict';

var RowFilter = require('./abstracts/row-operator.js').RowFilter;


var is_constituent = 'Is_Constituent__c';
var from_constituent = 'From_Constituent__f';


module.exports = RowFilter(
    'Filter duplicated constituents',
    function( row ) {

        return !( row[ is_constituent ] === 'Yes' && row[ from_constituent ] === 'No' );

    }
);
