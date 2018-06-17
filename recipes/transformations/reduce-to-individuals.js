'use strict';

var RowFilter = require('./abstracts/row-operator.js').RowFilter;

var const_first_name_key = 'CnBio_First_Name';
var const_last_name_key = 'CnBio_Last_Name';
var const_org_name_key = 'CnBio_Org_Name';
var const_org_employees = 'CnBio_No_employees';

var ind_first_name_key = 'Ind_First_Name';
var ind_last_name_key = 'Ind_Last_Name';
var ind_org_name_key = 'CnBio_Org_Name';

var is_constituent = 'Is_Constituent__c';
var from_constituent = 'From_Constituent__f';


module.exports = RowFilter(
    '(Constituents × Individual Relations) → Individuals',
    function( row ) {

        var flag = false;

        if ( row[ const_first_name_key ] !== '' && row[ const_last_name_key ] !== '' && row[ const_org_name_key ] === '' ) {

            row[ is_constituent ] = 'Yes';
            row[ from_constituent ] = 'Yes';

            flag = true;

        } else if ( row[ ind_first_name_key ] && row[ ind_last_name_key ] ) {

            row[ 'CnBio_System_ID' ] = row[ 'Ind_System_ID' ];
            row[ const_first_name_key ] = row[ ind_first_name_key ];
            row[ const_last_name_key ] = row[ ind_last_name_key ];

            row[ is_constituent ] = row[ 'Ind_Is_Constit' ];
            row[ from_constituent ] = 'No';

            flag = true;

        }

        return flag;

    }
);
