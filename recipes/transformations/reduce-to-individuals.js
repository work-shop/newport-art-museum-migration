'use strict';

var ProgressBar = require('progress');

var first_name_key = 'CnBio_First_Name';
var last_name_key = 'CnBio_Last_Name';
var org_name_key = 'CnBio_Org_Name';


function reduce_to_individuals( dataframe ) {

    return dataframe.filter( function( row ) {

        var flag = false;

        if ( row[ first_name_key ] !== '' && row[ last_name_key ] !== '' && row[ org_name_key ] === '' ) {

            delete row[ 'CnBio_Org_Name' ];
            delete row[ 'CnBio_No_employees' ];

            flag = true;

        }

        return flag;

    });

};

reduce_to_individuals.desc = "Reducing Constituents to Individuals";

module.exports = reduce_to_individuals;
