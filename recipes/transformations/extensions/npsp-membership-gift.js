'use strict';

var moment = require('moment');

var merge = require('./objects.js').merge;
var duplicateWith = require('./objects.js').duplicateWith;
var makeSurjectiveMappingWith = require('./objects.js').makeSurjectiveMappingWith;

var normalizeMembershipTypes = require('./normalize-npsp-types.js').normalizeMembershipTypes;
var normalizeRecordType = require('./normalize-npsp-types.js').normalizeRecordType;

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
 * Given a set of constituent parameters, a raiser's edge gift attribution, membership record, certainty, migration description,
 * total set of ordered rows, and set of overrides, this routine constructs the appropriate membership gift for this configuration.
 *
 * @param constituent_type string "Contact" or "Account"
 * @param raw_gift RE Gift row
 * @param membership constructed RE Membership object.
 * @param certainty [1,100] a percentage certainty about this membership assignment.
 * @param description a description describing the situation in which this membership object was encountered.
 * @param gift_rows the total set of gift_rows in the database
 * @param overrides object a set of keys to override explicitly on the membership
 * @return Array<Membership Gift>
 *
 */
function makeMembershipGift( constituent_type, raw_gift, membership, certainty, description, gift_rows, overrides = {} ) {

    var base_row = makeBaseGift( raw_gift, constituent_type );

    if ( typeof overrides['Donation Amount'] !== 'undefined' ) {
        base_row['Donation Amount'] = overrides['Donation Amount'];
    }

    if ( isCashGift( raw_gift ) ) {

        let membership_gift = makeCashGift( raw_gift, base_row );

        membership_gift['Donation Record Type Name'] = 'Membership';
        membership_gift['Donation Membership Origin'] = '';
        membership_gift['Donation Membership Start Date'] = membership_gift['Donation Date'];
        membership_gift['Donation Membership End Date'] = moment( membership_gift['Donation Date'] ).add(1,'y').format('MM/DD/YY');
        membership_gift['Donation Membership Level'] = normalizeMembershipTypes( membership['Membership Category'] );
        membership_gift['Donation Certainty'] = certainty;
        membership_gift['Donation Migration Description'] = description;
        membership_gift['Donation Migration Donation Type'] = 'Membership-related Donation';

        membership_gift['FLAG: Donation Membership Holder ID'] = membership['Membership Constituent ID'];

        if ( typeof overrides['Donation Record Type Name'] !== 'undefined' ) {
            membership_gift['Donation Record Type Name'] = overrides['Donation Record Type Name'];
        }

        return [ membership_gift ];

    } else if ( isStockGift( raw_gift ) ) {

        let cash_row = makeCashGift( raw_gift, base_row )
        let membership_gift = makeStockGift( raw_gift, cash_row );

        membership_gift['Donation Record Type Name'] = 'Membership';
        membership_gift['Donation Membership Origin'] = '';
        membership_gift['Donation Membership Start Date'] = membership_gift['Donation Date'];
        membership_gift['Donation Membership End Date'] = moment( membership_gift['Donation Date'] ).add(1,'y').format('MM/DD/YY');
        membership_gift['Donation Membership Level'] = normalizeMembershipTypes( membership['Membership Category'] );
        membership_gift['Donation Certainty'] = certainty;
        membership_gift['Donation Migration Description'] = description;
        membership_gift['Donation Migration Donation Type'] = 'Membership-related Donation';

        membership_gift['FLAG: Donation Membership Holder ID'] = membership['Membership Constituent ID'];

        if ( typeof overrides['Donation Record Type Name'] !== 'undefined' ) {
            membership_gift['Donation Record Type Name'] = overrides['Donation Record Type Name'];
        }

        return [ membership_gift ];

    } else if ( isPledgeGift( raw_gift ) ) {

        let result_rows = [];

        let membership_gift = makePledgeGift( raw_gift, base_row );
        let payments = makePledgePayments( raw_gift, gift_rows, membership_gift, constituent_type );

        membership_gift['Donation Record Type Name'] = 'Membership (Pledged)';
        membership_gift['Donation Membership Origin'] = '';
        membership_gift['Donation Membership Start Date'] = membership_gift['Donation Date'];
        membership_gift['Donation Membership End Date'] = moment( membership_gift['Donation Date'] ).add(1,'y').format('MM/DD/YY');
        membership_gift['Donation Membership Level'] = normalizeMembershipTypes( membership['Membership Category'] );
        membership_gift['Donation Certainty'] = certainty;
        membership_gift['Donation Migration Description'] = description;
        membership_gift['Donation Migration Donation Type'] = 'Membership-related Donation';

        membership_gift['FLAG: Donation Membership Holder ID'] = membership['Membership Constituent ID'];

        if ( typeof overrides['Donation Record Type Name'] !== 'undefined' ) {
            membership_gift['Donation Record Type Name'] = overrides['Donation Record Type Name'];
        }

        payments.forEach( function( payment ) {

            result_rows.push( duplicateWith( membership_gift, payment ) );

        });

        membership_gift['Payment Amount'] = '0';
        membership_gift['Donation Do Not Create Payment'] = 1;
        result_rows.push( membership_gift );

        return result_rows;

    } else if ( isOtherGift( raw_gift ) ) {

        let membership_gift = makeOtherGift( raw_gift, base_row );

        membership_gift['Donation Record Type Name'] = 'Membership';
        membership_gift['Donation Membership Origin'] = '';
        membership_gift['Donation Membership Start Date'] = membership_gift['Donation Date'];
        membership_gift['Donation Membership End Date'] = moment( membership_gift['Donation Date'] ).add(1,'y').format('MM/DD/YY');
        membership_gift['Donation Membership Level'] = normalizeMembershipTypes( membership['Membership Category'] );
        membership_gift['Donation Certainty'] = certainty;
        membership_gift['Donation Migration Description'] = description;
        membership_gift['Donation Migration Donation Type'] = 'Membership-related Donation';

        membership_gift['FLAG: Donation Membership Holder ID'] = membership['Membership Constituent ID'];

        if ( typeof overrides['Donation Record Type Name'] !== 'undefined' ) {
            membership_gift['Donation Record Type Name'] = overrides['Donation Record Type Name'];
        }

        return [ membership_gift ];

    } else {

        return [];

    }

}

/**
 * This routine constructs a membership gift set, including a sponsoring gift, any payments on that gift, and the gift membership record itself.
 *
 */
function makeGiftMembershipGifts( constituent_type, raw_gift, membership, certainty, description, gift_rows ) {

    var membership_gifts = makeMembershipGift( constituent_type, raw_gift, membership, certainty, description, gift_rows );
    var gift_membership_gift = duplicateWith( {}, membership_gifts[ membership_gifts.length - 1 ] );

    gift_membership_gift['Donation Amount'] = 0;
    membership_gifts[ membership_gifts.length - 1 ]['Donation Record Type Name'] = normalizeRecordType( raw_gift.Gf_Type );
    membership_gifts.forEach( function( mg ) { mg['FLAG: Donation Membership Holder ID'] = raw_gift.Gf_CnBio_System_ID; });

    membership_gifts.push( gift_membership_gift );

    return membership_gifts;

}


module.exports = {
    makeMembershipGift: makeMembershipGift,
    makeGiftMembershipGifts: makeGiftMembershipGifts,
}
