'use strict';

var RowMap = require('./abstracts/row-operator.js').RowMap;

var gender_header = 'CnBio_Gender';
var title1_header = 'CnBio_Title_1';
var title2_header = 'CnBio_Title_2';

var invalid = ['', 'Dr. and Dr.', 'Drs.', 'Capt. and Mrs.', 'Mr. and Ms.', 'Mr. and Mrs.', 'Ms. and Mr.', 'Ms. and Ms.', 'Requested no form of address', 'Requested no prefix', 'Rev. and Mrs.', 'The', 'Vice Adm. & Mrs.'];

var invalid_salutations = {
    'Male': ['Councilwoman', 'Countess', 'Marquesa', 'Miss', 'Mrs.', 'Sister', 'Ms.' ],
    'Female': ['Congressman', 'Councilman', 'Count', 'Father', 'Master', 'Sir', 'Brother', 'Mr.'  ]
};


/**

    Valid Salesforce Salutations.

    Ms.
    Mr.
    Mx
    Mrs.
    Miss
    Dr.
    Professor

    Brigadier General
    Captain
    Colonel
    Commander
    General
    Lieutenant Colonel
    Lieutenant Commander
    Lieutenant General
    Major
    Major General
    Rear Admiral
    Sergeant

    Ambassador
    Councilman
    Councilwoman
    Representative
    Senator

    Brother
    Father
    Rabbi
    Reverend
    Sister

    Count
    Countess
    Honorable
    Marquesa
    Sir
 */

function get_salutation( gender, titles ) {
    if ( gender === 'Unknown' || titles.length === 0  ) { return ''; }

    var title = titles.shift();

    if ( invalid.includes( title ) || invalid_salutations[ gender ].includes( title ) ) {

        return get_salutation( gender, titles );

    } else {

        return title;

    }

}

module.exports = function( result_header ) {
    return RowMap(
        'Making a guess about salutation!',
        function( row ) {

            row[ result_header ] = get_salutation( row[ gender_header], [row[ title1_header], row[ title2_header]] );

            return row;

        }
    );
}
