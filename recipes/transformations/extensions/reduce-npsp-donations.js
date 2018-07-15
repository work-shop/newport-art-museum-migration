'use strict';

var moment = require('moment');
var search = require('binary-search-range');

var merge = require('./objects.js').merge;
var duplicateWith = require('./objects.js').duplicateWith;
var makeSurjectiveMappingWith = require('./objects.js').makeSurjectiveMappingWith;

var getMembershipGiftsSimple = require('./reduce-npsp-memberships.js');

var formatDate = require('./format-date.js');
var formatCurrency = require('./format-currency.js');
var formatGiftDescription = require('./format-gift-description.js');

var makeBaseGift = require('./npsp-base-gift.js').makeBaseGift;

var makeCashGift = require('./npsp-cash-gift.js').makeCashGift;
var isCashGift = require('./npsp-cash-gift.js').isCashGift;

var makeStockGift = require('./npsp-stock-gift.js').makeStockGift;
var isStockGift = require('./npsp-stock-gift.js').isStockGift;

var makeOtherGift = require('./npsp-other-gift.js').makeOtherGift;
var isOtherGift = require('./npsp-other-gift.js').isOtherGift;

var isPledgeGift = require('./npsp-pledge-gift.js').isPledgeGift;
var makePledgeGift = require('./npsp-pledge-gift.js').makePledgeGift;
var makePledgePayments = require('./npsp-pledge-gift.js').makePledgePayments;


/**
 * Comparator for binary search.
 */
function compare( a, b ) { return ( a < b ) ? -1 : (( a > b ) ? 1 : 0); }

const linked_gift_memberships_count = 5;

const linked_constituent_memberships_count = 5;

module.exports = function( type, row, gifts, membership_map, raw_constituent ) {

    var gift_ids = gifts.map( function( g ) { return g.Gf_CnBio_System_ID; } );

    // NOTE: Super time consuming operation here which runs in O(m log n),
    // where m is the number of constituents (~16k) and n is the number of gifts (~64k).
    var relevant_gifts_indices = search( gift_ids, row[ type + ' RE ID' ], compare );

    // NOTE: Sort the gifts in ascending order of value, from lowest to highest.
    // This will help make sure that smalled pledges encounter smaller payments first.
    relevant_gifts_indices.sort( function( i1, i2 ) {
        return  parseFloat( gifts[ i2 ].Gf_Amount ) - parseFloat( gifts[ i1 ].Gf_Amount );
    })

    var donation_rows = makeDonationSetForConstituent( type,
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

        if ( isCashGift( gift ) && !isMembershipGift( gift ) ) {

            let base_row = makeBaseGift( gift, constituent_type );
            let cash_row = makeCashGift( gift, base_row )

            result_rows.push( cash_row );

        } else if ( isStockGift( gift ) && !isMembershipGift( gift ) ) {

            let base_row = makeBaseGift( gift, constituent_type );
            let cash_row = makeCashGift( gift, base_row )
            let stock_gift = makeStockGift( gift, cash_row );

            result_rows.push( stock_gift );

        } else if ( isPledgeGift( gift ) && !isMembershipGift( gift ) ) {

            let base_pledge_row = makeBaseGift( gift, constituent_type );
            let pledge_gift = makePledgeGift( gift, base_pledge_row );
            let payments = makePledgePayments( gift, gift_rows, pledge_gift, constituent_type );

            payments.forEach( function( payment ) {

                result_rows.push( duplicateWith( pledge_gift, payment ) );

            });

            pledge_gift['Payment Amount'] = '0';
            pledge_gift['Donation Do Not Create Payment'] = 1;
            result_rows.push( pledge_gift );

        } else if ( isOtherGift( gift ) && !isMembershipGift( gift ) ) {

            let base_row = makeBaseGift( gift, constituent_type );
            let other_row = makeOtherGift( gift, base_row )

            result_rows.push( other_row );

        } else if ( isMembershipGift( gift )  ) {

            let membership_rows = getMembershipGiftsSimple( gift, raw_constituent, membership_map, constituent_type, gift_rows );

            membership_rows.forEach( function( membership_row ) {

                result_rows.push( membership_row );

            });

        }

    });

    return result_rows;

}


var count = 0;

function getMembershipGifts( gift, constituent, membership_map, constituent_type, gift_rows ) {

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
                // TODO: mark the donation  as 75% certainty
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

                console.log('-');
                count_quantity( 'Case: Non-Gift – has nothing' );
                console.log( 'Constituent ID: ' + constituent.CnBio_System_ID );
                console.log( 'Constituent Name: ' + constituent.CnBio_Name );
                console.log( 'Gift Date: ' + gift.Gf_Date );
                console.log( 'Gift Amount: ' + gift.Gf_Amount );
                console.log( 'Gift Amount: ' + gift.Gf_Reference );
                console.log('-');

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

        //count_quantity( 'Case: Non-gift, Doubly Linked: Constituent has one membership, gift has one linked membership.' );

        if ( equalMemberships( m1, m2 ) ) {

            //count_quantity( 'Case: Non-gift, Doubly Linked: Matching gifts are equal' );

            return makeMembershipGift( constituent_type, gift, m1, 100, 'This membership gift was paired exactly with a matching Raiser\'s Edge membership records.', gift_rows );

        } else {

            //count_quantity( 'Case: Non-gift, Doubly Linked: Matching gifts are not equal' );

            var d1 = 'This gift was paired with non-matching membership Raiser\'s Edge records. We created two gifts, one for the gifter, one for the membership beneficiary ('+ m2['Membership Constituent Name'] +'). This is for the gifter.';
            var d2 = 'This gift was paired with non-matching membership Raiser\'s Edge records. We created two gifts, one for the gifter ('+ m1['Membership Constituent Name'] +'), one for the membership beneficiary. This is for the membership beneficiary.';

            var cash_row = makeCashGift( gift, makeBaseGift( gift ) );

            cash_row['Donation Certainty'] = 65;
            cash_row['Donation Migration Description'] = d1;
            cash_row['Donation Migration Donation Type'] = 'Membership-related Donation';

            return [
                cash_row,
                makeMembershipGift(
                    constituent_type,
                    gift,
                    m2,
                    65,
                    d2,
                    gift_rows,
                    {'Donation Amount': 0}
                )
            ];

        }

    } else if ( viable_c_linked_memberships.length > 1 && viable_g_linked_memberships.length === 1 ) {

        //count_quantity( 'Case: Non-gift, Doubly Linked: Constituent has multiple memberships, but gift is linked to 1' );

        var m2B = viable_g_linked_memberships[ 0 ];

        var d1B = 'This gift was paired with non-matching membership Raiser\'s Edge records. We created two gifts, one for the gifter, one for the membership beneficiary ('+ m2B['Membership Constituent Name'] +'). This is for the gifter.';
        var d2B = 'This gift was paired with non-matching membership Raiser\'s Edge records. We created two gifts, one for the gifter ('+ gift.Mem_CnBio_Name +'), one for the membership beneficiary. This is for the membership beneficiary.';

        var cash_rowB = makeCashGift( gift, makeBaseGift( gift ) );

        cash_rowB['Donation Certainty'] = 65;
        cash_rowB['Donation Migration Description'] = d1B;
        cash_rowB['Donation Migration Donation Type'] = 'Membership-related Donation';

        return [
            cash_rowB,
            makeMembershipGift( constituent_type, gift, m2B, 65, d2B, gift_rows, {'Donation Amount': 0} )
        ];

    } else if ( viable_c_linked_memberships.length === 1 && viable_g_linked_memberships.length > 1 ) {



        var m1C = viable_c_linked_memberships[ 0 ];
        var candidates = viable_g_linked_memberships.filter( function( m ) { return gift.Gf_Date === m['Membership Date Joined'] || gift.Gf_Date === m['Membership Date Last Renewed']; })

        if ( candidates.length === 1 ) {

            var m = candidates[ 0 ];
            var d = 'This gift was paired with multiple, non-matching Raiser\'s Edge records. We found a membership record that is a likely match to this gift, and created a gift for it.';

            return [ makeMembershipGift( constituent_type, gift, m, 80, d, gift_rows ) ];

        } else if ( candidates.length > 1 ) {

            // NOTE: Super Special Case.
            if ( m1C['Membership Constituent ID'] === '22273' ) {

                var cash_rowC = makeCashGift( gift, makeBaseGift( gift ) );

                cash_rowC['Donation Certainty'] = 65;
                cash_rowC['Donation Migration Description'] = 'This is a special case handling multiple, non-matching Raiser\'s Edge records for '+ m1C[ 'Membership Constituent Name'] + '.';
                cash_rowC['Donation Migration Donation Type'] = 'Membership-related Donation';

                return [
                    cash_rowC,
                ].concat( candidates.map( function( m2C ) {

                    return makeMembershipGift( constituent_type, gift, m2C, 70, 'This is a special case handling multiple, non-matching Raiser\'s Edge records for '+ m2C[ 'Membership Constituent Name'] + '.', gift_rows, {'Donation Amount': 0} );

                }) );

            } else {

                return [ makeMembershipGift( constituent_type, gift, m1C, 80, 'This is a hyper-special case handling a duplicate constituent issue. Check for duplicates of ' + m1C[ 'Membership Constituent Name'] + '.', gift_rows ) ];

            }

        } else {

            var refilter = viable_g_linked_memberships.filter( function( m2 ) { return m1C['Membership Constituent ID'] === m2['Membership Constituent ID']; });

            if ( refilter.length === 1 ) {

                return [ makeMembershipGift( constituent_type, gift, m1C, 80, 'This is a special case handling a duplicate constituent issue. Check for duplicates of ' + m1C[ 'Membership Constituent Name' ] + '.', gift_rows ) ];

            } else {

                // In this case, pick the one with the latest last renewed date, and do that one.
                // NOTE: This case doesn't seem to happen, due to the special case.
                console.log('-');
                console.log( gift.Gf_Amount);
                console.log( gift.Gf_Date );
                console.log( m1C );
                console.log( viable_g_linked_memberships );
                console.log('-');

            }

        }

    } else if ( viable_c_linked_memberships.length > 1 && viable_g_linked_memberships.length > 1 ) {


        return viable_g_linked_memberships.map( function( m, i ) {
            if ( i === 0 ) {
                return makeMembershipGift( constituent_type, gift, m, 25, 'This gift was not uniquely associated with single Raiser\'s Edge Records. We created a record for each gift, and assigned the cost to the first membership type.', gift_rows );
            } else {
                return makeMembershipGift( constituent_type, gift, m, 25, 'This gift was not uniquely associated with single Raiser\'s Edge Records. We created a record for each gift, and assigned the cost to the first membership type.', gift_rows, {'Donation Amount': 0} );
            }
        });

    } else {

        if ( viable_g_linked_memberships.length === 0 && viable_c_linked_memberships.length === 0 ) {

            var cash_rowD = makeCashGift( gift, makeBaseGift( gift ) );

            cash_rowD['Donation Certainty'] = 5;
            cash_rowD['Donation Migration Description'] = 'This gift was marked as a membership donation, but had no membership records in a close enough date range. This could be due to a type-o, or linking error as in the membership. We stored it as a cash donation.';
            cash_rowD['Donation Migration Donation Type'] = 'Membership-related Donation';

            return [ cash_rowD ];

        } else {

            // count_quantity( 'Case: Non-gift, Doubly Linked: Constituent has multiple memberships, and gift is linked to multiple memberships' );

            var cash_rowE = makeCashGift( gift, makeBaseGift( gift ) );

            cash_rowE['Donation Certainty'] = 15;
            cash_rowE['Donation Migration Description'] = 'This gift was marked as a membership gift, but had no memberships linked to the constituent. We created a cash gift to record the value, and created memberships for the memberships on the gift.';
            cash_rowE['Donation Migration Donation Type'] = 'Membership-related Donation';

            return viable_g_linked_memberships.map( function( m ) {
                return makeMembershipGift( constituent_type, gift, m, 15, 'This gift was associated to a membership gift, but the paying constituent (' + constituent.CnBio_Name + ') has no memberships. We created a $0.00 membership gift to record this membership.', gift_rows, {'Donation Amount': 0});
            }).concat([ cash_rowE ]);

        }

    }

    return [];

}







function getViableMemberships( gift, memberships ) {
    return memberships.filter( function( m ) { return giftViableForMembership( gift, m ); });
}



function giftViableForMembership( gift, membership ) {

    var membership_epsilon = 2;

    var gift_date = moment( gift.Gf_Date );
    var membership_added_date = moment( membership['Membership Date Added'] );
    var membership_start_date = moment( membership['Membership Date Joined'] );
    var membership_renewed_date = moment( membership['Membership Date Last Renewed'] );
    var membership_dropped_date = moment( membership['Membership Date Last Dropped'] );
    var membership_last_changed_date = moment( membership['Membership Date Last Changed'] );

    // console.log('-');
    // console.log( 'Gift Date: ' + gift.Gf_Date );
    // console.log( 'Joined Date: ' + membership['Membership Date Joined'] );
    // console.log( 'Last Renewed Date: ' + membership['Membership Date Last Renewed'] );
    // console.log( 'Last Dropped Date: ' + membership['Membership Date Last Dropped'] );

    var matches_start = (gift_date.isSameOrAfter( membership_start_date.subtract(membership_epsilon, 'months') ) || gift_date.isSameOrAfter(membership_added_date.subtract(membership_epsilon, 'months') ) );

    if ( membership_last_changed_date.isValid() ) {

        var v = gift_date.isSameOrBefore( membership_last_changed_date ) && matches_start;

        return v;

    } if ( membership_renewed_date.isValid() ) {

        var v = gift_date.isSameOrBefore( membership_renewed_date ) && matches_start;

        // console.log('Renewed Date Valid');
        // console.log( 'Gift Valid: ' +  v );
        // console.log('-');
        // console.log(' ');

        return v;


    } else if ( membership_dropped_date.isValid() ) {

        var v = gift_date.isBefore( membership_dropped_date ) && matches_start;

        // console.log('Renewed Date Not Valid, Dropped Date Valid');
        // console.log( 'Gift Valid: ' +  v );
        // console.log('-');
        // console.log(' ');
        return v;



    } else {

        // console.log('Renewed Date Not Valid, Dropped Date Not Valid');
        // console.log( 'Gift Valid: ' +  v );
        // console.log('-');
        // console.log(' ');
        return matches_start;

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



function print_payment_details( pledge, payment ) {
    //console.log( 'Pledge:\t', pledge['Donation RE Campaign'],pledge['Donation RE Fund'],pledge['Donation RE Appeal'],pledge['Donation Amount'],pledge['Donation Date'] );
    console.log( 'Payment:\t', payment['Payment RE Campaign'],payment['Payment RE Fund'],payment['Payment RE Appeal'],payment['Payment Amount'],payment['Payment Date'] );
}








function isMembershipGift( gift ) {

    var campaign = ( typeof gift.Gf_Campaign !== 'undefined') ? gift.Gf_Campaign.toLowerCase() : '';
    // var fund = ( typeof gift.Gf_Fund !== 'undefined') ? gift.Gf_Fund.toLowerCase() : '';
    // var frequency = ( typeof gift.Gf_Installmnt_Frqncy !== 'undefined') ? gift.Gf_Installmnt_Frqncy.toLowerCase() : '';
    // var type = ( typeof gift.Gf_Type !== 'undefined') ? gift.Gf_Type.toLowerCase() : '';

    return campaign === 'membership';

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







/**
 * Test for well-formed-ness of memberships.
 */
function testMembershipPresence( gifts, memberships ) {

    var membership_gifts = gifts.filter( function( gift ) { return (typeof gift.Gf_Campaign !== 'undefined') && gift.Gf_Campaign.toLowerCase() === 'membership'; } );

    return ( membership_gifts.length === 0 && memberships.length === 0) || ( membership_gifts.length > 0 && memberships.length > 0 );

}
