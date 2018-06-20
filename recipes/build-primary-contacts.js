'use strict';

var Recipe = require('./recipe.js');

var reduce_to_heads_of_household = require('./transformations/reduce-to-heads-of-household.js');
var condense_solicit_codes = require('./transformations/condense-solicit-codes.js');
var determine_salutation = require('./transformations/condense-salutation.js')( 'Contact1 Title __c' );
var reformat_phones_and_emails = require('./transformations/reformat-phones-and-emails.js');
var reformat_suffices = require('./transformations/concatinate-suffixes.js');
var reformat_addresses = require('./transformations/reformat-addresses.js');
var relabel_contact_columns = require('./transformations/relabel-contact-columns.js');
var globally_unique_identifier = require('./transformations/globally-unique-identifier.js')( 'Record_Type__f', 'Contact1 Raisers Edge ID __c' );
var trim = require('./transformations/trim-nonfields.js');


module.exports = Recipe(
    'Build Contact1__a.',
    [
        'Contact1 Salutation __c',
        'Contact1 First Name __c',
        'Contact1 Last Name __c',
        'Contact1 Birthdate __c',
        'Contact1 Title __c',
        'Contact1 Personal Email __c',
        'Contact1 Work Email __c',
        'Contact1 Alternate Email __c',
        'Contact1 Preferred Email __c',
        'Contact1 Home Phone __c',
        'Contact1 Work Phone __c',
        'Contact1 Mobile Phone __c',
        'Contact1 Other Phone __c',
        'Contact1 Other Phone __c',
        'Contact1 Preferred Phone __c',
        'Home Street __c',
        'Home City __c',
        'Home State/Province __c',
        'Home Zip/Postal Code __c',
        'Home Country __c',
        'Solicit Codes __c'
    ],
    [
        reduce_to_heads_of_household,
        condense_solicit_codes,
        determine_salutation,
        reformat_phones_and_emails,
        reformat_addresses,
        reformat_suffices,
        relabel_contact_columns,
        globally_unique_identifier,
        trim
    ],
    [
        // valid_names
        // valid_address
        // valid_emails
        // valid_phones
    ]
);
