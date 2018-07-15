'use strict';

var duplicateWith = require('./objects').duplicateWith;
var makeSurjectiveMappingWith = require('./objects').makeSurjectiveMappingWith;
var formatDate = require('./format-date.js');

/**
 * This routine constructs a simple, single-installment cash gift based on the base gift,
 * and associates a one-time payment with the opportunity record.
 */
function makeCashGift( gift, donation_row ) {

    var mapping = {};

    mapping.Gf_Pay_method = 'Payment Method';
    mapping.Gf_Check_number = 'Payment Check/Reference Number';

    var cash_row = duplicateWith( donation_row, makeSurjectiveMappingWith( mapping )( gift ) );

    cash_row['Donation Record Type Name'] = 'Donation (Cash)';
    cash_row['Donation Type'] = 'Cash';
    cash_row['Donation Stage'] = ''; // Defaults to Closed/Won, which is what we want for this type of simple gift.
    cash_row['Donation Acknowledgement Status'] = 'Acknowledged';
    cash_row['Donation Certainty'] = 100;
    cash_row['Donation Migration Description'] = 'Single cash gift linked directly to Primary Donor.'
    cash_row['Payment Date'] = formatDate( gift.Gf_Check_date || gift.Gf_Date );
    cash_row['Payment RE ID'] = cash_row['Donation RE ID'];
    cash_row['Payment Paid'] = 1;
    cash_row['Payment Certainty'] = 100;
    cash_row['Payment Migration Description'] = 'Payment automatically created to match donation.'
    cash_row['Payment Amount'] = cash_row['Donation Amount'];

    return cash_row;

}

/**
 * Check whether a gift is a stock item.
 */
function isCashGift( gift ) {

    var type = ( typeof gift.Gf_Type !== 'undefined') ? gift.Gf_Type.toLowerCase() : ''

    return type === 'cash'; // || type === '' ?? Should we assume unmarked gifts are cash gifts? Seems reasonable.

}


module.exports = {
    makeCashGift: makeCashGift,
    isCashGift:  isCashGift
};
