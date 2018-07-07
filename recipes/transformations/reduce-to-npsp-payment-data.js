'use strict';

var reformatGiftsToDonationsAndPayments = require('./extensions/reduce-npsp-donations.js');
var RowMapReduce = require('./abstracts/row-operator.js').RowMapReduce;

module.exports = RowMapReduce(
    '(Constituents × Gifts) → NPSP_Pledge_Import',
    function( row, secondaries ) {

        var result = [];

        var sorted_gifts = secondaries[0];

        var constituent = {};
        constituent['Contact1 RE ID'] = row.CnBio_System_ID;

        var pledges = reformatGiftsToDonationsAndPayments( 'Contact1', constituent, sorted_gifts, [''] ).filter( function( p ) { return p['Donation Type'] === 'Pledge' && p['Payment Paid'] === 1; } );

        pledges.forEach( function( pledge ) {

            var pledge_payment = {
                'Check/Reference Number': pledge['Payment Check/Reference Number'],
                'Payment Date': pledge['Payment Date'],
                'Payment Amount': pledge['Payment Amount'],
                'Paid': 1,
                'Payment Method': pledge['Payment Method'],
                'Description': pledge['Payment Description'],
                'Opportunity': pledge['Donation RE ID'],
                'Raiser\'s Edge ID': pledge['Payment RE ID']
            }

            result.push( pledge_payment );

        });

        return result;

    }
);
