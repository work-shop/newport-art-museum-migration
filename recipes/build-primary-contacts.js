'use strict';

var Recipe = require('./recipe.js');
var fields = require('../fields.js').Contact1;
var extract = require('./extract-headers.js');

var reduce_to_heads_of_household = require('./transformations/reduce-to-heads-of-household.js');
var condense_solicit_codes = require('./transformations/condense-solicit-codes.js');
var determine_salutation = require('./transformations/condense-salutation.js')( 'Contact1 Title __c' );
var reformat_phones_and_emails = require('./transformations/reformat-phones-and-emails.js');
var reformat_suffices = require('./transformations/concatinate-suffixes.js');
var reformat_addresses = require('./transformations/reformat-addresses.js');
var relabel_contact_columns = require('./transformations/relabel-contact-columns.js');
var globally_unique_identifier = require('./transformations/globally-unique-identifier.js')( 'Record_Type__f', 'Contact1 Raisers Edge ID __c' );
var trim = require('./transformations/trim-nonfields.js');

var valid_names = require('./validations/malformed-names.js')( fields.headers.personal.first_name, fields.headers.personal.middle_name, fields.headers.personal.last_name );
var valid_addresses = require('./validations/malformed-addresses.js')( fields.headers.addresses );
var valid_emails = require('./validations/malformed-emails.js')( [ fields.headers.emails.personal_email, fields.headers.emails.work_email, fields.headers.emails.other_email, fields.headers.emails.alternate_email ] );

var headers = extract( fields.headers );

module.exports = Recipe(
    'Build Contact1__a.',
    extract( fields.headers ),
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
        valid_names,
        valid_addresses,
        valid_emails
        // valid_phones
    ]
);
