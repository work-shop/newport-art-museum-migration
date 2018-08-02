'use strict';


var allEntriesEqual = require('./objects.js').allEntriesEqual;

var makeMembershipGift = require('./npsp-membership-gift.js').makeMembershipGift;
var makeGiftMembershipGifts = require('./npsp-membership-gift.js').makeGiftMembershipGifts;

var getLinkedMembershipsForGift = require('./npsp-linked-memberships.js').getLinkedMembershipsForGift;
var getLinkedMembershipsForConstituent = require('./npsp-linked-memberships.js').getLinkedMembershipsForConstituent;
var buildMembershipForUnlinkedConstituent = require('./npsp-linked-memberships.js').buildMembershipForUnlinkedConstituent;


var giftViableForMembershipByDate = require('./npsp-membership-heuristics.js').giftViableForMembershipByDate;
var giftViableForMembershipByPrice = require('./npsp-membership-heuristics.js').giftViableForMembershipByPrice;




var debug_counts = {};

/**
 * Simple debugging routine that counts the number of times a specific path is hit.
 * Used for developing sanity and  fact checks about the number of different kinds of
 * membership.
 */
function count( key ) {

    debug_counts[ key ] = 0;

    return function( msg ) {
        debug_counts[ key ] = 1 + debug_counts[ key ];
        console.log( msg + ' [' + debug_counts[ key ] + ']' );
    };
}


var __c_cmgm = count( 'cmgm' );
var __c_gm = count( 'gm' );
var __c_gm_gt_1 = count( 'gm_gt_1' );
var __c_cm_gt_1 = count( 'cm_gt_1' );
var __c_cm_eq_1 = count( 'cm_eq_1' );
var __c_cm = count( 'cm' );
var __c_empty = count( 'empty' );
var __c_fail = count('fail');

var __gift = count( 'gift' );
var __self = count( 'self' );

var __gt_1 = count( 'gt_1' );
var __eq_1 = count( 'eq_1' );
var __zero = count( 'zero' );


/**
 * The main routine for this module.
 * Given a gift, constituent pair, as well as the total set of gift rows,
 * a membership map associating constituent names with their membership records,
 * and a constituent type flag, this module constructs the best-guess membership
 * for this gift.
 *
 * @param gift RE gift row.
 * @param constituent RE constituent row.
 * @param membership_map a map associating a CnBio_Name with the set of membership records associated with that Cn.
 * @param constituent_type string either Account1 or Contact1
 * @param gift_rows Array[RE gift row] the set of raiser's edge gift rows. For constructing and connecting pledge payments on pledged memberships.
 */
function getMembershipGifts( gift, constituent, membership_map, constituent_type, gift_rows ) {

    var gₘ = removeDuplicateMemberships( getLinkedMembershipsForGift( gift, membership_map ) );
    var cₘ = getLinkedMembershipsForConstituent( constituent );

    if ( gₘ.length > 0 ) {

        // NOTE: In this case, we found a gift with linked memberhsips associated with it. Go ahead and build gift records based on those gifts.

        return selectLinkedMembership( gₘ, constituent, gift, constituent_type, gift_rows, 'This gift had memberships linked to it. ' );

    } else if ( cₘ.length > 0 ) {

        // NOTE: In this case, we found no memberships on the gift, but the constituent had linked memberhsips associated with it. Go ahead and build gift records based on the constituent membership.

        return selectLinkedMembership( cₘ, constituent, gift, constituent_type, gift_rows, 'This gift had no memberships linked, but there were memberships linked to the constituent. ' );

    } else {

        // NOTE: In this case, we found a gift record with no constituent info on it, and no membership info on it.

        return createMembershipForEmptyGift( constituent, gift, constituent_type, gift_rows );

    }

    // NOTE: failure case. Should be an unreachable condition.
    __c_fail('FAIL: reached an unreachable condition.');
    return [];

}


/**
 * Given a set of memberships, a constituent record, and a gift record, this routine
 * selects the most likely candidate membership to link with that constituent. Sometimes,
 * there may be constituents with multiple memberships paid for by a single gift – in this case
 * both memberships are selected, but a single payment is created.
 */
function selectLinkedMembership( ms, c, g, type, gift_rows, gift_condition = '' ) {


    if ( ms.length > 1 ) {

        var filtered_ms = selectMostLikelyMembershipForGift( ms, c, g );
        let d = gift_condition + 'Multiple memberships were linked, and we made a best guess for the one this gift covers, or selected multiple if the gift amount covered multiple memberships.';

        return filtered_ms.map( function( m, i ) { return createMembershipForGift( m, c, g, type, gift_rows, ( i === 0) ? 90 : 75, d, ( i > 0 ) ? {'Donation Amount': 0} : {} ); })
                 .reduce( function( a,b ) { return a.concat( b ); }, []);

    } else if ( ms.length === 1 ) {

        let d = gift_condition + 'A single matching membership was linked.'

        return createMembershipForGift( ms[0], c, g, type, gift_rows, 100, d );

    } else {

        // NOTE: failure case. This routine should never be called with ms = [].
        __c_fail('FAIL: `selectLinkedMembership` called with an empty membership set (ms = []).');
        return [];

    }

    // NOTE: failure case. Should be an unreachable condition.
    __c_fail('FAIL: reached an unreachable condition.');
    return [];

}

/**
 * Given a set of memberships, a gift, and a constituent,
 * selects the most likelt membership for the constituent and gift combination.
 *
 * @param ms Array<Intermediate Membership Object> a set of memberships to narrow down as much as possible.
 * @param c an RE constituent to reference
 * @param g a gift record associated with c
 * @return Array<Intermediate Membership Object> a set of membership records to create gifts for. Gift amount should be attributed to the first record.
 */
function selectMostLikelyMembershipForGift( ms, c, g ) {

    var valid_by_datetime = ms.filter( function( m ) { return giftViableForMembershipByDate( g, m ); } );

    if ( valid_by_datetime.length === 1 ) {

        // NOTE: In this case, we found a single membership inside of the daterange for the gift.

        return [ valid_by_datetime[0] ];

    } else if ( valid_by_datetime.length > 1 ) {

        let valid_by_price_heuristic = valid_by_datetime.filter( function( m ) { return giftViableForMembershipByPrice( g, m ); });

        if ( valid_by_price_heuristic.length > 1 ) {

            // TODO: Implement a weak equality procedure selecting for weeding out duplicate constituents. Consider an edit-distance based heuristic on the constituent name to weed out duplicates.

            if ( !allEntriesEqual( valid_by_price_heuristic, function( a,b ) {  return a['Membership Constituent Name'] === b['Membership Constituent Name']; }) ) {
                console.log('--');
                console.log( valid_by_price_heuristic );
                console.log('--');
            }

            // NOTE: In this case, we found a number of duplicate membership records, so we selected one membership.

            return [ valid_by_price_heuristic[0] ];

        } else if ( valid_by_price_heuristic.length === 1 ) {

            return [ valid_by_price_heuristic[ 0 ] ];

        } else {

            // NOTE: In this case, we're encountering a gift that was paid for with a nonstandard amount, or a combined payment.

            return valid_by_datetime;

        }

    } else {

        // NOTE: In this case, we're encountering a gift that falls outside of the bounds of a valid time interval.
        // We have no choice but to return the proffered set of memberships, and create gifts for each.

        return ms;

    }


    return [];

}

/**
 * Given a single membership, a gift, a constituent record, and a type,
 * this routine constructs one or more gifts represting this membership record.
 * It handles the condition in which a membership is a gift membership, by using
 * A strong equality condition that the membership constituent name must equal the
 * selected constituent name.
 *
 * NOTE: Consider implementing a weaker equality measure, such as one based on edit distance.
 * this would likely account for slightly different spellings of constituent names, etc.
 *
 * @param m Intermediate Membership Object – the membership object to transform into an NPSP row.
 * @param c the constituent who made the gift.
 * @param g the gift associated with the membership in question.
 * @param type string the constituent type, either "Contact1" or "Account1".
 * @param gs the set of all relevant gift rows to this constituent, for calculating pledge payments.
 * @param cert int default = 100, the certainty of this gift assignment.
 * @param d string a description covering the situation in which this gift was encountered during the migration (for future debugging).
 * @param overrides Object a possible price override for handling gifts that should be marked as $0.00 account for gifts
 * @return Array<NPSP Row> an array of NPSP rows to add to the final output.
 *
 */
function createMembershipForGift( m, c, g, type, gs, cert = 100, d = '', overrides = {} ) {

    if ( m['Membership Constituent Name'] === c.CnBio_Name ) {
        //__self('Self membership');

        d = ( d.length === 0 ) ? 'This was a Raiser\'s Edge Gift that was connected to a membership that belonged to the constituent who made the gift.' : d;
        return makeMembershipGift( type, g, m, cert, d, gs, overrides );

    } else {

        // __gift('Gift membership');

        d = ( d.length === 0 ) ? 'This was a Raiser\'s Edge gift was attached to a membership that was different from the constituent who made the gift.' : d;
        return makeGiftMembershipGifts( type, g, m, cert, d, gs, overrides );

    }

}

/**
 * Given a gift with no linked memberships, associated with a constituent with no linked memberships,
 * Make a best-guess membership for the constituent, based on information in the gift. This
 * membership will contain minimal information and a low overall certainty.
 */
function createMembershipForEmptyGift( c, g, type, gift_rows ) {

    var m = buildMembershipForUnlinkedConstituent( c, g )
    let d = 'This was a Raiser\'s Edge gift associated with a constituent, neither of which had any membership information linked. We made a best guess.';

    return createMembershipForGift( m, c, g, type, gift_rows, 25, d );

}


/**
 * This routine implements a basic equality test for memberships,
 * which checks whether a pair of memberships could be the same.
 */
function equalMemberships( m1, m2 ) {
    return m1['Membership Category'] === m2['Membership Category'] &&
           m1['Membership Program'] === m2['Membership Program'] &&
           m1['Membership Date Joined'] === m2['Membership Date Joined'] &&
           m1['Membership Date Last Dropped'] === m2['Membership Date Last Dropped'] &&
           m1['Membership Date Last Renewed'] === m2['Membership Date Last Renewed'] &&
           m1['Membership Standing'] === m2['Membership Standing'] &&
           m1['Membership Constituent Name'] === m2['Membership Constituent Name'];

}


/**
 * This routine reduces a given membership list to the set of unique
 * memberships inside that list by removing any duplicates or redundancies.
 *
 * @param memberships Array<Intermediate Membership Object> A set of memberships to filter for duplicates.
 * @return Array<Intermediate Membership Object> A set of memberships with exact duplicates removed.
 */
function removeDuplicateMemberships( memberships ) {

    const membershipEqualityTest = function( m ) { return !equalMemberships( m, memberships[i] ); };
    const withAnd = function( a,b ) { return a && b; };

    var result = [];

    for ( var i = 0; i < memberships.length; i++ ) {

        if (

            result.map( membershipEqualityTest ).reduce( withAnd, true )

        ) {

            result.push( memberships[i] );

        }

    }

    return result;

}




module.exports = getMembershipGifts;
