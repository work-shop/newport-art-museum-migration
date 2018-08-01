'use strict';

var moment = require('moment');

var makeSurjectiveMappingWith = require('./objects.js').makeSurjectiveMappingWith;
var allEntriesEqual = require('./objects.js').allEntriesEqual;

var makeMembershipGift = require('./npsp-membership-gift.js').makeMembershipGift;
var makeGiftMembershipGifts = require('./npsp-membership-gift.js').makeGiftMembershipGifts;

var giftViableForMembershipByDate = require('./npsp-membership-heuristics.js').giftViableForMembershipByDate;
var giftViableForMembershipByPrice = require('./npsp-membership-heuristics.js').giftViableForMembershipByPrice;

var formatCurrency = require('./format-currency.js');


const gift_note_count = 3;

const linked_gift_memberships_count = 5;

const linked_constituent_memberships_count = 5;

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

        return selectLinkedMembership( gₘ, constituent, gift, constituent_type, gift_rows );

    } else if ( cₘ.length > 0 ) {

        // NOTE: In this case, we found no memberships on the gift, but the constituent had linked memberhsips associated with it. Go ahead and build gift records based on the constituent membership.

        return selectLinkedMembership( cₘ, constituent, gift, constituent_type, gift_rows );

    } else {

        // NOTE: In this case, we found a gift record with no constituent info on it, and no membership info on it.

        return createMembershipForEmptyGift( constituent, gift, constituent_type, gift_rows );

    }

    return [];

}


/**
 *
 *
 */
function selectLinkedMembership( ms, c, g, type, gift_rows ) {

    if ( ms.length > 1 ) {

        var filtered_ms = selectMostLikelyMembershipForGift( ms, c, g );

        return filtered_ms.map( function( m, i ) { return createMembershipForGift( m, c, g, type, gift_rows, 90, ( i > 0 ) ? {'Donation Amount': 0} : {} ); })
                 .reduce( function( a,b ) { return a.concat( b ); }, []);

    } else {
        //__c_cm_eq_1('Case cₘ = 1: Found a gift for a constituent with exactly one constituent-linked membership');

        // console.log( c.CnBio_Name );
        // console.log( g.Gf_CnBio_Name );
        // console.log( cₘ[0]['Membership Constituent Name'] );

        return createMembershipForGift( ms[0], c, g, type, gift_rows );

    }

    return [];

}

/**
 * Given a set of memberships, a gift, and a constituent,
 * selects the most likelt membership for the constituent and gift combination.
 *
 * @param ms a set of memberships to narrow down as much as possible.
 * @param c an RE constituent to reference
 * @param g a gift record associated with c
 * @return Array<Membership Row> a set of membership records to create gifts for. Gift amount should be attributed to the first record.
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
 *
 */
function createMembershipForGift( m, c, g, type, gs, cert = 100, overrides = {} ) {

    if ( m['Membership Constituent Name'] === c.CnBio_Name ) {
        //__self('Self membership');

        let d = 'This was a Raiser\'s Edge Gift that was connected to a membership that belonged to the constituent who made the gift.';
        return makeMembershipGift( type, g, m, cert, d, gs, overrides );

    } else {

        // __gift('Gift membership');

        let d = 'This was a Raiser\'s Edge gift was attached to a membership that was different from the constituent who made the gift.';
        return makeGiftMembershipGifts( type, g, m, cert, d, gs, overrides );

    }

}

/**
 * Given a gift with no linked memberships, associated with a constituent with no linked memberships,
 * Make a best-guess membership for the constituent.
 */
function createMembershipForEmptyGift( c, g, type, gift_rows ) {

    var m = buildMembershipForUnlinkedConstituent( c, g )

    return createMembershipForGift( m, c, g, type, gift_rows, 50 );

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
 */
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


/**
 * Given a gift row, and a membership map mapping constituent names into a set of associated memberships,
 * but the set of memberships for a given gift.
 */
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


/**
 * Given a constituent row, extract any memberships related to the constituent.
 * and map them over into the form that we want.
 */
function getLinkedMembershipsForConstituent( constituent ) {

    var result = [];

    for ( var i = 1; i <= linked_constituent_memberships_count; i++ ) {

        var mapping = {};

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

/**
 *
 */
function buildMembershipForUnlinkedConstituent( constituent, gift ) {

    var membership = {
        "Membership Category": '',
        "Membership Consecutive Years": "1",
        "Membership Current Dues Amount": "$0.00",
        "Membership Date Added": gift.Gf_Date,
        "Membership Date Joined": gift.Gf_Date,
        "Membership Date Changed": gift.Gf_Date,
        "Membership Description": '',
        "Membership Date Last Dropped": '',
        "Membership Date Last Renewed": '',
        "Membership Notes": '',
        "Membership Is Primary": '',
        "Membership Program": '',
        "Membership Standing": '',
        "Membership Total Children": '0',
        "Membership Total Members": '1',
        "Membership Total Years": '1',
        "Membership Constituent ID": constituent.CnBio_System_ID,
        "Membership Constituent Name": constituent.CnBio_Name
    };

    return membership;

}


/**
 * A simple test to determine whether a record is empty
 */
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




module.exports = getMembershipGifts;
