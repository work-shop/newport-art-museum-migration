'use strict'


var unique = require('array-unique');
var Phone = require('us-phone-parser');
var makeAddress = require('addressit');
var addressParser = require('parse-address');

var merge = require('./extensions/objects.js').merge;
var duplicateWith = require('./extensions/objects.js').duplicateWith;
var makeSurjectiveMappingWith = require('./extensions/objects.js').makeSurjectiveMappingWith;

var format_date = require('./extensions/format-date.js');
var reformatGiftsToDonationsAndPayments = require('./extensions/reduce-npsp-donations.js');
var RowMapReduce = require('./abstracts/row-operator.js').RowMapReduce;

const contact1_addresses_count = 5;

const contact1_phones_count = 5;

const contact1_individual_relations = 5;

const contact1_organizational_relations = 5;


module.exports = RowMapReduce(
    '(Constituents × Gifts) → NPSP_Import',
    function( row, secondaries ) {

        var result = [];

        var gifts = secondaries[0];
        var memberships_by_constituent_id = secondaries[1];


        if ( isIndividualConstituent( row ) ) {

            // Create a Contact1 representing this Head of Household.
            var contact1_row = makeContact1( row );
            var contact1_primary_affiliations = duplicateWith( contact1_row, {});

            // Create a Spouse for the Constituent, if Relevant.
            if ( individualConstituentHasSpouse( row ) ) {

                var spouse = makeContact2forContact1( 'CnSpSpBio_', 'CnSpPh', 3, row );

                contact1_primary_affiliations = merge( contact1_primary_affiliations, spouse );

            }

            // Create a primary affiliation for the contact if present.
            if ( individualConstituentHasPrimaryAccount( row ) ) {

                var account = makeAccount1forContact1('CnPrBs_', 'CnPrBsPh', 5, row );

                contact1_primary_affiliations = merge( contact1_primary_affiliations, account );

            }

            result.push( contact1_primary_affiliations );

            var contact1_gifts = reformatGiftsToDonationsAndPayments(
                'Contact1',
                contact1_row,
                gifts,
                memberships_by_constituent_id,
                row
            );

            contact1_gifts.forEach( function( donation_row ) {

                if ( donation_row['Donation Type'] !== 'Pledge' || donation_row['Payment Paid'] === 0 ) {
                    result.push( duplicateWith( contact1_row, donation_row ) );
                }



            });

        } else if ( isOrganizationalConstituent( row ) ) {


            var account1_row = makeAccount1( row );

            result.push( account1_row );

            var account1_gifts = reformatGiftsToDonationsAndPayments(
                'Account1',
                account1_row,
                gifts,
                memberships_by_constituent_id,
                row
            );

            account1_gifts.forEach( function( donation_row ) {

                if ( donation_row['Donation Type'] !== 'Pledge' || donation_row['Payment Paid'] === 0 ) {
                    result.push( duplicateWith( contact1_row, donation_row ) );
                }

            });

        }

        return result;

    }
);



/**
 * Make a primary Contact1 record for a given head-of-household in the RE export.
 */
function makeContact1( row ) {

    var contact1_row = makeSurjectiveMappingWith({
        'CnBio_Birth_date' : 'Contact1 Birthdate',
        'CnBio_Title_1' : 'Contact1 Salutation',
        'CnBio_First_Name' : 'Contact1 First Name',
        'CnBio_Last_Name' : 'Contact1 Last Name',
        'CnBio_Middle_Name' : 'Contact1 Middle Name',
        'CnBio_System_ID' : 'Contact1 RE ID',
        'CnBio_Gender' : 'Contact1 Gender',
    })( row );

    contact1_row['Contact1 Birthdate'] = format_date( contact1_row['Contact1 Birthdate'] );
    contact1_row['Contact1 Gender'] = normalizeGenderRep( contact1_row['Contact1 Gender']  );
    contact1_row['Contact1 Solicit Codes'] = condenseSolicitCodes( row );
    contact1_row['Contact1 Constituent Codes'] = condenseConstituentCodes( row );
    contact1_row['Contact1 Salutation'] = condenseSalutation( 'CnBio_', row );
    contact1_row['Contact1 Suffix'] = condenseSuffix( row['CnBio_Suffix_1'], row['CnBio_Suffix_2'] );

    var contact1_primary_address_street = makeStreet( 'CnAdrPrf_', row, ', ' );

    var contact1_primary_address = makeSurjectiveMappingWith({
        'CnAdrPrf_City': 'Home City',
        'CnAdrPrf_State': 'Home State/Province',
        'CnAdrPrf_ZIP': 'Home Zip/Postal Code',
        'CnAdrPrf_ContryLongDscription': 'Home Country'
    })( row );

    contact1_primary_address = validateAddress( 'Home', merge( contact1_primary_address, contact1_primary_address_street ) );

    contact1_row = merge( contact1_row, contact1_primary_address );

    var contact1_phones_and_emails = {};

    for ( var i = 1; i <= contact1_phones_count; i += 1 ) {

         var record = makePhonesAndEmails( makeIndexedPrefix('CnPh', '1', i ), 'Contact1', row );
         contact1_phones_and_emails = merge( contact1_phones_and_emails, record );

    }

    if ( typeof contact1_phones_and_emails['Contact1 Home Phone'] !== 'undefined' && contact1_phones_and_emails['Contact1 Home Phone'].length > 0 ) {
        contact1_phones_and_emails['Household Phone'] = contact1_phones_and_emails['Contact1 Home Phone'];
    }

    return merge( contact1_row, contact1_phones_and_emails );

}



/**
 * Build a self-contained account row.
 */
function makeAccount1( row ) {

    var mapping = {};

    mapping[ 'CnBio_Org_Name' ] = 'Account1 Name';
    mapping[ 'CnBio_System_ID' ] = 'Account1 RE ID';

    var account1_row = makeSurjectiveMappingWith( mapping )(row);

    account1_row['Account1 Solicit Codes'] = condenseSolicitCodes( row );
    account1_row['Account1 Constituent Codes'] = condenseConstituentCodes( row );

    var account1_phones_and_emails = {};

    for ( var i = 1; i <= contact1_phones_count; i += 1 ) {
        account1_phones_and_emails = merge( account1_phones_and_emails, makePhonesAndEmails( makeIndexedPrefix('CnPh', '1', i ), 'Account1', row ) );
    }

    var account1_phone = selectPrimaryPhoneForAccount( account1_phones_and_emails );

    account1_row['Account1 Phone'] = account1_phone;

    var account1_primary_address = makeSurjectiveMappingWith({
        'CnAdrPrf_City': 'Account1 City',
        'CnAdrPrf_State': 'Account1 State/Province',
        'CnAdrPrf_ZIP': 'Account1 Zip/Postal Code',
        'CnAdrPrf_ContryLongDscription': 'Account1 Country'
    })( row );

    account1_primary_address['Account1 Street'] = makeStreet( 'CnAdrPrf_', row, ', ' )['Home Street'];

    account1_row = merge( account1_row, account1_primary_address );

    return account1_row;

}


/**
 * Puts the gender of the constituent into Salesforce normal representation.
 */
function normalizeGenderRep( rep ) {

    rep = rep || '';

    if ( rep === 'Male' || rep === 'Female' ) {

        return rep;

    } else {

        return 'Neutral';

    }
}


/**
 * Associate a secondary contact with this Contact1 Household.
 */
function makeContact2forContact1( contact_prefix, phone_prefix, contact_phones_count,  row ) {

    var mapping = {};

    mapping[ contact_prefix + 'Birth_date' ] = 'Contact2 Birthdate';
    mapping[ contact_prefix + 'Title_1' ] = 'Contact2 Salutation';
    mapping[ contact_prefix + 'First_Name' ] = 'Contact2 First Name';
    mapping[ contact_prefix + 'Last_Name' ] = 'Contact2 Last Name';
    mapping[ contact_prefix + 'Middle_Name' ] = 'Contact2 Middle Name';
    mapping[ contact_prefix + 'System_ID' ] = 'Contact2 RE ID';
    mapping[ contact_prefix + 'Gender' ] = 'Contact2 Gender';

    var contact_row = makeSurjectiveMappingWith( mapping )( row );

    contact_row['Contact2 Birthdate'] = format_date( contact_row['Contact2 Birthdate'] );
    contact_row[ 'Contact2 Gender' ] = normalizeGenderRep( contact_row[ 'Contact2 Gender' ] );
    contact_row['Contact2 Salutation'] = condenseSalutation( contact_prefix, row );
    contact_row['Contact2 Suffix'] = condenseSuffix( row[ contact_prefix + 'Suffix_1' ], row[ contact_prefix + 'Suffix_2' ] );

    var contact_phones_and_emails = {};

    for ( var i = 1; i <= contact_phones_count; i += 1 ) {

         var record = makePhonesAndEmails( makeIndexedPrefix( phone_prefix, '1', i ), 'Contact2', row );
         contact_phones_and_emails = merge( contact_phones_and_emails, record );

    }

    return merge( contact_row, contact_phones_and_emails );

}

/**
 * Associate a primary business / organization with this Contact1
 */
function makeAccount1forContact1( account_prefix, phone_prefix, contact_phones_count, row ) {

    var mapping = {};

    mapping[ account_prefix + 'Org_Name' ] = 'Account1 Name';
    mapping[ account_prefix + 'Adr_City' ] = 'Account1 City';
    mapping[ account_prefix + 'Adr_State' ] = 'Account1 State/Province';
    mapping[ account_prefix + 'Adr_ZIP' ] = 'Account1 Zip/Postal Code';
    mapping[ account_prefix + 'Adr_ContryLongDscription' ] = 'Account1 Country';
    mapping[ account_prefix + 'System_ID' ] = 'Account1 RE ID';
    mapping[ account_prefix + 'Ph_1_01_Phone_number' ] = 'Account1 Phone';

    var account_row = makeSurjectiveMappingWith( mapping )( row );

    account_row[ 'Account1 Phone' ]  = formatPhone( account_row[ 'Account1 Phone' ] );
    account_row[ 'Account1 Street' ] = makeStreet( account_prefix + 'Adr_', row, ', ' )[ 'Home Street' ];

    return account_row;

}



/**
 * there will be no Contact2 <=> Account2 relationships in this import.
 */

/**
 * Make a prefix based on an iterated CSV field.
 */
function makeIndexedPrefix( prefix, i, j ) {
    return prefix + '_' + i + '_' + ((('' + j).length === 2 ) ? j : ('0' + j) ) + '_';
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

    return { 'Home Street': street };

}

function isIndividualConstituent( row ) {
    return row.CnBio_First_Name !== '' && row.CnBio_Last_Name !== '' && row.CnBio_Org_Name === '';
}

function isOrganizationalConstituent( row ) {
    return row.CnBio_First_Name === '' && row.CnBio_Last_Name === '' && row.CnBio_Org_Name !== '';
}

function individualConstituentHasSpouse( row ) {
    return row.CnSpSpBio_First_Name !== '' && row.CnSpSpBio_Last_Name !== '';
}

function individualConstituentHasPrimaryAccount( row ) {
    return row.CnPrBs_Org_Name !== '' && row.CnPrBs_System_ID !== '';
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


    function header( type ) { return post_header_prefix + ' ' + type; }

    function get_type( value ) { return ( value.indexOf( 'Email' ) !== -1) ? 'Email' : 'Phone'; }

    function get_subtype( value ) { return ( value.indexOf(' Email') !== -1 ) ? value.slice(0, value.indexOf(' Email' ) ) : value.slice(0, value.indexOf(' Phone') ); }


    var result = {};

    var phone_values = phone_fields.map( function( suffix ) { return row[ pre_header_prefix + suffix ]; });

    var phone_type = phone_type_mapping[ phone_values[ 0 ] ];

    if ( typeof phone_type !== 'undefined' && phone_type != null ) {

        var formatted_value = formatPhone( phone_values[1] );

        result[ header( phone_type ) ] = formatted_value;

        if ( phone_values[ 2 ] !== 'No' ) {
            result[ header( 'Preferred ' + get_type( phone_type ) ) ] = get_subtype( phone_type );
        }

    }

    return result;

}



function formatPhone( number ) {
    var attempt = new Phone( number );

    if ( attempt.number() !== '0000000000' ) {

        return attempt.toString();

    } else {

        return '';

    }

}


function selectPrimaryPhoneForAccount( phones ) {

    if ( typeof phones['Account1 Preferred Phone'] !== 'undefined' ) {

        var preferred = phones['Account1 Preferred Phone'];

        if ( typeof phones['Account1 ' + preferred + ' Phone'] !== 'undefined' ) {

            return phones['Account1 ' + preferred + ' Phone'];

        }

    }

    var candidates = Object.values( phones );

    var phones = candidates.filter( function( number ) { return formatPhone( number ) !== ''; });

    return phones[0] || '';

}

function validateAddress( prefix, row ) {

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

        } else {

        }

    }

    // console.log('\n');
    // console.log( address_text )
    // console.log( address );
    // console.log('\n');

    return row;

}





function condenseSpreadCodes( code_columns, normalize ) {
    return function( row ) {

        var result = {};

        var codes = [];

        code_columns.forEach( function( header ) {

            if ( typeof row[ header ] !== 'undefined') {

                if ( row[ header ] !== '' ) {
                    var code = normalize( row[ header ] );

                    if ( code != null ) {
                        codes.push( code );
                    }

                }

            }

        });

        return unique( codes ).join(';');

    }

}

/**
 * Condense Solicit Codes here.
 */

const solicit_code_columns = [
    "CnSolCd_1_01_Solicit_Code",
    "CnSolCd_1_02_Solicit_Code",
    "CnSolCd_1_03_Solicit_Code",
    "CnSolCd_1_04_Solicit_Code",
    "CnSolCd_1_05_Solicit_Code",
    "CnSolCd_1_06_Solicit_Code",
    "CnSolCd_1_07_Solicit_Code",
    "CnSolCd_1_08_Solicit_Code",
    "CnSolCd_1_09_Solicit_Code",
    "CnSolCd_1_10_Solicit_Code",
];

function normalizeSolicitCodeRep( code ) {
    switch ( code.trim().toLowerCase() ) {

        case 'do not mail':
            return 'Do Not Mail';

        case 'do not solicit':
            return 'Do Not Solicit';

        case 'do not solicit - membership':
            return 'Do Not Solicit Membership';

        case 'do not contact':
            return 'Do Not Contact';

        case 'do not mail':
            return 'Do Not Mail';

        case 'do not email':
        case 'requests no email':
            return 'Do Not Email';

        default:
            return null;

    }
}

var condenseSolicitCodes = condenseSpreadCodes( solicit_code_columns, normalizeSolicitCodeRep );

const constituent_code_columns = [
    'CnBio_Constit_Code',
    'CnCnstncy_1_01_CodeLong',
    'CnCnstncy_1_02_CodeLong',
    'CnCnstncy_1_03_CodeLong',
    'CnCnstncy_1_04_CodeLong',
    'CnCnstncy_1_05_CodeLong',
    'CnCnstncy_1_06_CodeLong',
    'CnCnstncy_1_07_CodeLong'
];

function normalizeConstituentCodeRep( code ) {
    switch ( code.trim().toLowerCase() ) {

        case 'artist':
            return 'Artist';

        case 'artist guild':
            return 'Artist Guild';

        case 'board member':
            return 'Board Member';

        case 'board member - lifetime':
            return 'Board Member - Lifetime';

        case 'business':
            return 'Business';

        case 'coleman center':
            return 'Coleman Center';

        case 'corporate/business':
            return 'Corporation';

        case 'course registrant':
            return 'Course Registrant';

        case 'event attendee':
            return 'Event Attendee';

        case 'faculty coleman center':
            return 'Faculty';

        case 'former board member':
            return 'Former Board Member';

        case 'former executive director':
            return 'Former Executive Director';

        case 'former staff':
            return 'Former Staff';

        case 'foundation':
            return 'Foundation';

        case 'government':
            return 'Government';

        case 'library':
            return 'Library';

        case 'life member':
            return 'Life Member';

        case 'matching gift company':
            return 'Matching Gift Company';

        case 'met student':
            return 'Met Student';

        case 'muse student':
            return 'Muse Student';

        case 'non-profit organization':
            return 'Non-profit Organization';

        case 'photo guild':
            return 'Photo Guild';

        case 'artist/photogrpher':
        case 'photographer':
            return 'Photographer';

        case 'prospect':
            return 'Prospect';

        case 'staff':
            return 'Staff';

        case 'vendor':
            return 'Vendor';

        case 'volunteer':
        case 'griffon shop volunteer':
            return 'Volunteer';

        case 'wet paint artist':
            return 'Wet Paint Artist';

        case 'wet paint buyer':
            return 'Wet Paint Buyer';

        case 'winter speaker series':
            return 'Winter Speaker Series';

        default:
            return null;

    }
}

var condenseConstituentCodes = condenseSpreadCodes( constituent_code_columns, normalizeConstituentCodeRep );




/**
 * Manage Salutations
 */

 var invalid = ['', 'Dr. and Dr.', 'Drs.', 'Capt. and Mrs.', 'Mr. and Ms.', 'Mr. and Mrs.', 'Ms. and Mr.', 'Ms. and Ms.', 'Requested no form of address', 'Requested no prefix', 'Rev. and Mrs.', 'The', 'Vice Adm. & Mrs.'];

 var invalid_salutations = {
     'Male': ['Councilwoman', 'Countess', 'Marquesa', 'Miss', 'Mrs.', 'Sister', 'Ms.' ],
     'Female': ['Congressman', 'Councilman', 'Count', 'Father', 'Master', 'Sir', 'Brother', 'Mr.'  ]
 };

function get_salutation( gender, titles ) {
 if ( gender === 'Unknown' || titles.length === 0  ) { return ''; }

 var title = titles.shift();

 if ( invalid.includes( title ) || invalid_salutations[ gender ].includes( title ) ) {

     return get_salutation( gender, titles );

 } else {

     return normalizeSalutation( title );

 }

}


function condenseSalutation( prefix, row ) {

    return get_salutation( row[ prefix + 'Gender' ], [row[ prefix + 'Title_1'], row[ prefix + 'Title_2'] ] );

}

function normalizeSalutation( code ) {




    /**

        Valid Salesforce Salutations.

        Ms.
        Mr.
        Mx
        Mrs.
        Miss
        Dr.
        Professor

        Brigadier General
        Captain
        Colonel
        Commander
        General
        Lieutenant Colonel
        Lieutenant Commander
        Lieutenant General
        Major
        Major General
        Rear Admiral
        Sergeant

        Ambassador
        Councilman
        Councilwoman
        Representative
        Senator

        Brother
        Father
        Rabbi
        Reverend
        Sister

        Count
        Countess
        Honorable
        Marquesa
        Sir
     */

    switch ( code.trim() ) {

        case 'Ms.':
        case 'Mr.':
        case 'Dr.':
        case 'Mx.':
        case 'Mrs.':
        case 'Miss':
        case 'Professor':
        case 'Colonel':
        case 'Captain':
        case 'Rear Admiral':
        case 'Representative':
        case 'Rabbi':
        case 'Ambassador':
        case 'Commander':
        case 'Admiral':
        case 'Major':
        case 'Brother':
        case 'Sister':
        case 'Brigadier General':
        case 'Sergeant':
        case 'Major General':
        case 'Councilwoman':
        case 'Reverend':
        case 'General':
        case 'Councilman':
        case 'Father':
        case 'Marquesa':
        case 'Sir':
        case 'Countess':
        case 'Mayor':
        case 'Congressman':
        case 'Count':
        case 'Senator':
        case 'Master':
            return code.trim();

        case 'Lt. Gen':
            return 'Lieutenant General';

        case 'LCDR':
            return 'Lieutenant Commander';

        case 'Lt. Col.':
            return 'Lieutenant Colonel';

        case 'Cdr.':
            return 'Commander';

        case 'The Honorable':
        case 'Hon.':
            return 'Honorable';

        case 'Drs.':
            return 'Dr.';

        case 'The Rt. Rev.':
        case 'The Reverend':
            return 'Reverend';

        case 'Rep.':
            return 'Representative';

        default:
            return '';

    }

}


// suffixes
function condenseSuffix( s1, s2 ) { return s1 + s2; }

// Parking Lot

// Create a Primary Business for Constituent, if Relevant.


// for ( var i = 1; i <= contact1_organizational_relations; i += 1 ) {
//
//     var prefix = makeIndexedPrefix('CnRelOrg', '1', i );
//
//     if ( individualConstituentHasAccountRelation( prefix, row ) ) {
//
//         var rel = makeAccount1forContact1( prefix, prefix + 'Ph', 5, row );
//
//         result.push( duplicateWith( contact1_row, rel ) );
//
//     }
//
// }
