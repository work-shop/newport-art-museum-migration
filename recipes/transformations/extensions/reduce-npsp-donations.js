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

const linked_gift_memberships_count = 5;

const linked_constituent_memberships_count = 5;

module.exports = function( type, row, gifts, membership_map, raw_constituent ) {

    var gift_ids = gifts.map( function( g ) { return g.Gf_CnBio_System_ID; } );

    // NOTE: Super time consuming operation here which runs in O(m log n),
    // where m is the number of constituents (~16k) and n is the number of gifts (~64k).
    var relevant_gifts_indices = search( gift_ids, row[ type + ' RE ID' ], compare );
    //var relevant_membership_indices_by_constituent = search( membership_constituent_ids, row[ type + ' RE ID' ], compare );

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
        membership_map,
        raw_constituent
    );

    return donation_rows;


};



/**
 * Donation-Related Logic
 *
 */
function makeDonationSetForConstituent( constituent_type, gift_rows, membership_map, raw_constituent ) {

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

        } else if ( isOtherGift( gift ) && !isMembershipGift( gift ) ) {

            var base_row = makeBaseGift( gift, constituent_type );
            var other_row = makeOtherGift( gift, base_row )

            result_rows.push( other_row );

        } else if ( isMembershipGift( gift )  ) {

            var membership_rows = getMembershipGifts( gift, raw_constituent, membership_map, constituent_type, gift_rows );

            membership_rows.forEach( function( membership_row ) {

                result_rows.push( membership_row );

            });

        }

    });

    return result_rows;

}


var count = 0;

function getMembershipGifts( gift, constituent, membership_map, constituent_type, gift_rows ) {

    /**
     * Assumptions for how memberships are stored in RE:
     *
     *
     *
     */
    var linked_gift_memberships = removeDuplicateMemberships( getLinkedMembershipsForGift( gift, membership_map ) );
    var linked_constituent_memberships = getLinkedMembershipsForConstituent( constituent );

    if (
        membershipIsAGift( gift )
    ) {

        // Membership Related Gift is purportedly a gift, based on the assertions of the thank-you letter, Reference field,
        // and
        if (
            linked_gift_memberships.length > 0
        ) {

            // Membership Related Gift is purportedly a gift has a linked membership object.

            if (
                linked_constituent_memberships.length > 0
            ) {

                // count_quantity('Case: Gift – has Gift Membership and Constituent Membership');

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

                //count_quantity('Case: Gift – has Gift Membership');

                // membership related gifting constituent does not have constituent memberships. This is a gift to the linked constituents.
                // NOTE: certainty: high

                // TODO: Create a Donation (whatever type is on the gift) Payment for this Constituent,
                // TODO: Get the membership from the membership set, and create a $0.00 Gift membership,
                //       With a reference to this constituent in the description.

            }

        } else {

            if (
                linked_constituent_memberships.length > 0
            ) {

                // count_quantity('Case: Gift – has Constituent Membership');

                // This gift has no attached memberships, but the constituent has a membership associated with it.
                // NOTE: Ambiguous. It's not clear whether this gift belongs to the constituent, or was not

                // TODO: check cost. if cost is $0.00, create membership and relate it to gifting constituent
                // TODO: mark the donation as 50% certainty
                // TODO: Mark the payment as possible-membership in the DB, so it can be reviewed.


                // TODO: if cost is > $0.00, create Donation (whatever type), and relate it to the gifting constituent.
                // TODO: mark the donation as 50% certainty
                // TODO: Mark the payment as possible-membership in the DB, so it can be reviewed.

            } else {

                // count_quantity('Case: Gift – has nothing');

                // This gift has no attached membership, and the constituent has no associated memberships either.
                // NOTE: Ambiguous. It's not clear whether this gift belongs to the constituent, and was not properly associated with a membership

                // TODO: Create a Donation (whatever type is on the gift) Payment for this Constituent,
                // TODO: mark the donation as 10% certainty
                // TODO: Mark the payment as possible-membership in the DB, so it can be reviewed.

            }

        }

    } else {

        // This membership-related gift is likely not a gift for a constituent, but a direct membership.

        if (
            linked_gift_memberships.length > 0
        ) {

            // Membership Related Gift is purportedly a payment for a constituent membership.

            if (
                linked_constituent_memberships.length > 0
            ) {



                // count_quantity('Case: Non-Gift – has Gift Membership and Constituent Membership');

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

                return getDoublyLinkedNongiftMemberships( constituent_type, gift, constituent, linked_constituent_memberships, linked_gift_memberships, gift_rows );

            } else {

                // count_quantity('Case: Non-Gift – has Gift Membership');

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
                linked_constituent_memberships.length > 0
            ) {

                // count_quantity('Case: Non-Gift – has Constituent Membership');

                // This gift has no attached memberships, but the constituent has a membership associated with it.
                // NOTE: Slightly Ambiguous, but probably safe.

                // TODO: Create a membership and relate it to the gifting constituent.
                // TODO: mark the donation as 85% certainty
                // TODO: Mark the payment as possible-membership in the DB, so it can be reviewed.

            } else {

                // count_quantity( 'Case: Non-Gift – has nothing' );

                // This gift has no attached membership, and the constituent has no associated memberships either.
                // NOTE: Ambiguous. It's not clear whether this gift belongs to the constituent, and was not properly associated with a membership

                // TODO: Create a Donation (whatever type is on the gift) Payment for this Constituent,
                // TODO: mark the donation as 10% certainty
                // TODO: Mark the payment as possible-membership in the DB, so it can be reviewed.



            }

        }

    }

    return [];

}



function count_quantity( msg ) {
    count += 1;
    console.log( msg + ' [' + count + ']' );
}

function getDoublyLinkedNongiftMemberships( constituent_type, gift, constituent, constituent_linked_memberships, gift_linked_memberships, gift_rows ) {


    var viable_c_linked_memberships = getViableMemberships( gift, constituent_linked_memberships );
    var viable_g_linked_memberships = getViableMemberships( gift, gift_linked_memberships );

    if ( viable_c_linked_memberships.length === 1 && viable_g_linked_memberships.length === 1 ) {

        var m1 = viable_c_linked_memberships[0], m2 = viable_g_linked_memberships[0];

        if ( equalMemberships( m1, m2 ) ) {

            // count_quantity( 'Case: Non-gift, Doubly Linked: Matching gifts are equal' );

            return makeMembershipGift( constituent_type, gift, m1, 100, 'This membership gift was paired exactly with a matching Raiser\'s Edge membership record.', gift_rows );

        } else {

            // count_quantity( 'Case: Non-gift, Doubly Linked: Matching gifts are not equal' );

        }


    } else if ( viable_c_linked_memberships.length > 1 && viable_g_linked_memberships.length === 1 ) {

        // count_quantity( 'Case: Non-gift, Doubly Linked: Constituent has multiple memberships, but gift is linked to 1' );

    } else if ( viable_c_linked_memberships.length === 1 && viable_g_linked_memberships.length > 1 ) {

        // count_quantity( 'Case: Non-gift, Doubly Linked: Constituent has single memberships, but gift is linked to several' );

    } else {

        //count_quantity( 'Case: Non-gift, Doubly Linked: Constituent has multiple memberships, and gift is linked to multiple memberships' );


    }

    return [];

}


function getViableMemberships( gift, memberships ) {
    return memberships.filter( function( m ) { return giftViableForMembership( gift, m ); });
}



function giftViableForMembership( gift, membership ) {

    var gift_date = moment( gift['Donation Date'] )
    var membership_start_date = moment( membership['Membership Date Joined'] );
    var membership_renewed_date = moment( membership['Membership Last Renewed'] );

    if ( membership_start_date.isSame( membership_renewed_date ) ) {

        return gift_date.isSameOrAfter( membership_start_date.subtract(1, 'months') );

    } else {

        return gift_date.isSameOrBefore( membership_renewed_date ) && gift_date.isSameOrAfter( membership_start_date.subtract(1, 'months') );

    }


}

function equalMemberships( m1, m2 ) {
    return m1['Membership Category'] === m2['Membership Category'] &&
           m1['Membership Program'] === m2['Membership Program'] &&
           m1['Membership Date Joined'] === m2['Membership Date Joined'] &&
           m1['Membership Date Last Dropped'] === m2['Membership Date Last Dropped'] &&
           m1['Membership Date Last Renewed'] === m2['Membership Date Last Renewed'] &&
           m1['Membership Standing'] === m2['Membership Standing'] &&
           m1['Membership Constituent Name'] === m2['Membership Constituent Name'];

}



function removeDuplicateMemberships( memberships ) {

    var result = [];

    for ( var i = 0; i < memberships.length; i++ ) {

        if (
            result.map( function( m ) { return !equalMemberships( m, memberships[i] ); })
                  .reduce( function( a,b ) { return a && b; }, true )
        ) {

            result.push( memberships[i] );

        }

    }

    return result;

}



function membershipIsAGift( gift ) {
    return (typeof gift.Gf_Letter_code !== 'undefined' && gift.Gf_Letter_code.toLowerCase().indexOf('gift') !== -1) ||
           (typeof gift.Gf_Reference !== 'undefined' && gift.Gf_Reference.toLowerCase().indexOf('gift') !== -1);
}



function getLinkedMembershipsForGift( gift, membership_map ) {

    var result = [];

    for ( var i = 1; i <= linked_gift_memberships_count; i++ ) {

        var name = gift[ 'Gf_Mem_1_' + ((('' + i).length > 1) ? i : '0' + i ) + '_Constit' ];

        if ( typeof name !== 'undefined' && name !== '' ) {

            var raw_memberships = membership_map[ name ];

            if ( typeof raw_memberships !== 'undefined' ) {

                var mapping = {};

                //mapping.Mem_AddedBy = 'Membership Added By';
                mapping.Mem_Category = 'Membership Category';
                mapping.Mem_Consecutive_Years = 'Membership Consecutive Years';
                mapping.Mem_Current_Dues_Amount = 'Membership Current Dues Amount';
                mapping.Mem_DateAdded = 'Membership Date Added';
                mapping.Mem_Date_Joined = 'Membership Date Joined';
                mapping.Mem_DateChanged = 'Membership Date Changed';
                mapping.Mem_Description = 'Membership Description';
                mapping.Mem_Last_Dropped_Date = 'Membership Date Last Dropped';
                mapping.Mem_Last_Renewed_Date = 'Membership Date Last Renewed';
                mapping.Mem_Notes = 'Membership Notes';
                mapping.Mem_Primary = 'Membership Is Primary';
                mapping.Mem_Program = 'Membership Program';
                mapping.Mem_Standing = 'Membership Standing';
                mapping.Mem_Total_Children = 'Membership Total Children';
                mapping.Mem_Total_Members = 'Membership Total Members';
                mapping.Mem_Total_Years = 'Membership Total Years';
                mapping.Mem_CnBio_System_ID = 'Membership Constituent ID';
                mapping.Mem_CnBio_Name = 'Membership Constituent Name';

                for ( var j = 0; j < raw_memberships.length; j += 1 ) {

                    var mem = makeSurjectiveMappingWith( mapping )( raw_memberships[j] );

                    if ( !emptyRecord( mem ) ) { result.push( mem ); }

                }

            }

        }

    }

    return result;

}


function getLinkedMembershipsForConstituent( constituent ) {

    var result = [];

    for ( var i = 1; i <= linked_constituent_memberships_count; i++ ) {

        var mapping = {};

        // mapping[ 'CnMem_1_' + ((('' + i).length > 1) ? i : '0' + i ) + '_AddedBy' ] = 'Membership Added By';
        mapping[ 'CnMem_1_' + ((('' + i).length > 1) ? i : '0' + i ) + '_Category' ] = 'Membership Category';
        mapping[ 'CnMem_1_' + ((('' + i).length > 1) ? i : '0' + i ) + '_Consecutive_Years' ] = 'Membership Consecutive Years';
        mapping[ 'CnMem_1_' + ((('' + i).length > 1) ? i : '0' + i ) + '_Current_Dues_Amount' ] = 'Membership Current Dues Amount';
        mapping[ 'CnMem_1_' + ((('' + i).length > 1) ? i : '0' + i ) + '_DateAdded' ] = 'Membership Date Added';
        mapping[ 'CnMem_1_' + ((('' + i).length > 1) ? i : '0' + i ) + '_Date_Joined' ] = 'Membership Date Joined';
        mapping[ 'CnMem_1_' + ((('' + i).length > 1) ? i : '0' + i ) + '_DateChanged' ] = 'Membership Date Changed';
        mapping[ 'CnMem_1_' + ((('' + i).length > 1) ? i : '0' + i ) + '_Description' ] = 'Membership Description';
        mapping[ 'CnMem_1_' + ((('' + i).length > 1) ? i : '0' + i ) + '_Last_Dropped_Date' ] = 'Membership Date Last Dropped';
        mapping[ 'CnMem_1_' + ((('' + i).length > 1) ? i : '0' + i ) + '_Last_Renewed_Date' ] = 'Membership Date Last Renewed';
        mapping[ 'CnMem_1_' + ((('' + i).length > 1) ? i : '0' + i ) + '_Notes' ] = 'Membership Notes';
        mapping[ 'CnMem_1_' + ((('' + i).length > 1) ? i : '0' + i ) + '_Primary' ] = 'Membership Is Primary';
        mapping[ 'CnMem_1_' + ((('' + i).length > 1) ? i : '0' + i ) + '_Program' ] = 'Membership Program';
        mapping[ 'CnMem_1_' + ((('' + i).length > 1) ? i : '0' + i ) + '_Standing' ] = 'Membership Standing';
        mapping[ 'CnMem_1_' + ((('' + i).length > 1) ? i : '0' + i ) + '_Total_Children' ] = 'Membership Total Children';
        mapping[ 'CnMem_1_' + ((('' + i).length > 1) ? i : '0' + i ) + '_Total_Members' ] = 'Membership Total Members';
        mapping[ 'CnMem_1_' + ((('' + i).length > 1) ? i : '0' + i ) + '_Total_Years' ] = 'Membership Total Years';

        var mem = makeSurjectiveMappingWith( mapping )( constituent );

        if ( !emptyRecord( mem ) ) {
            mem['Membership Constituent ID'] = constituent.CnBio_System_ID;
            mem['Membership Constituent Name'] = constituent.CnBio_Name;
            result.push( mem );
        }

    }

    return result;

}


function emptyRecord( record ) {

    var empty = true;

    for ( var key in record ) {
        if ( record.hasOwnProperty( key ) ) {

            if ( record[ key ] !== '' ) {
                empty = false;
                break;
            }

        }
    }

    return empty;

}


function makeMembershipGift( constituent_type, raw_gift, membership, certainty, description, gift_rows ) {

    var base_row = makeBaseGift( raw_gift, constituent_type );

    if ( isCashGift( raw_gift ) ) {

        var membership_gift = makeCashGift( raw_gift, base_row );

        membership_gift['Donation Record Type Name'] = 'Membership';
        membership_gift['Donation Membership Origin'] = '';
        membership_gift['Donation Membership Start Date'] = membership_gift['Donation Date'];
        membership_gift['Donation Membership End Date'] = moment( membership_gift['Donation Date'] ).add(1,'y').format('MM/DD/YY');
        membership_gift['Donation Membership Level'] = membership['Membership Category'];
        membership_gift['Donation Certainty'] = certainty;
        membership_gift['Donation Migration Description'] = description;
        membership_gift['Donation Migration Donation Type'] = 'Membership-related Donation';

        membership_gift['FLAG: Donation Membership Holder ID'] = membership['Membership Constituent ID'];

        return [ membership_gift ];

    } else if ( isStockGift( raw_gift ) ) {

        var cash_row = makeCashGift( raw_gift, base_row )
        var membership_gift = makeStockGift( raw_gift, cash_row );

        membership_gift['Donation Record Type Name'] = 'Membership';
        membership_gift['Donation Membership Origin'] = '';
        membership_gift['Donation Membership Start Date'] = membership_gift['Donation Date'];
        membership_gift['Donation Membership End Date'] = moment( membership_gift['Donation Date'] ).add(1,'y').format('MM/DD/YY');
        membership_gift['Donation Membership Level'] = membership['Membership Category'];
        membership_gift['Donation Certainty'] = certainty;
        membership_gift['Donation Migration Description'] = description;
        membership_gift['Donation Migration Donation Type'] = 'Membership-related Donation';

        membership_gift['FLAG: Donation Membership Holder ID'] = membership['Membership Constituent ID'];

        return [ membership_gift ];

    } else if ( isPledgedGift( raw_gift ) ) {

        var result_rows;

        var membership_gift = makePledge( raw_gift, base_row );
        var payments = getPledgePayments( raw_gift, gift_rows, membership_gift, constituent_type );

        membership_gift['Donation Record Type Name'] = 'Membership';
        membership_gift['Donation Membership Origin'] = '';
        membership_gift['Donation Membership Start Date'] = membership_gift['Donation Date'];
        membership_gift['Donation Membership End Date'] = moment( membership_gift['Donation Date'] ).add(1,'y').format('MM/DD/YY');
        membership_gift['Donation Membership Level'] = membership['Membership Category'];
        membership_gift['Donation Certainty'] = certainty;
        membership_gift['Donation Migration Description'] = description;
        membership_gift['Donation Migration Donation Type'] = 'Membership-related Donation';

        membership_gift['FLAG: Donation Membership Holder ID'] = membership['Membership Constituent ID'];

        payments.forEach( function( payment ) {

            result_rows.push( duplicateWith( membership_gift, payment ) );

        });

        membership_gift['Payment Amount'] = '0';
        membership_gift['Donation Do Not Create Payment'] = 1;
        result_rows.push( membership_gift );

        return result_rows;

    } else if ( isOtherGift( raw_gift ) ) {

        var membership_gift = makeOtherGift( raw_gift, base_row );

        membership_gift['Donation Record Type Name'] = 'Membership';
        membership_gift['Donation Membership Origin'] = '';
        membership_gift['Donation Membership Start Date'] = membership_gift['Donation Date'];
        membership_gift['Donation Membership End Date'] = moment( membership_gift['Donation Date'] ).add(1,'y').format('MM/DD/YY');
        membership_gift['Donation Membership Level'] = membership['Membership Category'];
        membership_gift['Donation Certainty'] = certainty;
        membership_gift['Donation Migration Description'] = description;
        membership_gift['Donation Migration Donation Type'] = 'Membership-related Donation';

        membership_gift['FLAG: Donation Membership Holder ID'] = membership['Membership Constituent ID'];

        return [ membership_gift ];

    } else {

        console.log( 'Found Nonstandard Gift Type: ' + raw_gift.Gf_Type );
        return [];

    }



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
    cash_row['Donation Certainty'] = 100;
    cash_row['Donation Migration Description'] = 'Single cash gift linked directly to Primary Donor.'
    cash_row['Payment Date'] = format_date( gift.Gf_Check_date || gift.Gf_Date );
    cash_row['Payment RE ID'] = cash_row['Donation RE ID'];
    cash_row['Payment Paid'] = 1;
    cash_row['Payment Certainty'] = 100;
    cash_row['Payment Migration Description'] = 'Payment automatically created to match donation.'
    cash_row['Payment Amount'] = cash_row['Donation Amount'];

    return cash_row;

}

/**
 * Construct an 'Other' type gift – in this case, we're treating 'Other' gifts as 'Cash' gifts.
 */
function makeOtherGift( gift, donation_row  ) {

    return makeCashGift( gift, donation_row );

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
    stock_row['Donation Certainty'] = 100;
    stock_row['Donation Migration Description'] = 'Single stock gift linked directly to Primary Donor.'
    stock_row['Payment Certainty'] = 100;
    stock_row['Payment Migration Description'] = 'Payment automatically created to match donation.'
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
    pledge_row['Donation Certainty'] = 100;
    pledge_row['Donation Migration Description'] = 'Single pledge gift linked directly to Primary Donor.'
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

    return result.map( function( payment ){

        payment[1]['Payment Certainty'] = ( sum === pledged_amount ) ? 100 : 85;
        payment[1]['Payment Migration Description'] = ( sum === pledged_amount ) ? 'Exactly matched a set of pledge payments to this pledge.' : 'Partially matched a set of pledge payments to this pledge.';
        payment[0].FLAGGED_SEEN = true;
        return payment[1];

    });

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
            payment[1]['Payment Certainty'] = 100;
            payment[1]['Payment Migration Description'] = 'Matched a single ' + payment[0].Gf_Type  + ' payment to this pledge.';
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


function isOtherGift( gift ) {

    // var campaign = ( typeof gift.Gf_Campaign !== 'undefined') ? gift.Gf_Campaign.toLowerCase() : '';
    // var fund = ( typeof gift.Gf_Fund !== 'undefined') ? gift.Gf_Fund.toLowerCase() : '';
    // var frequency = ( typeof gift.Gf_Installmnt_Frqncy !== 'undefined') ? gift.Gf_Installmnt_Frqncy.toLowerCase() : '';
    var type = ( typeof gift.Gf_Type !== 'undefined') ? gift.Gf_Type.toLowerCase() : ''

    return (type === 'other');

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
