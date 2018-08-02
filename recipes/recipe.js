'use strict';

var get_transformation = require('./get-transformation.js');


function Recipe( name = "Recipe", header= [], transformations = [], validations = [] ) {
    if ( !(this instanceof Recipe) ) { return new Recipe( name, header, transformations, validations ); }
    var self = this;


    self.header = header;

    self.name = name;

    self.transformations = transformations.map( get_transformation );

    self.validations = validations.map( get_transformation );


}


module.exports = Recipe;
