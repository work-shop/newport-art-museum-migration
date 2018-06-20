'use strict';

var RowMap = require('./abstracts/row-operator.js').RowMap;

const contact_record_range = 5;

var phone_fields = [
    'Phone_type',
    'Phone_number',
    'Is_Primary',
    'Comments'
];

var phone_type_mapping = {
    'Alternate': 'Home Phone',
    'Assistant': 'Work Phone',
    'Business': 'Work Phone',
    'Business Alternate': 'Other Phone',
    'Car': 'Mobile Phone',
    'Cell': 'Mobile Phone',
    'Cell Alternate': 'Other Phone',
    'Direct': 'Home Phone',
    'Email': 'Personal Email',
    'Fax': 'Fax Phone',
    'gallery': 'Work Phone',
    'Home': 'Home Phone',
    'Home Alternate': 'Other Phone',
    'Home_1': 'Home Phone',
    'Phone1': 'Home Phone',
    'secondary address phone': 'Other Phone',
    'Spouse': null,
    'Summer': 'Summer Phone',
    'summer phone#': 'Summer Phone',
    'summer phone#_1': 'Summer Phone',
    'unknown': null,
    'unlisted number': null,
    'Web Site': null,
    'Wife cell': null,
    'Winter': 'Winter Phone',
    'winter phone': 'Winter Phone',
    'winter phone1': 'Winter Phone',
    'Work': 'Work Phone',
    'Work email': 'Work Email'
};


function phone_header( i, type ) { return 'CnPh_1_0' + i + '_' + type; }

function contact1_header( type ) { return 'Contact1 ' + type + ' __c'; }

function format( number ) { return number; }

function get_type( value ) { return ( value.indexOf( 'Email' ) !== -1) ? 'Email' : 'Phone'; }

function get_subtype( value ) { return ( value.indexOf(' Email') ) ? value.slice(0, value.indexOf(' Email' ) ) : value.slice(0, value.indexOf(' Phone') ); }


module.exports = RowMap(
    'Reformatting phones and emails',
    function( row ) {

        for ( var i = 1; i <= contact_record_range; i += 1 ) {

            var phone_values = phone_fields.map( function( suffix ) { return row[ phone_header( i, suffix ) ]; });

            var phone_type = phone_type_mapping[ phone_values[ 0 ] ];

            if ( typeof phone_type !== 'undefined' && phone_type != null ) {

                var formatted_value = format( phone_values[1] );

                row[ contact1_header( phone_type ) ] = formatted_value;

                if ( phone_values[ 2 ] !== 'No' ) {
                    row[ contact1_header( 'Preferred ' + get_type( phone_type ) ) ] = get_subtype( phone_type );
                }

            }

        }

        return row;

    }
);
