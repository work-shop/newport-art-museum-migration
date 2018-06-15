'use strict';

var RowMap = require('./abstracts/row-operator.js').RowMap;


const re_suffixes1_header = 'CnBio_Suffix_1';
const re_suffixes2_header = 'CnBio_Suffix_2';

const sf_suffixes_header = 'Suffixes__c';


module.exports = RowMap(
    'Concatinating suffixes',
    function( row ) {

        row[ sf_suffixes_header ] = [];

        [ re_suffixes1_header, re_suffixes2_header ].forEach( function( header ) {

            if (  typeof row[ header ] !== 'undefined' && row[ header ] !== '' )  {

                row[ sf_suffixes_header ].push( row[ header ] );

            }

            delete row[ header ];

        } );

        row[ sf_suffixes_header ] = row[ sf_suffixes_header ].join(' ');

        return row;

    }
);
