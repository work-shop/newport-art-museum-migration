'use strict';

var moment = require('moment');

var makeSurjectiveMappingWith = require('./objects.js').makeSurjectiveMappingWith;
var allEntriesEqual = require('./objects.js').allEntriesEqual;

var makeMembershipGift = require('./npsp-membership-gift.js').makeMembershipGift;
var makeGiftMembershipGifts = require('./npsp-membership-gift.js').makeGiftMembershipGifts;

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

    /**
     * NOTE: Dont filter at this step – we'll filter where needed in subroutines.
     */
    // var gₘ = raw_gₘ.filter( function( m ) { return giftViableForMembership( gift, m ); });
    // var cₘ = raw_cₘ.filter( function( m ) { return giftViableForMembership( gift, m ); });

    /**
     * Viable memberships are memberships whose associated dates of activity fall
     * inside a reasonable range of the gift date. First things first, let's construct the
     * set of memberships cₘ and gₘ that are viable for the given gift.
     */
    if ( gₘ.length > 0 ) {

        return selectGiftLinkedMembership( gₘ, cₘ, constituent, gift, constituent_type );

    } else if ( cₘ.length > 0 ) {

        //__c_cm('Case: cₘ > 0 and gₘ = 0: Found a gift with linked-constituent memberships only.');
        return selectConstituentLinkedMembership( cₘ, constituent, gift, constituent_type );

    } else {

        // __c_empty('Case: cₘ = 0 and gₘ = 0: Found a gift with no linked memberships.');

        // if ( raw_gₘ.length > 0 || raw_cₘ.length > 0 ) {
        //
        //     console.log('--');
        //     console.log( gift.Gf_Date );
        //     console.log( gift.Gf_CnBio_Name );
        //     console.log( raw_gₘ );
        //     console.log( raw_cₘ );
        //     console.log('--');
        //
        // }

        return createMembershipForEmptyGift( constituent, gift, constituent_type );

    }

}


/**
 * Given a set of gift-linked and constituent linked memberships,
 *
 */
function selectGiftLinkedMembership( gₘ, cₘ, c, g, type ) {

    if ( gₘ.length > 1 ) {
        // __c_gm_gt_1('Case gₘ > 1: Found a gift with more than one gift-linked membership.');
        /**
         * In this case, we have more than one gift membership associated with this gift. We need to select the one that is most likely to
         * be related to this gift.
         */
        var m = selectMostLikelyMembershipForGift( gₘ, c, g );



    } else {
        // __c_gm_eq_1('Case gₘ = 1: Found a gift with exactly one gift-linked membership.');
        // __c_gm('Case: cₘ = 0 and gₘ > 0: Found a gift with linked-gift memberships only.');
        /**
         * In this case, we have exactly one membership associated with the gift.
         * Use this as the membership to create for this gift.
         */
        return createMembershipForGift( gₘ[0], c, g, type );

    }

    return [];

}


function selectConstituentLinkedMembership( cₘ, c, g, type ) {

    if ( cₘ.length > 1 ) {
        //__c_cm_gt_1('Case cₘ > 1: Found a gift for a constituent with more than one constituent-linked membership');

    } else {
        //__c_cm_eq_1('Case cₘ = 1: Found a gift for a constituent with more exactly one constituent-linked membership');

    }

    return [];

}

/**
 * Given a set of memberships, a gift, and a constituent,
 * selects the most likelt membership for the constituent and gift combination.
 */
function selectMostLikelyMembershipForGift( ms, c, g ) {

    var valid_by_datetime = ms.filter( function( m ) { return giftViableForMembershipByDate( g, m ); } );

    if ( valid_by_datetime.length === 1 ) {
        //__eq_1('Single Valid Choice (by date/time heuristic)');

        return valid_by_datetime[0];

    } else if ( valid_by_datetime.length > 1 ) {

        let valid_by_price_heuristic = valid_by_datetime.filter( function( m ) { return giftViableForMembershipByPrice( g, m ); });

        if ( valid_by_price_heuristic.length > 1 ) {

            //__gt_1('Multiple Valid Choices (by price heuristic)');

            if ( !allEntriesEqual( valid_by_price_heuristic, function( a,b ) {  return a['Membership Constituent Name'] === b['Membership Constituent Name']; }) ) {
                console.log('--');
                console.log( valid_by_price_heuristic );
                console.log('--');
            }

            return valid_by_price_heuristic[0];

            // TODO: Implement a weak equality procedure selecting for weeding out duplicate constituents.
            // NOTE: Not needed.

            // TODO: Consider an edit-distance based heuristic on the constituent name to weed out duplicates.

        } else if ( valid_by_price_heuristic.length === 1 ) {

            return valid_by_price_heuristic[ 0 ];

        } else {
            __zero('No Valid Choices (by price heuristic)');

        }

    } else {
        __zero('No Valid Choices (by date/time heuristic)');

    }


    return {};

}

/**
 * Given a single membership, a gift, a constituent record, and a type,
 * this routine constructs one or more gifts represting this membership record.
 *
 */
function createMembershipForGift( m, c, g, type, gs ) {

    if ( m['Membership Constituent Name'] === c.CnBio_Name ) {
        //__self('Self membership');

        let d = 'This was a Raiser\'s Edge Gift that was connected to a membership that belonged to the constituent who made the gift.';
        return makeMembershipGift( type, g, m, 100, d, gs );

    } else {
        //__gift('Gift membership');

        let d = 'This was a Raiser\'s Edge gift was attached to a membership that was different from the constituent who made the gift.';
        return makeGiftMembershipGifts( type, g, m, 95, d, gs );

    }

}

/**
 * Given a gift with no linked memberships, associated with a constituent with no linked memberships,
 * Make a best-guess membership for the constituent.
 */
function createMembershipForEmptyGift( c, g, type ) {

    return [];

}


function giftViableForMembershipByPrice( gift, membership ) {

    var amount = formatCurrency( gift.Gf_Amount );

    switch( membership['Membership Category'].toLowerCase() ) {
        case 'artist\'s guild-household':
            return amount === 30; //

        case 'conklin shop staff':
            return amount === 0; //

        case 'patron membership-honorarium':
            return amount === 150; // TODO What should this be?

        case 'benefactor membership':
            return amount === 1000;

        case 'contributing membership':
            return 'Contributing';

        case 'council membership':
            return amount === 500 || amount === 550;

        case 'faculty membership':
            return amount === 0;

        case 'family membership': // TODO is this real?
        case 'household membership':
            return amount === 50 || amount === 75;

        case 'individual membership':
            return amount === 45 || amount === 50;

        case 'military household':
        case 'military household membership':
            return amount === 50;

        case 'military individual membership':
            return amount === 35 || amount === 40;

        case 'patron membership':
            return amount === 150 || amount === 175;

        case 'photo guild':
            return amount === 20 || amount === 25;

        case 'senior household':
        case 'senior household membership':
            return amount === 50 || amount === 60;

        case 'senior membership':
            return amount === 35 || amount === 40;

        case 'staff membership':
            return amount === 0;

        case 'student membership':
            return amount === 25 || amount === 30;

        case 'supporting  membership':
        case 'supporting membership':
            return amount === 250 || amount === 275;

        case '':
            return amount === 1000;

        case 'life membership':
        case 'university membership':
        case 'young benefactor membership':
        case 'student membership-muse':
        case 'partners in art-nonprofit service organization':
        case 'partners in art b&b':
            return true;

        default:
            return true;
    }
}

/**
 * This routine implements a heuristic for deciding whether
 * a given could reasonably have been associated with a gift.
 * This is done based on gift date and recorded membership dates.
 */
function giftViableForMembershipByDate( gift, membership ) {

    var membership_epsilon = 2;

    var gift_date = moment( gift.Gf_Date );
    var membership_added_date = moment( membership['Membership Date Added'] );
    var membership_start_date = moment( membership['Membership Date Joined'] );
    var membership_renewed_date = moment( membership['Membership Date Last Renewed'] );
    var membership_dropped_date = moment( membership['Membership Date Last Dropped'] );
    var membership_last_changed_date = moment( membership['Membership Date Last Changed'] );

    var matches_start = (gift_date.isSameOrAfter( membership_start_date.subtract(membership_epsilon, 'months') ) || gift_date.isSameOrAfter(membership_added_date.subtract(membership_epsilon, 'months') ) );

    if ( membership_last_changed_date.isValid() ) {

        var v = gift_date.isSameOrBefore( membership_last_changed_date ) && matches_start;

        return v;

    } if ( membership_renewed_date.isValid() ) {

        var v = gift_date.isSameOrBefore( membership_renewed_date ) && matches_start;

        return v;


    } else if ( membership_dropped_date.isValid() ) {

        var v = gift_date.isBefore( membership_dropped_date ) && matches_start;

        return v;



    } else {

        return matches_start;

    }

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
