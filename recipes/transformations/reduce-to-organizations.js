'use strict';

var RowFilter = require('./abstracts/row-operator.js').RowFilter;

var first_name_key = 'CnBio_First_Name';
var last_name_key = 'CnBio_Last_Name';
var org_name_key = 'CnBio_Org_Name';
var middle_name_key = 'CnBio_Middle_Name';
var birthday_key = 'CnBio_Birth_date';
var suffix_1_key = 'CnBio_Suffix_1';
var suffix_2_key = 'CnBio_Suffix_2';


module.exports = RowFilter(
    'Reducing Constituents to Organizations',
    function( row ) {

        var flag = false;

        if ( row[ first_name_key ] === '' && row[ last_name_key ] === '' && row[ org_name_key ] !== '' ) {

            delete row[ first_name_key ];
            delete row[ last_name_key ];
            delete row[ birthday_key ];
            delete row[ middle_name_key ];
            delete row[ suffix_1_key ];
            delete row[ suffix_2_key ];

            flag = true;

        }

        return flag;

    }
);
