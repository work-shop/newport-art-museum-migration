'use strict';


var moment = require('moment');
var formatCurrency = require('./format-currency.js');

module.exports = {

    /**
     * This routine implements a heuristic for deciding
     * whether a gift amount associated with a given membership
     * type is likely a valid gift amount for that type.
     *
     * @param gift RE gift row
     * @param membership RE Membership Object
     * @return boolean
     */
    giftViableForMembershipByPrice: function( gift, membership ) {

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
                return amount === 50 || amount === 60 || amount === 70;

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
    },

    /**
     * This routine implements a heuristic for deciding whether
     * a given could reasonably have been associated with a gift.
     * This is done based on gift date and recorded membership dates.
     */
    giftViableForMembershipByDate: function( gift, membership ) {

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

}
