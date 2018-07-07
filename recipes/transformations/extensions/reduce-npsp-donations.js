'use strict';

var merge = require('./objects.js').merge;
var duplicateWith = require('./objects.js').duplicateWith;
var makeSurjectiveMappingWith = require('./objects.js').makeSurjectiveMappingWith;

var format_date = require('./format-date.js');

var search = require('binary-search-range');
/**
 * Comparator for binary search.
 */
function compare( a, b ) { return ( a < b ) ? -1 : (( a > b ) ? 1 : 0); }

const gift_note_count = 3;

module.exports = function( type, row, gifts, memberships ) {

    var gift_ids = gifts.map( function( g ) { return g.Gf_CnBio_System_ID; } );
    var membership_ids = memberships.map( function( m ) { return m.Mem_System_ID; });

    // NOTE: Super time consuming operation here which runs in O(m log n),
    // where m is the number of constituents (~16k) and n is the number of gifts (~64k).
    var relevant_gifts_indices = search( gift_ids, row[ type + ' RE ID' ], compare );
    var relevant_membership_indices = search( membership_ids, row[ type + ' RE ID' ], compare );

    // var valid = testMembershipPresence( relevant_gifts_indices, relevant_membership_indices );
    //
    // if ( !valid ) { console.log( 'membership gift without membership association.' ); }

    var donation_rows = makeDonationSetForConstituent( 'Contact1',
        relevant_gifts_indices.map( function( i ) { return gifts[ i ]; } ),
        makeIDMap( 'Mem_System_ID', relevant_membership_indices.map( function( i ) { return memberships[ i ]; } ) )
    );

    return donation_rows;


};

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

    return stock_row;

}


/**
 * This creates a pledged gift. Pledged gifts behave somewhat peculiarly.
 *
 */
function makePledgedGift() {

}



/**
 * Donation-Related Logic
 *
 */
function makeDonationSetForConstituent( constituent_type, gift_rows, membership_map ) {

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

        }

    });

    return result_rows;

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

    return type.indexOf( )


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

        result[ 'id' + membership[ key ] ] = membership;

    });

    return result;

}


function condense_gift_description( gift ) {

    var notes = [];

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




/**
 * Test for well-formed-ness of memberships.
 */
function testMembershipPresence( gifts, memberships ) {

    var membership_gifts = gifts.filter( function( gift ) { return (typeof gift.Gf_Campaign !== 'undefined') && gift.Gf_Campaign.toLowerCase() === 'membership'; } );

    return ( membership_gifts.length === 0 && memberships.length === 0) || ( membership_gifts.length > 0 && memberships.length > 0 );

}
