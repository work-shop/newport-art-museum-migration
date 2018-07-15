'use strict';

var makeCashGift = require('./npsp-cash-gift.js').makeCashGift;

/**
 * Construct an 'Other' type gift – in this case, we're treating 'Other' gifts as 'Cash' gifts.
 */
function makeOtherGift( gift, donation_row  ) {

    return makeCashGift( gift, donation_row );

}

/**
 * Determine whether this gift is an Other gift or not.
 */
function isOtherGift( gift ) {

    var type = ( typeof gift.Gf_Type !== 'undefined') ? gift.Gf_Type.toLowerCase() : ''

    return (type === 'other');

}


module.exports = {
    makeOtherGift: makeOtherGift,
    isOtherGift: isOtherGift
};
