'use strict';

var addressParser = require('parse-address');

module.exports = function( prefix, row ) {

    var street = row[ prefix + ' Street' ];
    var city = row[ prefix + ' City' ];
    var state = row[ prefix + ' State/Province' ];
    var zip = row[ prefix + ' Zip/Postal Code' ];
    var country = row[ prefix + ' Country' ];

    var address_text = [ street.replace(',', '', 'g'), city, state + ' ' + zip, country ].join(', ')
    var address = addressParser.parseLocation( address_text );

    if (
           address && address !== null
        && typeof address.street !== 'undefined'
        && typeof address.type !== 'undefined'
        && typeof address.city !== 'undefined'
        && typeof address.state !== 'undefined'
        && typeof address.zip !== 'undefined'
    ) {

        row[ prefix + ' Country' ] = 'United States';

    } else {

        if ( street.toLowerCase().indexOf('address') !== -1 ) {

            row[ 'FLAG: Bad Address' ] = 'Y';

        } else if ( street.toLowerCase().indexOf( 'dupe' ) !== -1 ) {

            row[ 'FLAG: Bad Address' ] = 'Y';
            row[ 'FLAG: Duplicate Record' ] = 'Y';

        } else if ( street === '' ) {

            row[ 'FLAG: Bad Address' ] = 'Y';

        }

    }

    return row;

}
