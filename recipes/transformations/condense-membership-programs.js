'use strict';

var RowMap = require('./abstracts/row-operator.js').RowMap;


var header = 'Membership_Program__c';
var premapping_header = 'Old_Membership_Program__c';

var mapping = {
    "General": "General",
    "Complimentary": "Complimentary",
    "Staff": "? (Complimentary)",
    "Corporate": "? (Complimentary)",
    "Faculty": "? (Complimentary)"
};

module.exports = RowMap(
    'Condensing Membership Programs',
    function( row ) {

        var proposed_change = mapping[ row['Mem_Program'] ];

        row[ premapping_header ] = row['Mem_Program'];

        row[ header ] = (typeof proposed_change !== 'undefined' ) ? proposed_change : "? (Unrecognized Type)";

        return row;

    }
);
