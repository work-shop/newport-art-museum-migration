'use strict';

var RowValidator = require('./abstracts/row-validator.js').RowValidator;


function is_well_formed_street( x ) {
    return typeof x !== 'undefined' && x !== '';
}

function is_well_formed_city( x ) {
    return typeof x !== 'undefined' && x !== '';
}

function is_well_formed_state( x ) {
    return typeof x !== 'undefined' && x !== '';
}

function is_well_formed_zip( x ) {
    return typeof x !== 'undefined' && x !== '' && (x.length === 5 || x.length === 10);
}

function is_well_formed_country( x ) {
    return typeof x !== 'undefined' && x !== '';
}

module.exports = function( addresses ){

    return RowValidator(
        'Checking for valid address fieldsets',
        'Has_Valid_Addresses__f',
        'No malformed address fieldsets found.',
        'Found malformed address fieldsets!',
        function( row, i, rows, secondary_files ) {

            return addresses.reduce( function( valid, address_set ) {

                return valid
                       && is_well_formed_street( row[ address_set.street ] )
                       && is_well_formed_city( row[ address_set.city ] )
                       && is_well_formed_state( row[ address_set.state ] )
                       && is_well_formed_zip( row[ address_set.zip ] )
                       && is_well_formed_country( row[ address_set.country ] );

            }, true);

        }
    );
}
