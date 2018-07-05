'use strict';

function RowOperatorFactory( op, postprocessing = function( x ) { return x; } ) {
    return function RowOperator( name, row_operation ) {
        if ( !(this instanceof RowOperator)) { return new RowOperator( name, row_operation ); }
        var self = this;

        self.transformation = function( dataframe, secondary_files ) {

            return postprocessing( dataframe[ op ]( function( row ) { return row_operation( row, secondary_files ); }) );

        }

        self.transformation.desc = name;

    };
}


module.exports = {

    RowFilter : RowOperatorFactory( 'filter' ),

    RowMap : RowOperatorFactory( 'map' ),

    RowMapReduce : RowOperatorFactory( 'map', function( dataframe ) { return dataframe.reduce( function( a, b ) { return a.concat( b ); }, [] ); } )

};
