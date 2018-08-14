'use strict';

var formatAddress = require('./extensions/format-address.js').formatAddress;
var RowMapReduce = require('./abstracts/row-operator.js').RowMapReduce;

const address_prefix = 'CnAdrAll_1_0';

module.exports = RowMapReduce(
    '(Constituents) → NPSP_Address_Import',
    function( row ) {

        var result = [];

        var constituent_id = row.CnBio_System_ID;

        for ( var i = 0; i <= 4; i += 1 ) {

            var address = formatAddress( address_prefix + i, row );

            if ( addressExists( address ) ) {

                address['Raiser\'s Edge ID'] = constituent_id;

                result.push( address );

            }

        }

        return result;

    }
);

function addressExists( address ) { return address['Mailing Street'].length > 0; }
