'use strict';

module.exports = {

    merge: function merge( rowA, rowB ) { return Object.assign( rowA, rowB ); },

    duplicateWith: function duplicateWith( rowA, rowB ) { return Object.assign( Object.assign( {}, rowA ), rowB ); },

    makeSurjectiveMappingWith: function ( mapping, seperator = ', ' ) {
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

};
