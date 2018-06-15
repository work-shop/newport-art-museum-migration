'use strict';

var RowOperator = require('./abstracts/row-operator.js');


const re_suffixes1_header = 'CnBio_Suffix_1';
const re_suffixes2_header = 'CnBio_Suffix_2';

const sf_suffixes_header = 'Suffixes__c';


module.exports = RowOperator(
    'Concatinating suffixes',
    function( row ) {

        row[ sf_suffixes_header ] = [];

        [ re_suffixes1_header, re_suffixes2_header ].forEach( function( header ) {

            if (  typeof row[ header ] !== 'undefined' )  {

                row[ sf_suffixes_header ].push( row[ header ] );
                delete row[ header ];

            }

        } );

        row[ sf_suffixes_header ] = row[ sf_suffixes_header ].join(' ');

        return row;

    }
);
