'use strict';

function RowValidatorFactory( op, postprocessing = function( x ) { return x; } ) {
    return function RowValidator( name, header, passMessage, failMessage, row_operation ) {
        if ( !(this instanceof RowValidator)) { return new RowValidator( name, header, passMessage, failMessage, row_operation ); }
        var self = this;


        self.transformation = function( dataframe, secondary_files ) {

            var passed = 0;

            var result = postprocessing( dataframe[ op ]( function( row, i ) {

                var pass = row_operation( row, i, dataframe, secondary_files );

                row[ header ] = ( pass ) ? '' : 'No';
                passed += (( pass ) ? 1 : 0);

                return row;

            }));

            self.transformation.state = passed === dataframe.length;

            self.transformation.statusMessage = ( self.transformation.state ) ? '[All rows passed]\t\t\t' + passMessage : '[' + (dataframe.length - passed) + '/' + (dataframe.length) +' rows failed]\t\t\t' + failMessage;

            return result;

        };


        self.transformation.desc = name;

        self.transformation.header = header;


    };
}


module.exports = {

    RowValidator : RowValidatorFactory( 'map' )

};
