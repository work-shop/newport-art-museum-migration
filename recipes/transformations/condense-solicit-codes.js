'use strict';

var ProgressBar = require('progress');
var RowMap = require('./abstracts/row-operator.js').RowMap;


var solicit_code_header = 'Solicit_Codes__c';

var solicit_code_mapping = {

};

var solicit_code_columns = [
    "CnSolCd_1_01_Solicit_Code",
    "CnSolCd_1_02_Solicit_Code",
    "CnSolCd_1_03_Solicit_Code",
    "CnSolCd_1_04_Solicit_Code",
    "CnSolCd_1_05_Solicit_Code",
    "CnSolCd_1_06_Solicit_Code",
    "CnSolCd_1_07_Solicit_Code",
    "CnSolCd_1_08_Solicit_Code",
    "CnSolCd_1_09_Solicit_Code",
    "CnSolCd_1_10_Solicit_Code",
];


module.exports = RowMap(
    'Condensing Solicit Codes',
    function( row ) {

        var solicit_codes = "";

        solicit_code_columns.forEach( function( header ) {

            if ( row[ header ] !== "" ) {
                solicit_codes += row[ header ] + ';';
            }

            delete row[ header ];

        });

        row[ solicit_code_header ] = solicit_codes.substring( 0, solicit_codes.length - 1 );

        return row;

    }
);
