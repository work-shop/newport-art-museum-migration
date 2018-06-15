"use strict";

var name_mapping = {
    "CnBio_System_ID": "RE_ID__c",
    "CnBio_ID": "",
    "CnBio_First_Name": "First_Name__c",
    "CnBio_Last_Name": "Last_Name__c",
    "CnBio_Middle_Name": "Middle_Name__c",
    "CnBio_Birth_date": "Birthday__c",
    "CnBio_No_Valid_Addresses": "Flag_RE_No_Valid_Address__c",
    "CnAdrSal_Salutation": "Salutation__c"
}

function relabel_columns( dataframe ) {

    dataframe.map( function( row ) {

        for ( var header in name_mapping ) {
            if ( name_mapping.hasOwnProperty( header ) ) {
                if ( typeof row[ header ] !== 'undefined' ) {

                    row[ name_mapping[ header ] ] = row[ header ];

                    delete row[ header ];

                }
            }
        }

        return row;

    });

    return dataframe;

};

relabel_columns.desc = "Relabeling Columns";

module.exports = relabel_columns;
