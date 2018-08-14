'use strict';

var merge = require('./objects.js').merge;
var validateAddress = require('./validate-address.js');
var normalizeAddressType = require('./normalize-npsp-types.js').normalizeAddressType;
var normalizeSeasonalMonth = require('./normalize-npsp-types.js').normalizeAddressType;
var normalizeSeasonalDay = require('./normalize-npsp-types.js').normalizeAddressType;



function formatAddress( prefix, constituent ) {

    var address = {};

    address[ 'Mailing City' ] = constituent[ prefix + '_City' ];
    address[ 'Mailing State/Province' ] = constituent[ prefix + '_State' ];
    address[ 'Mailing Zip/Postal Code' ] = constituent[ prefix + '_ZIP' ];
    address[ 'Mailing Country' ] = constituent[ prefix + '_ContryLongDscription' ];
    address = merge( address, formatStreet( prefix + '_', constituent, ', ', 'Mailing' ) );

    address = validateAddress( 'Mailing', address );

    address[ 'Address Type' ] = normalizeAddressType( prefix, constituent );

    address['Default Address'] = (constituent[ prefix + '_Preferred'] === 'Yes') ? 1 : 0;

    if ( isSeasonalAddress( prefix, constituent ) ) {

        address = merge( address, getSeasonalDates( prefix, constituent ) );

    }

    return address;

}


function isSeasonalAddress( prefix, constituent ) {
    return constituent[ prefix + '_Seasonal'] === 'Yes' &&
           constituent[ prefix + '_Seasonal_From'].length > 0 &&
           constituent[ prefix + '_Seasonal_To'].length > 0

}

function getSeasonalDates( prefix, constituent ) {

    var seasonal_from = constituent[ prefix + '_Seasonal_From' ].split('/');
    var seasonal_to = constituent[ prefix + '_Seasonal_To' ].split('/');

    if ( seasonal_from.length !== 2 || seasonal_to.length !== 2 ) {

        return {};

    } else {

        return {
            'Seasonal Start Month': seasonal_from[0],
            'Seasonal Start Day': seasonal_from[1],
            'Seasonal End Month': seasonal_to[0],
            'Seasonal End Day': seasonal_to[1],
        };

    }


}

/**
 * Get the primary address for a constituent.
 */
function formatStreet( prefix, row, sep = ', ', result_prefix = 'Home' ) {

    var street = '';

    var l1 = row[ prefix + 'Addrline1'];
    var l2 = row[ prefix + 'Addrline2'];
    var l3 = row[ prefix + 'Addrline3'];

    if ( typeof l1 !== 'undefined' && l1 !== '' ) {
        street += l1;
    }

    if ( typeof l2 !== 'undefined' && l2 !== '' ) {
        street += sep + l2;
    }

    if ( typeof l3 !== 'undefined' && l3 !== '' ) {
        street += sep + l3;
    }

    var result = {}
    result[ result_prefix + ' Street' ] = street;

    return result;

}


module.exports = {
    formatAddress : formatAddress,
    formatStreet: formatStreet
};
