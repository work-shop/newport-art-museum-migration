'use strict';

var RowFilter = require('./abstracts/row-operator.js').RowFilter;




module.exports = RowFilter(
    'Filter duplicated constituents',
    function( row ) {

        return typeof row.Gf_Type !== 'undefined' && row.Gf_Type.toLowerCase() === 'pledge';

    }
);
