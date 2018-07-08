'use strict';

var merge = require('./objects.js').merge;
var duplicateWith = require('./objects.js').duplicateWith;
var makeSurjectiveMappingWith = require('./objects.js').makeSurjectiveMappingWith;

var format_date = require('./format-date.js');
var moment = require('moment');
var search = require('binary-search-range');
/**
 * Comparator for binary search.
 */
function compare( a, b ) { return ( a < b ) ? -1 : (( a > b ) ? 1 : 0); }

const gift_note_count = 3;

module.exports = function( type, row, gifts, memberships_by_constituent_id, raw_constituent ) {

    var gift_ids = gifts.map( function( g ) { return g.Gf_CnBio_System_ID; } );
    var membership_constituent_ids = memberships_by_constituent_id.map( function( m ) { return m.Mem_CnBio_System_ID; });

    // NOTE: Super time consuming operation here which runs in O(m log n),
    // where m is the number of constituents (~16k) and n is the number of gifts (~64k).
    var relevant_gifts_indices = search( gift_ids, row[ type + ' RE ID' ], compare );
    var relevant_membership_indices_by_constituent = search( membership_constituent_ids, row[ type + ' RE ID' ], compare );

    // var valid = testMembershipPresence( relevant_gifts_indices, relevant_membership_indices );
    //
    // if ( !valid ) { console.log( 'membership gift without membership association.' ); }

    // Sort the gifts in ascending order of value, from lowest to highest.
    // This will help make sure that smalled pledges encounter smaller payments first.
    relevant_gifts_indices.sort( function( i1, i2 ) {
        return  parseFloat( gifts[ i2 ].Gf_Amount ) - parseFloat( gifts[ i1 ].Gf_Amount );
    })

    var donation_rows = makeDonationSetForConstituent( 'Contact1',
        relevant_gifts_indices.map( function( i ) { return gifts[ i ]; } ),
        relevant_membership_indices_by_constituent.map( function( i ) { return memberships_by_constituent_id[ i ]; } ),
        raw_constituent
    );

    return donation_rows;


};



/**
 * Donation-Related Logic
 *
 */
function makeDonationSetForConstituent( constituent_type, gift_rows, memberships, raw_constituent ) {

    var result_rows = [];

    gift_rows.forEach( function( gift ) {

        // TODO: Extend the implementation to ALL gift types.
        // For now, we are only handling simple, non-pledge, non-membership, Cash gifts.
        if ( isCashGift( gift ) && !isMembershipGift( gift ) ) {

            var base_row = makeBaseGift( gift, constituent_type );
            var cash_row = makeCashGift( gift, base_row )

            result_rows.push( cash_row );

        } else if ( isStockGift( gift ) && !isMembershipGift( gift ) ) {

            var base_row = makeBaseGift( gift, constituent_type );
            var cash_row = makeCashGift( gift, base_row )
            var stock_gift = makeStockGift( gift, cash_row );

            result_rows.push( stock_gift );

        } else if ( isPledgedGift( gift ) && !isMembershipGift( gift ) ) {

            var base_pledge_row = makeBaseGift( gift, constituent_type );
            var pledge_gift = makePledge( gift, base_pledge_row );
            var payments = getPledgePayments( gift, gift_rows, pledge_gift, constituent_type );

            payments.forEach( function( payment ) {

                result_rows.push( duplicateWith( pledge_gift, payment ) );

            });

            pledge_gift['Payment Amount'] = '0';
            pledge_gift['Donation Do Not Create Payment'] = 1;
            result_rows.push( pledge_gift );

        } else if ( isMembershipGift( gift ) ) {

            /**
             * Assumptions for how memberships are stored in RE:
             *
             * Memberships are only linked to the first gift that creates them.
             * Remaining gifts are 'tacked on'.
             *
             * Assumptions:
             *
             *      - Gf_Letter_code === 'Gift Membership' &&
             *
             * Gift representing PAYMENTS for memberships are part of the Membership Campaign, but are not actually linked to memberships.
             * Photo Guild Memberships do not have linked memberships.
             *
             */

            if (
                (typeof gift.Gf_Letter_code !== 'undefined' && gift.Gf_Letter_code.toLowerCase().indexOf('gift') !== -1) ||
                (typeof gift.Gf_Reference !== 'undefined' && gift.Gf_Reference.toLowerCase().indexOf('gift') !== -1)
            ) {

                // Membership Related Gift is purportedly a gift.
                // TODO: Extend this to check all linked memberships, not just _1_01.

                if (
                    typeof gift.Gf_Mem_1_01_System_ID !== 'undefined' && gift.Gf_Mem_1_01_System_ID !== ''
                ) {

                    // Membership Related Gift is purportedly a gift has a linked membership object.

                    if (
                        typeof raw_constituent.CnMem_1_01_Description !== 'undefined' && raw_constituent.CnMem_1_01_Description !== ''
                    ) {

                        //console.log('Case: Gift – has Gift Membership and Constituent Membership');

                        // membership related gifting constituent has linked memberships
                        // NOTE: certainty: high

                        // TODO: See if these memberships match the linked membership.
                        // TODO: if yes, this is an 'own gift' – Just create a membership record for the constituent.
                        // TODO: mark the donation as 95% certainty
                        // TODO: Mark the payment as possible-membership in the DB, so it can be reviewed.

                        // TODO: if no, this is a gift - create a Donation (Whatever Type) tied to this constituent,
                        // TODO: mark the donation as 90% certainty
                        // TODO: Mark the payment as possible-membership in the DB, so it can be reviewed.

                        // TODO: Then, get the membership from the membership set, and create a $0.00 Gift membership,
                        //       With a reference to this constituent in the description.
                        // TODO: mark the donation as 90% certainty
                        // TODO: Mark the payment as possible-membership in the DB, so it can be reviewed.


                    } else {

                        //console.log('Case: Gift – has Gift Membership');

                        // membership related gifting constituent does not have constituent memberships. This is a gift to the linked constituents.
                        // NOTE: certainty: high

                        // TODO: Create a Donation (whatever type is on the gift) Payment for this Constituent,
                        // TODO: Get the membership from the membership set, and create a $0.00 Gift membership,
                        //       With a reference to this constituent in the description.

                    }

                } else {

                    if (
                        typeof raw_constituent.CnMem_1_01_Description !== 'undefined' && raw_constituent.CnMem_1_01_Description !== ''
                    ) {

                        //console.log('Case: Gift – has Constituent Membership');

                        // This gift has no attached memberships, but the constituent has a membership associated with it.
                        // NOTE: Ambiguous. It's not clear whether this gift belongs to the constituent, or was not

                        // TODO: check cost. if cost is $0.00, create membership and relate it to gifting constituent
                        // TODO: mark the donation as 50% certainty
                        // TODO: Mark the payment as possible-membership in the DB, so it can be reviewed.


                        // TODO: if cost is > $0.00, create Donation (whatever type), and relate it to the gifting constituent.
                        // TODO: mark the donation as 50% certainty
                        // TODO: Mark the payment as possible-membership in the DB, so it can be reviewed.

                    } else {

                        console.log('Case: Gift – has nothing');

                        // This gift has no attached membership, and the constituent has no associated memberships either.
                        // NOTE: Ambiguous. It's not clear whether this gift belongs to the constituent, and was not properly associated with a membership

                        // TODO: Create a Donation (whatever type is on the gift) Payment for this Constituent,
                        // TODO: mark the donation as 10% certainty
                        // TODO: Mark the payment as possible-membership in the DB, so it can be reviewed.

                    }

                }

            } else {

                if (
                    typeof gift.Gf_Mem_1_01_System_ID !== 'undefined' && gift.Gf_Mem_1_01_System_ID !== ''
                ) {

                    // Membership Related Gift is purportedly a payment for a constituent membership.

                    if (
                        typeof raw_constituent.CnMem_1_01_Description !== 'undefined' && raw_constituent.CnMem_1_01_Description !== ''
                    ) {

                        //console.log('Case: Non-Gift – has Gift Membership and Constituent Membership');

                        // membership related gifting constituent has linked memberships

                        // TODO: See if these memberships match the linked membership.
                        // TODO: if yes, this is a membership – Just create a membership record for the constituent.
                        // TODO: mark the donation as 100% certainty
                        // TODO: Mark the payment as possible-membership in the DB, so it can be reviewed.

                        // TODO: if no, this is a likely a mislabelled gift - create a Donation (Whatever Type) tied to this constituent,
                        // TODO: mark the donation as 60% certainty
                        // TODO: Mark the payment as possible-membership in the DB, so it can be reviewed.

                        // TODO: Then, get the membership from the membership set, and create a $0.00 Gift membership,
                        //       With a reference to this constituent in the description.
                        // TODO: mark the donation as 60% certainty
                        // TODO: Mark the payment as possible-membership in the DB, so it can be reviewed.


                    } else {

                        //console.log('Case: Non-Gift – has Gift Membership');

                        // This is either a lapsed membership which was deleted from the constituent, or a mislabelled gift.

                        // TODO: Check name on gift membership.
                        // TODO: if name matches constituent, this is a lapsed membership for the constituent
                        // TODO: if yes, this is a membership – Just create a membership record for the constituent.
                        // TODO: mark the donation as 90% certainty
                        // TODO: Mark the payment as possible-membership in the DB, so it can be reviewed.

                        // TODO: if No, this is likely a mislabelled gift
                        // TODO: Create a Donation (whatever type is on the gift) Payment for this Constituent,
                        // TODO: mark the donation as 75% certainty
                        // TODO: Mark the payment as possible-membership in the DB, so it can be reviewed.

                        // TODO: Get the membership from the membership set, and create a $0.00 Gift membership,
                        //       With a reference to this constituent in the description.
                        // TODO: mark the donation as 75% certainty
                        // TODO: Mark the payment as possible-membership in the DB, so it can be reviewed.

                    }

                } else {

                    if (
                        typeof raw_constituent.CnMem_1_01_Description !== 'undefined' && raw_constituent.CnMem_1_01_Description !== ''
                    ) {

                        //console.log('Case: Non-Gift – has Constituent Membership');

                        // This gift has no attached memberships, but the constituent has a membership associated with it.
                        // NOTE: Slightly Ambiguous, but probably safe.

                        // TODO: Create a membership and relate it to the gifting constituent.
                        // TODO: mark the donation as 85% certainty
                        // TODO: Mark the payment as possible-membership in the DB, so it can be reviewed.

                    } else {

                        console.log('Case: Non-Gift – has nothing');

                        // This gift has no attached membership, and the constituent has no associated memberships either.
                        // NOTE: Ambiguous. It's not clear whether this gift belongs to the constituent, and was not properly associated with a membership

                        // TODO: Create a Donation (whatever type is on the gift) Payment for this Constituent,
                        // TODO: mark the donation as 10% certainty
                        // TODO: Mark the payment as possible-membership in the DB, so it can be reviewed.



                    }

                }

            }


            // if ( typeof gift.Gf_Letter_code !== 'undefined' && gift.Gf_Letter_code.toLowerCase().indexOf('gift') !== -1 ) {
            //
            //     if ( parseFloat( format_currency( gift.Gf_Amount ) ) === 0 ) {
            //
            //         console.log('Assertion Failure: gift at no cost? ' + gift.Gf_Reference );
            //
            //     }
            //
            // }
            //
            //
            // if ( typeof gift.Gf_Letter_code !== 'undefined' && gift.Gf_Letter_code.toLowerCase().indexOf('gift') === -1 ) {
            //
            //     if ( typeof raw_constituent.CnMem_1_01_Description === 'undefined' || raw_constituent.CnMem_1_01_Description === '' ) {
            //
            //         console.log('');
            //
            //         console.log( 'Assertion Failure: non-gift membership with no memberships associated with constituent: ' );
            //
            //         if ( typeof gift.Gf_Mem_1_01_System_ID !== 'undefined' && gift.Gf_Mem_1_01_System_ID !== '' ) {
            //
            //             console.log( 'Gift Listed Membership Constituent: ' + gift.Gf_Mem_1_01_Constit, 'Gifting Constituent: ' + gift.Gf_CnBio_Name );
            //
            //         } else {
            //
            //             console.log( 'Failure: No membership data on Gift or Constituent.' );
            //
            //         }
            //         console.log('');
            //
            //
            //     }



                // if ( typeof gift.Gf_Mem_1_01_System_ID === 'undefined' || gift.Gf_Mem_1_01_System_ID !== '' ) {
                //
                //     if ( memberships.length === 0 ) {
                //
                //         console.log( 'Assertion Failure: Non-gift membership with no associated memberships' );
                //
                //     }
                //
                // }

                // if ( memberships.length === 0 ) {
                //
                //     console.log( 'Assertion Failure: Non-gift membership (' + gift.Gf_Letter_code + ') with no associated memberships' );
                //
                // }

            }





            // if ( typeof gift.Gf_Mem_1_01_System_ID !== 'undefined' && gift.Gf_Mem_1_01_System_ID !== '' ) {
            //
            //     if ( raw_constituent.CnBio_Name !== gift.Gf_CnBio_Name || gift.Gf_CnBio_Name !== gift.Gf_Mem_1_01_Constit ) {
            //
            //         console.log( '' );
            //         console.log( 'Name of Constituent: ' + raw_constituent.CnBio_Name );
            //         console.log( 'Name of Gifter: ' + gift.Gf_CnBio_Name );
            //         console.log( 'Name on Gift Membership: ' + gift.Gf_Mem_1_01_Constit );
            //         console.log( '' );
            //
            //     }
            //
            //     // console.log( '' );
            //     // console.log( 'Membership ID on Gift: ' + gift.Gf_Mem_1_01_System_ID );
            //     // console.log( 'Membership IDs on Constituent Membership: ' + membership_map[ raw_constituent.CnBio_System_ID ].map( function( m ) { return m.Mem_System_ID; }));
            //     // console.log( '' );
            // }

            // if ( isPledgedGift( gift ) ) {
            //
            //
            // } else {
            //
            //
            // }



    });

    return result_rows;

}



/**
 * This routine constructs the basic information that all opportunity / donations
 * records must have in Salesforce, and must be carried over from Raiser's Edge.
 */
function makeBaseGift( gift, type ) {

    var mapping = {};

    mapping.Gf_Amount = 'Donation Amount';
    mapping.Gf_Date = 'Donation Date';
    mapping.Gf_Campaign = 'Donation RE Campaign';
    mapping.Gf_Appeal = 'Donation RE Appeal';
    mapping.Gf_Fund = 'Donation RE Fund';
    mapping.Gf_System_ID = 'Donation RE ID';
    mapping.Gf_Batch_Number = 'Donation RE Batch Number';

    var donation_row = makeSurjectiveMappingWith( mapping )( gift );

    donation_row['Donation Amount'] = format_currency( donation_row['Donation Amount'] );
    donation_row['Donation Date'] = format_date( donation_row['Donation Date'] );
    donation_row['Donation Donor'] = type; // NOTE: One of Account1 or Contact1
    donation_row['Donation Campaign Name'] = donation_row['Donation RE Appeal'];
    donation_row['Donation Description'] = condense_gift_description( gift );

    return donation_row;

}

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
    cash_row['Payment Date'] = format_date( gift.Gf_Check_date || gift.Gf_Date );
    cash_row['Payment RE ID'] = cash_row['Donation RE ID'];
    cash_row['Payment Paid'] = 1;
    cash_row['Payment Amount'] = cash_row['Donation Amount'];

    return cash_row;

}

/**
 * This creates fields specific to a stock-type gift. Typically,
 * This would be called on the output of `makeCashGift` to convert
 * the cash gift into a stock gift.
 *
 * NOTE: NAM treats stock and cash gifts as very similar – stock gifts are
 *       only booked once they have been liquidated – once a check is recieved,
 *       so they are effectively cash on hand.
 */
function makeStockGift( gift, donation_row ) {

    var mapping = {};

    mapping.Gf_Issuer = 'Donation Stock Issuer';
    mapping.Gf_Issuer_symbol = 'Donation Stock Issuer Ticker Symbol';
    mapping.Gf_Issuer_median_price = 'Donation Stock Mean Value';
    mapping.Gf_Issr_nmbr_of_nits = 'Donation Stock Units Issued';
    mapping.Gf_Sale_of_stock_amount = 'Donation Stock Liquid Value';
    mapping.Gf_Sal_of_stock_brokr_f = 'Donation Stock Broker Fee';
    mapping.Gf_Issuer = 'Donation Stock Issuer';

    var stock_row = duplicateWith( donation_row, makeSurjectiveMappingWith( mapping )( gift ) );

    stock_row['Donation Stock Mean Value'] = format_currency( stock_row['Donation Stock Mean Value'] );
    stock_row['Donation Stock Liquid Value'] = format_currency( stock_row['Donation Stock Liquid Value'] );
    stock_row['Donation Stock Broker Fee'] = format_currency( stock_row['Donation Stock Broker Fee'] );
    stock_row['Donation Stock Issuer'] = stock_row['Donation Stock Issuer'].toUpperCase();
    stock_row['Donation Record Type Name'] = 'Donation (Stock)';
    stock_row['Donation Type'] = 'Stock';
    stock_row['Donation Acknowledgement Status'] = 'Acknowledged';
    stock_row['Payment Date'] = format_date( gift.Gf_Sale_of_stock_date || gift.Gf_Date );
    stock_row['Payment Paid'] = 1;
    stock_row['Payment Amount'] = stock_row['Donation Amount'];

    return stock_row;

}

/**
 *
 *
 */
function makePledge( gift, pledge_row ) {

    pledge_row['Donation Type'] = 'Pledge';
    pledge_row['Donation Stage'] = 'Pledged';
    pledge_row['Donation Record Type Name'] = 'Donation (Pledged)';
    pledge_row['Donation Installment Plan'] = normalizeInstallmentPlan( gift.Gf_Installmnt_Frqncy );
    pledge_row['Donation Installment Schedule'] = gift.Gf_Installment_schedule;
    pledge_row['Donation Acknowledgement Status'] = 'Acknowledged'; // TODO: verify that this is the right acknowledgement stage for the gift.
    pledge_row['Payment Paid'] = 0;


    return pledge_row;

}

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

    payment['Payment Date'] = format_date( payment['Payment Date'] );
    payment['Payment Paid'] = 1;
    payment['Payment Amount'] = format_currency( payment['Payment Amount'] );
    payment['Payment Description'] = condense_gift_description( payment_row );

    return payment;

}


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

    return result.map( function( payment ){ payment[0].FLAGGED_SEEN = true; return payment[1]; });

}

/**
 * This creates a pledged gift. Pledged gifts behave somewhat peculiarly.
 *
 */
function getPledgePayments( gift, gift_rows, pledge, constituent_type ) {

    var payments = gift_rows.filter( function( g ) { return isPledgePayment( g ); } )
                            .map( function( p ) { return [p, makePledgePayment( p )]; });

    var pledged_amount = parseFloat( pledge['Donation Amount'] );

    if ( pledge['Donation Installment Plan'] === 'Single Installment' ) {

        // We're looking for a single pledge payment.
        var installments = findMatchingInstallments( pledge, payments, function( a, b ) { return pledged_amount === parseFloat( b ); });

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
            return [ payment[1] ];

        }


    } else {

        // We're looking for potentially multiple pledge payments.
        var installments = findMatchingInstallments( pledge, payments, function( a, b ) { return pledged_amount <= parseFloat( b ); });

        if ( installments.length === 0 ) {

            return [];

        } else {

            return aggregateResultingPayments( pledge, installments );

        }

    }



}

function findMatchingInstallments( pledge, payments, compare ) {


    return payments.filter( function( payment ) {

        return pledge['Donation RE Campaign'] === payment[1]['Payment RE Campaign'] &&
               pledge['Donation RE Fund'] === payment[1]['Payment RE Fund'] &&
               pledge['Donation RE Appeal'] === payment[1]['Payment RE Appeal'] &&
               compare( pledge['Donation Amount'], payment[1]['Payment Amount'] ) &&
               moment( pledge['Donation Date'] ).isSameOrBefore( moment( payment[1]['Payment Date']) )

    });

}


function print_payment_details( pledge, payment ) {
    //console.log( 'Pledge:\t', pledge['Donation RE Campaign'],pledge['Donation RE Fund'],pledge['Donation RE Appeal'],pledge['Donation Amount'],pledge['Donation Date'] );
    console.log( 'Payment:\t', payment['Payment RE Campaign'],payment['Payment RE Fund'],payment['Payment RE Appeal'],payment['Payment Amount'],payment['Payment Date'] );
}


/**
 * Check whether a gift is a stock item.
 */
function isCashGift( gift ) {

    // var campaign = ( typeof gift.Gf_Campaign !== 'undefined') ? gift.Gf_Campaign.toLowerCase() : '';
    // var fund = ( typeof gift.Gf_Fund !== 'undefined') ? gift.Gf_Fund.toLowerCase() : '';
    // var frequency = ( typeof gift.Gf_Installmnt_Frqncy !== 'undefined') ? gift.Gf_Installmnt_Frqncy.toLowerCase() : '';
    var type = ( typeof gift.Gf_Type !== 'undefined') ? gift.Gf_Type.toLowerCase() : ''

    return type === 'cash'; // || type === '' ?? Should we assume unmarked gifts are cash gifts? Seems reasonable.

}

/**
 * Check whether a gift is a stock item.
 */
function isStockGift( gift ) {

    // var campaign = ( typeof gift.Gf_Campaign !== 'undefined') ? gift.Gf_Campaign.toLowerCase() : '';
    // var fund = ( typeof gift.Gf_Fund !== 'undefined') ? gift.Gf_Fund.toLowerCase() : '';
    // var frequency = ( typeof gift.Gf_Installmnt_Frqncy !== 'undefined') ? gift.Gf_Installmnt_Frqncy.toLowerCase() : '';
    var type = ( typeof gift.Gf_Type !== 'undefined') ? gift.Gf_Type.toLowerCase() : ''

    return (type === 'stock/property (sold)' || type === 'stock/property');


}


function isPledgedGift( gift ) {

    // var campaign = ( typeof gift.Gf_Campaign !== 'undefined') ? gift.Gf_Campaign.toLowerCase() : '';
    // var fund = ( typeof gift.Gf_Fund !== 'undefined') ? gift.Gf_Fund.toLowerCase() : '';
    // var frequency = ( typeof gift.Gf_Installmnt_Frqncy !== 'undefined') ? gift.Gf_Installmnt_Frqncy.toLowerCase() : '';
    var type = ( typeof gift.Gf_Type !== 'undefined') ? gift.Gf_Type.toLowerCase() : ''

    return (type === 'pledge');

}


function isPledgePayment( gift ) {

    var type = ( typeof gift.Gf_Type !== 'undefined') ? gift.Gf_Type.toLowerCase() : ''

    return type.indexOf( 'pay-' ) !== -1 && type.indexOf( 'mg pay-' ) === -1 && (typeof gift.FLAGGED_SEEN === 'undefined');

}


function isMembershipGift( gift ) {

    var campaign = ( typeof gift.Gf_Campaign !== 'undefined') ? gift.Gf_Campaign.toLowerCase() : '';
    // var fund = ( typeof gift.Gf_Fund !== 'undefined') ? gift.Gf_Fund.toLowerCase() : '';
    // var frequency = ( typeof gift.Gf_Installmnt_Frqncy !== 'undefined') ? gift.Gf_Installmnt_Frqncy.toLowerCase() : '';
    // var type = ( typeof gift.Gf_Type !== 'undefined') ? gift.Gf_Type.toLowerCase() : '';

    return campaign === 'membership';

}



/**
 * Format Currency appropriately.
 *
 */
function format_currency( amt ) {

    try {

        return parseFloat( amt.replace('$', '' ).replace(',', '', 'g') );

    } catch( e ) {

        return "";

    }

}


function makeIDMap( key, rows ) {

    var result = {};

    rows.forEach( function( membership ) {

        if ( typeof result[ membership[ key ] ] !== 'undefined' && result[ membership[ key ] ].length > 0 ) {

            result[ membership[ key ] ].push( membership );

        } else {

            result[ membership[ key ] ] = [ membership ];

        }

    });

    return result;

}


function condense_gift_description( gift ) {

    var notes = [];

    if ( typeof gift.Gf_Reference !== 'undefined' && gift.Gf_Reference !== '' ) {
        notes.push( gift.Gf_Reference );
    }

    for ( var i = 1; i < gift_note_count; i += 1 ){

        var date = gift['Gf_Note_1_' + ((('' + i).length === 1 ) ? '0' + i : i ) + 'Date' ];
        var note = gift['Gf_Note_1_' + ((('' + i).length === 1 ) ? '0' + i : i ) + 'Actual_Notes' ];

        if ( typeof note !== 'undefined' && note.length > 0 ) {
            if ( typeof date !== 'undefined' && date.length > 0 ) {
                notes.push( [ date, note ].join(' - ') );
            } else {
                notes.push( note );
            }
        }

    }

    return notes.join('; ');

}



function normalizeInstallmentPlan( plan ) {
    switch ( plan.trim().toLowerCase() ) {

        case 'irregular':
            return 'Irregular Installments';

        case 'semi-annually':
            return 'Semi-Annual Installments';

        case 'annually':
            return 'Annual Installments';

        case 'quarterly':
            return 'Quarterly Installments';

        case 'monthly':
            return 'Monthly Installments';

        case 'single installment':
            return 'Single Installment';

        default:
            return '';

    }
}




/**
 * Test for well-formed-ness of memberships.
 */
function testMembershipPresence( gifts, memberships ) {

    var membership_gifts = gifts.filter( function( gift ) { return (typeof gift.Gf_Campaign !== 'undefined') && gift.Gf_Campaign.toLowerCase() === 'membership'; } );

    return ( membership_gifts.length === 0 && memberships.length === 0) || ( membership_gifts.length > 0 && memberships.length > 0 );

}
