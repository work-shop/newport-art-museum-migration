'use strict';

function RowOperator( name, row_operation ) {
    if ( !(this instanceof RowOperator)) { return new RowOperator( name, row_operation ); }
    var self = this;

    self.transformation = function( dataframe ) {

        return dataframe.map( row_operation );

    }

    self.transformation.desc = name;

}

module.exports = RowOperator;
