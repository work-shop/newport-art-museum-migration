'use strict';

function RowOperatorFactory( op, postprocessing = function( x ) { return x; } ) {
    return function RowOperator( name, row_operation ) {
        if ( !(this instanceof RowOperator)) { return new RowOperator( name, row_operation ); }
        var self = this;

        self.transformation = function( dataframe ) {

            return postprocessing( dataframe[ op ]( row_operation ) );

        }

        self.transformation.desc = name;

    };
}


module.exports = {

    RowFilter : RowOperatorFactory( 'filter' ),

    RowMap : RowOperatorFactory( 'map' ),

    RowMapReduce : RowOperatorFactory( 'map', function( dataframe ) { return dataframe.reduce( function( a, b ) { return a.concat( b ); }, [] ); } )

};
