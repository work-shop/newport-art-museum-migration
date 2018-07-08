'use strict';


function email_field( type ) {
    return 'Contact1 ' + type + ' Email __c'
}

function phone_field( type ) {
    return 'Contact1 ' + type + ' Phone __c';
}

function address_field( type, part ) {
    return type + ' ' + part + ' __c';
}



var fields = {};


fields.Contact1 = {
    headers: {

        personal: {
            external_id: 'RE ID __c',
            salutation: 'Contact1 Salutation __c',
            first_name: 'Contact1 First Name __c',
            middle_name: 'Contact1 Middle Name __c',
            last_name: 'Contact1 Last Name __c',
            birth_date: 'Contact1 Birthdate __c',
            title: 'Contact1 Title __c',
            notes_field: 'Contact1 Notes __c',
            solicit_codes: 'Solicit Codes __c',
        },

        emails: {
            personal_email: email_field( 'Personal' ),
            work_email: email_field( 'Work' ),
            other_email: email_field( 'Other' ),
            alternate_email: email_field( 'Alternate' ),
            preferred_email: email_field( 'Preferred' ),
        },

        phones: {
            home_phone: phone_field('Personal'),
            work_phone: phone_field('Work'),
            mobile_phone: phone_field('Mobile'),
            other_phone: phone_field('Other'),
            preferred_phone: phone_field('Preferred'),
        },

        addresses: [
            {
                street: address_field( 'Home', 'Street' ),
                city: address_field( 'Home', 'City' ),
                state: address_field( 'Home', 'State/Province' ),
                zip: address_field( 'Home', 'Zip/Postal Code' ),
                country: address_field( 'Home', 'Country' ),
            },
            {
                street: address_field( 'Former', 'Street' ),
                city: address_field( 'Former', 'City' ),
                state: address_field( 'Former', 'State/Province' ),
                zip: address_field( 'Former', 'Zip/Postal Code' ),
                country: address_field( 'Former', 'Country' ),
            }
        ]


    },
    mappings: {

    }
};


fields.NPSPImport = {
    headers: [

        // A Household will be created for Contact1
        'Contact1 Salutation',
        'Contact1 First Name',
        'Contact1 Middle Name',
        'Contact1 Last Name', // Required, if any Contact1 info present
        'Contact1 Birthdate',
        'Contact1 Title',
        'Contact1 Personal Email',
        'Contact1 Work Email',
        'Contact1 Alternate Email',
        'Contact1 Preferred Email', // One of Personal, Work, or Alternate, if specified
        'Contact1 Home Phone',
        'Contact1 Work Phone',
        'Contact1 Mobile Phone',
        'Contact1 Other Phone',
        'Contact1 Preferred Phone', // One of Home, Work, Mobile, or Other, if specified
        'Contact1 RE ID',
        'Contact1 Solicit Codes', // Solicit Codes for Contact1
        'Contact1 Constituent Codes',
        'Contact1 Gender',
        'Contact1 Suffix',

        // These will be the address data associated with the Household created for Contact1
        'Household Phone',
        'Home Street',
        'Home City',
        'Home State/Province',
        'Home Zip/Postal Code',
        'Home Country',

        // Contact2 will be connected to Contact1's Household
        'Contact2 Salutation',
        'Contact2 First Name',
        'Contact2 Middle Name',
        'Contact2 Last Name', // Required, if any Contact2 info present
        'Contact2 Birthdate',
        'Contact2 Title',
        'Contact2 Personal Email',
        'Contact2 Work Email',
        'Contact2 Alternate Email',
        'Contact2 Preferred Email', // One of Personal, Work, or Alternate, if specified
        'Contact2 Home Phone',
        'Contact2 Work Phone',
        'Contact2 Mobile Phone',
        'Contact2 Other Phone',
        'Contact2 Preferred Phone', // One of Home, Work, Mobile, or Other, if specified
        'Contact2 RE ID',
        'Contact2 Solicit Codes',
        'Contact2 Constituent Codes',
        'Contact2 Gender',
        'Contact2 Suffix',

        // Account1 will be related to Contact1
        'Account1 Name', // Required, if any other fields from Account1 are present
        'Account1 Street',
        'Account1 City',
        'Account1 State/Province',
        'Account1 Zip/Postal Code',
        'Account1 Country',
        'Account1 Phone',
        'Account1 Website', // Skip
        'Account1 RE ID',
        'Account1 Solicit Codes',
        'Account1 Constituent Codes',

        // Account2 will be related to Contact2
        'Account2 Name', // Required, if any other fields from Account1 are present
        'Account2 Street',
        'Account2 City',
        'Account2 State/Province',
        'Account2 Zip/Postal Code',
        'Account2 Country',
        'Account2 Phone',
        'Account2 Website', // Skip
        'Account2 RE ID',
        'Account2 Solicit Codes',
        'Account2 Constituent Codes',

        // Donation Information
        'Donation Donor', // either Contact1 to associate the donation with Contact1 or 'Account1' to associate with the org account. Defaults to 'Contact1'
        'Donation Amount', // Required
        'Donation Date', // The date you received the donation. In RE, 'Gift Date', not 'Post Date'
        'Donation Name', // a unique name for the donation. Leave empty
        'Donation Record Type Name', // The Opportunity Record Type to use –
        'Donation Type', // Donation Type, as per RE Gift Type: // Cash, Pledge, Stock, Gift In Kind, Other, Recurring Gift, Art, Bequest
        'Donation Stage', // The Stage of the donation – Defaults to Closed/Won Stage
        'Donation Description', // Optional Description of the Donation. Leave Blank
        'Donation Member Level', // The Member Level (accodring to RE) corresponding to a particular donation
        'Donation Membership Origin', // Not sure what this is for. Skip for now.
        'Donation Membership Start Date', // The start date of the membership if the donation is for a membership.
        'Donation Membership End Date', // The end date of the membership if the donation is for a membership.
        'Donation Installment Schedule',
        'Donation Installment Plan',
        'Donation Stock Issuer',
        'Donation Stock Issuer Ticker Symbol',
        'Donation Stock Liquid Value',
        'Donation Stock Mean Value',
        'Donation Stock Unit Value',
        'Donation Stock Units Issued',
        'Donation Stock Broker Fee',
        'Donation Campaign Name',
        'Donation RE Campaign', // Tries to match an existing campaign by name. If no match is found, will create a new campaign.
        'Donation RE Appeal',
        'Donation RE Fund',
        'Donation RE ID',
        'Donation RE Membership ID',
        'Donation RE Batch Number',
        'Donation Acknowledgement Status',
        'Donation Do Not Create Payment',
        'Donation Certainty',
        'Donation Migration Description',
        'Payment Paid',
        'Payment Certainty',
        'Payment Migration Description',
        'Payment Amount',
        'Payment RE ID',
        'Payment Description',
        'Payment Method', // The pay-method for this donation
        'Payment Date',
        'Payment Check/Reference Number', // The check or ref number, if there is one.

        'FLAG: Bad Address',
        'FLAG: Duplicate Record'
    ]
};

fields.NPSPImportPayments = {
    headers: [
        'Check/Reference Number',
        'Description',
        'Opportunity',
        'Paid',
        'Payment Amount',
        'Payment Method',
        'Payment Date',
        'Raiser\'s Edge ID',
    ]
}


/**
 * Follow-up Imports Needed:
 * - Additional Addresses for Households.
 * - Additional Addresses for Organizations.
 * - Additional Contact-Contact Relationships.
 * - Additional Contact-Organization Relationships.
 */


module.exports = fields;
