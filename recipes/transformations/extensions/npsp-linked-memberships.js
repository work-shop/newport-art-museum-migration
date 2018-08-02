'use strict';


var makeSurjectiveMappingWith = require('./objects.js').makeSurjectiveMappingWith;


const linked_gift_memberships_count = 5;

const linked_constituent_memberships_count = 5;


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


module.exports = {

    /**
     * Given a gift row, and a membership map mapping constituent names into a set of associated memberships,
     * but the set of memberships for a given gift.
     */
    getLinkedMembershipsForGift: function( gift, membership_map ) {

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

    },


    /**
     * Given a constituent row, extract any memberships related to the constituent.
     * and map them over into the form that we want.
     */
    getLinkedMembershipsForConstituent: function( constituent ) {

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

    },


    /**
     *
     */
    buildMembershipForUnlinkedConstituent: function( constituent, gift ) {

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

};
