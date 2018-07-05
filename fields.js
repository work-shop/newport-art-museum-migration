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
        'Contact1 Salutation __c',
        'Contact1 First Name __c',
        'Contact1 Last Name __c', // Required, if any Contact1 info present
        'Contact1 Birthdate __c',
        'Contact1 Title __c',
        'Contact1 Personal Email __c',
        'Contact1 Work Email __c',
        'Contact1 Alternate Email __c',
        'Contact1 Preferred Email __c', // One of Personal, Work, or Alternate, if specified
        'Contact1 Home Phone __c',
        'Contact1 Work Phone __c',
        'Contact1 Mobile Phone __c',
        'Contact1 Other Phone __c',
        'Contact1 Preferred Phone __c', // One of Home, Work, Mobile, or Other, if specified
        'Contact1 RE ID __c',
        'Contact1 Solicit Codes __c', // Solicit Codes for Contact1
        'Contact1 Constituent Codes __c',
        'Contact1 Gender __c',

        // These will be the address data associated with the Household created for Contact1
        'Home Street __c',
        'Home City __c',
        'Home State/Province __c',
        'Home Zip/Postal Code __c',
        'Home Country',

        // Contact2 will be connected to Contact1's Household
        'Contact2 Salutation __c',
        'Contact2 First Name __c',
        'Contact2 Last Name __c', // Required, if any Contact2 info present
        'Contact2 Birthdate __c',
        'Contact2 Title __c',
        'Contact2 Personal Email __c',
        'Contact2 Work Email __c',
        'Contact2 Alternate Email __c',
        'Contact2 Preferred Email __c', // One of Personal, Work, or Alternate, if specified
        'Contact2 Home Phone __c',
        'Contact2 Work Phone __c',
        'Contact2 Mobile Phone __c',
        'Contact2 Other Phone __c',
        'Contact2 Preferred Phone __c', // One of Home, Work, Mobile, or Other, if specified
        'Contact2 RE ID __c',
        'Contact2 Solicit Codes __c',
        'Contact2 Constituent Codes __c',
        'Contact2 Gender __c',

        // Account1 will be related to Contact1
        'Account1 Name __c', // Required, if any other fields from Account1 are present
        'Account1 Street __c',
        'Account1 City __c',
        'Account1 State/Province __c',
        'Account1 Zip/Postal Code __c',
        'Account1 Country __c',
        'Account1 Phone __c',
        'Account1 Website __c', // Skip
        'Account1 RE ID __c',
        'Account1 Solicit Codes __c',
        'Account1 Constituent Codes __c',

        // Account2 will be related to Contact2
        'Account2 Name __c', // Required, if any other fields from Account1 are present
        'Account2 Street __c',
        'Account2 City __c',
        'Account2 State/Province __c',
        'Account2 Zip/Postal Code __c',
        'Account2 Country __c',
        'Account2 Phone __c',
        'Account2 Website __c', // Skip
        'Account2 RE ID __c',
        'Account2 Solicit Codes __c',
        'Account2 Constituent Codes __c',

        // Donation Information
        'Donation Donor __c', // either Contact1 to associate the donation with Contact1 or 'Account1' to associate with the org account. Defaults to 'Contact1'
        'Donation Amount __c', // Required
        'Donation Date __c', // The date you received the donation. In RE, 'Gift Date', not 'Post Date'
        'Donation Name __c', // a unique name for the donation. Leave empty
        'Donation Record Type Name __c', // The Opportunity Record Type to use –
        'Donation Type __c', // Donation Type, as per RE Gift Type: // Cash, Pledge, Stock, Gift In Kind, Other, Recurring Gift, Art, Bequest
        'Donation Stage __c', // The Stage of the donation – Defaults to Closed/Won Stage
        'Donation Description __c', // Optional Description of the Donation. Leave Blank
        'Donation Member Level __c', // The Member Level (accodring to RE) corresponding to a particular donation
        'Donation Membership Origin __c', // Not sure what this is for. Skip for now.
        'Donation Membership Start Date __c', // The start date of the membership if the donation is for a membership.
        'Donation Membership End Date __c', // The end date of the membership if the donation is for a membership.
        'Donation Campaign Name __c',
        'Donation RE Campaign __c', // Tries to match an existing campaign by name. If no match is found, will create a new campaign.
        'Donation RE Appeal __c',
        'Donation RE Fund __c',
        'Donation RE ID __c',
        'Donation RE Membership ID __c',
        'Donation Acknowledgement Status',
        'Payment Method __c', // The pay-method for this donation
        'Payment Date __c',
        'Payment Check/Reference Number __c' // The check or ref number, if there is one.
    ]
};


/**
 * Follow-up Imports Needed:
 * - Additional Addresses for Households.
 * - Additional Addresses for Organizations.
 * - Additional Contact-Contact Relationships.
 * - Additional Contact-Organization Relationships.
 */


module.exports = fields;
