'use strict';


var RowValidator = require('./abstracts/row-validator.js').RowValidator;


function valid_email( x ) {

    if ( typeof x === 'undefined' || x === '' ) { return undefined; }

    var pattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    return pattern.test( x );
}

module.exports = function( email_fields ) {

    return RowValidator(
        'Checking for valid address email addresses',
        'Has_Valid_Emails__f',
        'No malformed email fields found.',
        'Found malformed email fields!',
        function( row, i, rows, secondary_files ) {

            var results = email_fields
                        .map( function( field ) { return valid_email( row[ field ] ); } )
                        .filter( function( result ) { return typeof result !== 'undefined' && result !== ''; } )

            return results.length > 0 && results.reduce( function( a,b ) { return a && b; }, true );

        }
    );
}
