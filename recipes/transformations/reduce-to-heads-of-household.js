'use strict';

var RowFilter = require('./abstracts/row-operator.js').RowFilter;

var const_first_name_key = 'CnBio_First_Name';
var const_middle_name_key = 'CnBio_Middle_Name';
var const_last_name_key = 'CnBio_Last_Name';
var const_org_name_key = 'CnBio_Org_Name';
var const_org_employees = 'CnBio_No_employees';

var ind_first_name_key = 'Ind_First_Name';
var ind_last_name_key = 'Ind_Last_Name';
var ind_org_name_key = 'CnBio_Org_Name';

var is_constituent = 'Is_Constituent__c';
var from_constituent = 'From_Constituent__f';

var row_type_header = 'Record_Type__f';

const name_field = 'Name__n';


module.exports = RowFilter(
    'Head of Household Constituents → Heads of Household',
    function( row ) {

        var flag = false;

        if ( row[ const_org_name_key ] === '' ) {
            // Get all the constituents that are heads of household and are not organizations.

            row[ row_type_header ] = 'Constituent';

            flag = true;

        }

        return flag;

    }
);
