'use strict';

var moment = require('moment');

var makeSurjectiveMappingWith = require('./objects.js').makeSurjectiveMappingWith;

var normalizeInstallmentPlan = require('./normalize-npsp-types.js').normalizeInstallmentPlan;

var formatDate = require('./format-date.js');
var formatCurrency = require('./format-currency.js');
var formatGiftDescription = require('./format-gift-description.js');


/**
 * Given a gift row, this function determines whether it represents a pledge.
 *
 * @param gift RE_Gift_Row, a row including relevant keys from, representing a Raiser's Edge gift.
 */
function isPledgeGift( gift ) {

    var type = ( typeof gift.Gf_Type !== 'undefined') ? gift.Gf_Type.toLowerCase() : ''

    return (type === 'pledge');

}


/**
 * Given a gift row, this function determines whether it represents a pledge payment.
 * Not that we use an internal convention of marking a payment as seen with a boolean flag
 * as we try to match plege payments to pledges. This is implemented with a FLAGGED_SEEN boolean
 * on the gift row.
 *
 * @param gift RE_Gift_Row, a row including relevant keys from, representing a Raiser's Edge gift.
 */
function isPledgePayment( gift ) {

    var type = ( typeof gift.Gf_Type !== 'undefined') ? gift.Gf_Type.toLowerCase() : ''

    return type.indexOf( 'pay-' ) !== -1 && type.indexOf( 'mg pay-' ) === -1 && (typeof gift.FLAGGED_SEEN === 'undefined');

}

/**
 * Given a base Salesforce Row, and a raw gift row from RE,
 * This routine marks the donation as a pledged donation, and
 * calculates the various properties important for that pledge.
 * Note that this routine DOES NOT construct and associate the pledged
 * payments with the pledge.
 *
 */
function makePledgeGift( gift, pledge_row ) {

    pledge_row['Donation Type'] = 'Pledge';
    pledge_row['Donation Stage'] = 'Pledged';
    pledge_row['Donation Record Type Name'] = 'Donation (Pledged)';
    pledge_row['Donation Installment Plan'] = normalizeInstallmentPlan( gift.Gf_Installmnt_Frqncy );
    pledge_row['Donation Installment Schedule'] = gift.Gf_Installment_schedule;
    pledge_row['Donation Acknowledgement Status'] = 'Acknowledged'; // TODO: verify that this is the right acknowledgement stage for the gift.
    pledge_row['Donation Certainty'] = 100;
    pledge_row['Donation Migration Description'] = 'Single pledge gift linked directly to Primary Donor.'
    pledge_row['Payment Paid'] = 0;

    return pledge_row;

}

/**
 * Given a raw gift row representing a payment, this routine creates a payment row
 * for that gift.
 */
function makePledgePayment( payment_row ) {

    var mapping = {};

    mapping.Gf_Date = 'Payment Date';
    mapping.Gf_Amount = 'Payment Amount';
    mapping.Gf_Campaign = 'Payment RE Campaign';
    mapping.Gf_Appeal = 'Payment RE Appeal';
    mapping.Gf_Fund = 'Payment RE Fund';
    mapping.Gf_System_ID = 'Payment RE ID';
    mapping.Gf_Pay_method = 'Payment Method';
    mapping.Gf_Check_number = 'Payment Check/Reference Number';

    var payment = makeSurjectiveMappingWith( mapping )( payment_row );

    payment['Payment Date'] = formatDate( payment['Payment Date'] );
    payment['Payment Paid'] = 1;
    payment['Payment Amount'] = formatCurrency( payment['Payment Amount'] );
    payment['Payment Description'] = formatGiftDescription( payment_row );

    return payment;

}

/**
 * This routine gets the set of payments for a given pledge. It does this
 * by scanning the set of pay-* type gifts associated with this constituent,
 * matching them to a viable time period, and associating them with the constituent as gift rows.
 */
function makePledgePayments( gift, gift_rows, pledge ) {

    var payments = gift_rows.filter( function( g ) { return isPledgePayment( g ); } )
                            .map( function( p ) { return [p, makePledgePayment( p )]; });

    var pledged_amount = parseFloat( pledge['Donation Amount'] );

    if ( pledge['Donation Installment Plan'] === 'Single Installment' ) {

        // We're looking for a single pledge payment.
        let installments = findMatchingInstallments( pledge, payments, function( a, b ) { return pledged_amount === parseFloat( b ); });

        if ( installments.length === 0 ) {

            var second_pass = findMatchingInstallments( pledge, payments, function( a, b ) { return pledged_amount > parseFloat( b ); });
            var pass_sum = second_pass.reduce( function( a,b ) { return a + parseFloat( b[1]['Payment Amount'] ); }, 0);

            if ( second_pass.length === 0 ) {

                return [];

            } else if ( pass_sum <= pledged_amount ) {

                //console.log( 'exact payment or underpayment for single pledge: ' + pass_sum );
                return second_pass.map( function( payment ) { payment[0].FLAGGED_SEEN = true; return payment[1]; } );

            } else {

                return aggregateResultingPayments( pledge, second_pass );

            }

        } else {

            var payment = installments[0];

            payment[0].FLAGGED_SEEN = true;
            payment[1]['Payment Certainty'] = 100;
            payment[1]['Payment Migration Description'] = 'Matched a single ' + payment[0].Gf_Type  + ' payment to this pledge.';
            return [ payment[1] ];

        }


    } else {

        // We're looking for potentially multiple pledge payments.
        let installments = findMatchingInstallments( pledge, payments, function( a, b ) { return pledged_amount <= parseFloat( b ); });

        if ( installments.length === 0 ) {

            return [];

        } else {

            return aggregateResultingPayments( pledge, installments );

        }

    }

}

/**
 * Given a pledge and a set of candidate payments for that pledge,
 * This routine constructs a set of high-likelyhood payments on that
 * pledge.
 */
function aggregateResultingPayments( pledge, payments ) {

    var pledged_amount = parseFloat( pledge['Donation Amount'] );
    var result = [];
    var sum = 0;

    /**
     * Algorithm for putting the right number of payments in.
     * Sort payments in descending order of amount.
     * Put the first payment in. if the amount is too high, remove the last payment
     */

    /** sort in descending order */
    payments.sort( function( p1, p2 ) {
        return parseFloat( p2[1]['Payment Amount'] ) - parseFloat( p1[1]['Payment Amount'] );
    });

    payments.forEach( function( payment ) {

        if ( sum < pledged_amount ) {

            sum += parseFloat( payment[1]['Payment Amount'] );
            result.push( payment );

        } else if ( sum > pledged_amount ) {

            var overshoot = result.pop();
            sum -= parseFloat( overshoot[1]['Payment Amount'] );
            sum += parseFloat( payment[1]['Payment Amount'] );
            result.push( payment );

        }

    });

    return result.map( function( payment ){

        payment[1]['Payment Certainty'] = ( sum === pledged_amount ) ? 100 : 85;
        payment[1]['Payment Migration Description'] = ( sum === pledged_amount ) ? 'Exactly matched a set of pledge payments to this pledge.' : 'Partially matched a set of pledge payments to this pledge.';
        payment[0].FLAGGED_SEEN = true;
        return payment[1];

    });

}


/**
 * given a specific pledge, a set of possible payments, and a custom compare function,
 * this routine selects out the payments that pass that compare function.
 */
function findMatchingInstallments( pledge, payments, compare ) {


    return payments.filter( function( payment ) {

        return pledge['Donation RE Campaign'] === payment[1]['Payment RE Campaign'] &&
               pledge['Donation RE Fund'] === payment[1]['Payment RE Fund'] &&
               pledge['Donation RE Appeal'] === payment[1]['Payment RE Appeal'] &&
               compare( pledge['Donation Amount'], payment[1]['Payment Amount'] ) &&
               moment( pledge['Donation Date'] ).isSameOrBefore( moment( payment[1]['Payment Date']) )

    });

}


module.exports = {
    isPledgeGift : isPledgeGift,
    isPledgePayment : isPledgePayment,
    makePledgeGift : makePledgeGift,
    makePledgePayments : makePledgePayments,
};
