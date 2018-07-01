'use strict'

var RowMapReduce = require('./abstracts/row-operator.js').RowMapReduce;

const contact1_addresses_count = 5;

const contact1_phones_count = 5;

const contact1_individual_relations = 5;

const contact1_organizational_relations = 5;

module.exports = RowMapReduce(
    '(Constituents × Individual Relations × Gifts × Memberships) → NPSP_Import',
    function( row ) {

        if ( isIndividualConstituent( row ) ) {

            var result = [];

            var contact1_row = makeContact1( row );


            if ( individualConstituentHasSpouse( row ) ) {

                var spouse = makeContact2forContact1( 'CnSpSpBio_', 'CnSpPh', 3, row );

                result.push( duplicateWith( contact1_row, spouse ) );

            }


            // for ( var i = 0; i < contact1_individual_relations; i += 1 ) {
            //
            //     var prefix = makeIndexedPrefix('CnRelInd', '1', i );
            //
            //     if ( individualConstituentHasRelation( prefix, row ) && individualRelationIsNotSpouse( prefix, row ) ) {
            //
            //         var rel = makeContact2forContact1( prefix, prefix + 'Ph', 5, row );
            //
            //         result.push( duplicateWith( contact1_row, rel ) );
            //
            //     }
            //
            // }

            for ( var i = 0; i < contact1_organizational_relations; i += 1 ) {

                var prefix = makeIndexedPrefix('CnRelOrg', '1', i );

                if ( individualConstituentHasAccountRelation( prefix, row ) ) {

                    var rel = makeAccount1forContact1( prefix, prefix + 'Ph', 5, row );

                    result.push( duplicateWith( contact1_row, rel ) );

                }

            }




            // if ( result.length === 0 ) {
            //
            //     result.push( contact1_row );
            //
            // }


            return result;

        } else {

            // TODO: Implement

            return [];

        }

    }
);


function makeContact1( row ) {

    var contact1_row = makeSurjectiveMappingWith({
        'CnBio_Birth_date' : 'Contact1 Birthdate __c',
        'CnBio_Title_1' : 'Contact1 Salutation __c',
        'CnBio_First_Name' : 'Contact1 First Name __c',
        'CnBio_Last_Name' : 'Contact1 Last Name __c',
        'CnBio_Middle_Name' : 'Contact1 Middle Name __c',
        'CnBio_System_ID' : 'Contact1 RE Migration ID __c'
    })( row );

    var contact1_primary_address_street = makeStreet( 'CnAdrPrf_', row, ', ' );

    var contact1_primary_address = makeSurjectiveMappingWith({
        'CnAdrPrf_City': 'Home City __c',
        'CnAdrPrf_State': 'Home State/Province __c',
        'CnAdrPrf_ZIP': 'Home Zip/Postal Code __c',
        'CnAdrPrf_ContryLongDscription': 'Home Country __c'
    })( row );

    contact1_primary_address = merge( contact1_primary_address, contact1_primary_address_street );
    contact1_row = merge( contact1_row, contact1_primary_address );

    var contact1_phones_and_emails = {};

    for ( var i = 1; i <= contact1_phones_count; i += 1 ) {

         var record = makePhonesAndEmails( makeIndexedPrefix('CnPh', '1', i ), 'Contact1', row );
         contact1_phones_and_emails = merge( contact1_phones_and_emails, record );

    }

    return merge( contact1_row, contact1_phones_and_emails );

}


function makeContact2forContact1( contact_prefix, phone_prefix, contact_phones_count,  row ) {

    var mapping = {};

    mapping[ contact_prefix + 'Birth_date' ] = 'Contact2 Birthdate __c';
    mapping[ contact_prefix + 'Title_1' ] = 'Contact2 Salutation __c';
    mapping[ contact_prefix + 'First_Name' ] = 'Contact2 First Name __c';
    mapping[ contact_prefix + 'Last_Name' ] = 'Contact2 Last Name __c';
    mapping[ contact_prefix + 'Middle_Name' ] = 'Contact2 Middle Name __c';
    mapping[ contact_prefix + 'System_ID' ] = 'Contact2 RE Migration ID __c';

    var contact_row = makeSurjectiveMappingWith( mapping )( row );

    var contact_phones_and_emails = {};

    for ( var i = 1; i <= contact_phones_count; i += 1 ) {

         var record = makePhonesAndEmails( makeIndexedPrefix( phone_prefix, '1', i ), 'Contact2', row );
         contact_phones_and_emails = merge( contact_phones_and_emails, record );

    }

    return merge( contact_row, contact_phones_and_emails );

}

function makeAccount1forContact1( account_prefix, phone_prefix, contact_phones_count, row ) {

    var mapping = {};

    mapping[ account_prefix + 'Org_Name' ] = 'Account1 Name __c';
    mapping[ account_prefix + 'Adr_City' ] = 'Account1 City __c';
    mapping[ account_prefix + 'Adr_State' ] = 'Account1 State/Province __c';
    mapping[ account_prefix + 'Adr_ZIP' ] = 'Account1 Zip/Postal Code __c';
    mapping[ account_prefix + 'Adr_ContryLongDscription' ] = 'Account1 Country __c';
    mapping[ account_prefix + 'System_ID' ] = 'Account1 RE Migration ID __c';
    mapping[ account_prefix + 'Ph_1_01_Phone_number' ] = 'Account1 Phone __c';

    var account_row = makeSurjectiveMappingWith( mapping )( row );

    account_row['Account1 Street __c'] = makeStreet( account_prefix, row, ', ' )[ 'Home Street __c' ];

    return account_row;

}



function makeIndexedPrefix( prefix, i, j ) {
    return prefix + '_' + i + '_' + ((('' + j).length == 2 ) ? j : ('0' + j) ) + '_';
}

/**
 * Get the primary address for a constituent.
 */
function makeStreet( prefix, row, sep = ', ' ) {

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

    return { 'Home Street __c': street };

}

function isIndividualConstituent( row ) {
    return row.CnBio_First_Name !== '' && row.CnBio_Last_Name !== '' && row.CnBio_Org_Name === '';
}

function individualConstituentHasSpouse( row ) {
    return row.CnSpSpBio_First_Name !== '' && row.CnSpSpBio_Last_Name !== '';
}

function individualConstituentHasRelation( prefix, row ) {
    return row[ prefix + 'First_Name' ] !== '' && row[ prefix + 'Last_Name' ] !== '';
}

function individualRelationIsNotSpouse( prefix, row ) {
    return row[ prefix + 'Is_Spouse'] !== 'Yes';
}

function individualConstituentHasAccountRelation( prefix, row ) {
    return row[ prefix + 'Org_Name' ] !== '';
}


function merge( rowA, rowB ) { return Object.assign( rowA, rowB ); }

function duplicateWith( rowA, rowB ) { return Object.assign( Object.assign( {}, rowA ), rowB ); }


function makeSurjectiveMappingWith( mapping, seperator = ', ' ) {
    return function ( row ) {

        var result = {};
        var seen = {};

        for ( var header in mapping ) {
            if ( mapping.hasOwnProperty( header ) ) {

                if ( typeof ( seen[ mapping[ header ] ] ) !== 'undefined' ) {

                    result[ mapping[ header ] ] += seperator + ( typeof row[ header ] !== 'undefined' ) ? row[ header ] : '';

                } else {

                    result[ mapping[ header ] ] = ( typeof row[ header ] !== 'undefined' ) ? row[ header ] : '';
                    seen[ mapping[ header] ] = true;

                }


            }
        }

        return result;
    }
}

/**
 * Make Phones and Emails for Contact
 */
function makePhonesAndEmails( pre_header_prefix, post_header_prefix, row ) {

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
        'Fax': null,
        'gallery': 'Work Phone',
        'Home': 'Home Phone',
        'Home Alternate': 'Other Phone',
        'Home_1': 'Home Phone',
        'Phone1': 'Home Phone',
        'secondary address phone': 'Other Phone',
        'Spouse': null,
        'Summer': 'Other Phone',
        'summer phone#': 'Other Phone',
        'summer phone#_1': 'Other Phone',
        'unknown': null,
        'unlisted number': null,
        'Web Site': null,
        'Wife cell': null,
        'Winter': 'Other Phone',
        'winter phone': 'Other Phone',
        'winter phone1': 'Other Phone',
        'Work': 'Work Phone',
        'Work email': 'Work Email'
    };


    function header( type ) { return post_header_prefix + ' ' + type + ' __c'; }

    function format( number ) { return number; }

    function get_type( value ) { return ( value.indexOf( 'Email' ) !== -1) ? 'Email' : 'Phone'; }

    function get_subtype( value ) { return ( value.indexOf(' Email') !== -1 ) ? value.slice(0, value.indexOf(' Email' ) ) : value.slice(0, value.indexOf(' Phone') ); }


    var result = {};

    var phone_values = phone_fields.map( function( suffix ) { return row[ pre_header_prefix + suffix ]; });

    var phone_type = phone_type_mapping[ phone_values[ 0 ] ];

    if ( typeof phone_type !== 'undefined' && phone_type != null ) {

        var formatted_value = format( phone_values[1] );

        result[ header( phone_type ) ] = formatted_value;

        if ( phone_values[ 2 ] !== 'No' ) {
            result[ header( 'Preferred ' + get_type( phone_type ) ) ] = get_subtype( phone_type );
        }

    }

    return result;

}
