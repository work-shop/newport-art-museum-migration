'use strict';

module.exports = function( headers ) {

    var concat = function( a, b ) { return a.concat( b ); }

    headers.addresses = headers.addresses || [];

    headers.addresses.map( Object.values.bind( Object ) ).reduce( concat, []);

    return [
        ( typeof headers.personal !== 'undefined' ) ? Object.values( headers.personal ) : [],
        ( typeof headers.emails !== 'undefined' ) ? Object.values( headers.emails ) : [],
        ( typeof headers.phones !== 'undefined' ) ? Object.values( headers.phones ) : [],
        headers.addresses
    ].reduce( concat, []);
}
