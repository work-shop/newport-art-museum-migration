'use strict';

var RowMap = require('./abstracts/row-operator.js').RowMap;

const contact_record_range = 3;

var address_headers = [
    'Type',
    'Address',
    'City',
    'State',
    'ZIP',
    'ContryLongDscription',
    'Is_Primary',
    'Seasonal',
    'Seasonal_From',
    'Seasonal_To',
];

var final_fields_mapping = {
    'Street' : 'Address',
    'City': 'City',
    'State/Province' : 'State',
    'Zip/Postal': 'ZIP',
    'Country': 'ContryLongDscription'
};

var address_type_mapping = {
    'Home': 'Home',
    'Alternate': 'Alternate',
    'Bad Address': null,
    'Business': null,
    'Former Address': 'Former',
    'Mailing': 'Mailing',
    'No Mail at this Address': null,
    'o': null,
    'Physical Address (still use PO Box)': null,
    'Preferred': 'Home',
    'Previous Address': 'Former',
    'Previous Address - may still be ok': null,
    'School': null,
    'Seasonal 1': 'Seasonal 1',
    'Seasonal 2': 'Seasonal 2',
    'Temporarily Suspended': null,
    'Winder Address': 'Seasonal 3'
};


function address_header( i, type ) { return 'CnAdrAll_1_0' + i + '_' + type; }

function contact1_header( type ) { return type + ' __c'; }

function pad_ZIP( zip ) { return (('' + zip).length === 4) ? '0' + zip : '' + zip; }

function strip_address_postfix( address, city, state, zip ) {
    return address.slice( 0, address.indexOf( [' ', city, ', ', state, '  ', zip ].join('') ) );
}


module.exports = RowMap(
    'Reformatting addresses',
    function( row ) {

        for ( var i = 1; i <= contact_record_range; i += 1 ) {

            var address_fields = address_headers.map( function( suffix ) { return row[ address_header( i, suffix ) ]; });

            var address_type = address_type_mapping[ address_fields[0] ];

            if ( typeof address_type !== 'undefined' && address_type != null ) {

                var country = address_fields[ 5 ];
                var zip = pad_ZIP( address_fields[ 4 ] );
                var state = address_fields[ 3 ];
                var city = address_fields[ 2 ];
                var street = strip_address_postfix( address_fields[ 1 ], city, state, zip );

                row[ contact1_header( [ address_type, 'Country'].join(' ') ) ] = country;
                row[ contact1_header( [ address_type, 'Zip/Postal Code'].join(' ') ) ] = zip;
                row[ contact1_header( [ address_type, 'State/Province'].join(' ') ) ] = state;
                row[ contact1_header( [ address_type, 'City'].join(' ') ) ] = city;
                row[ contact1_header( [ address_type, 'Street'].join(' ') ) ] = street;

            }

        }

        return row;

    }
);
