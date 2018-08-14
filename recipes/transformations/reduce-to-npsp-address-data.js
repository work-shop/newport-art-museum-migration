'use strict';

var RowMapReduce = require('./abstracts/row-operator.js').RowMapReduce;

module.exports = RowMapReduce(
    '(Constituents) → NPSP_Address_Import',
    function( row ) {

        var result = [];

        var constituent_id = row.CnBio_System_ID;

        var addresses = []

        addresses.forEach( function( address ) {

            var pledge_payment = {
                'Raiser\'s Edge ID': constituent_id,// NOTE: Primary Matching Index in SF
                'Mailing Street': '',
                'Mailing City': '',
                'Mailing State/Province': '',
                'Mailing Zip/Postal Code': '',
                'Mailing Country': '',
                'County Name': '',
                'Address Type': '', // NOTE: One of 'Home', 'Work', 'Vacation Residence', 'Other'
                'Seasonal Start Month': '', // NOTE: 1 – 12, calendar months
                'Seasonal Start Day': '', // NOTE: 1 - 31, calendar day
                'Seasonal End Month' : '', // NOTE: 1 – 12, calendar months
                'Seasonal End Day': '' // NOTE: 1 - 31, calendar day
            }

            result.push( pledge_payment );

        });

        return result;

    }
);
