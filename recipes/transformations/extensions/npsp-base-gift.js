'use strict';

var makeSurjectiveMappingWith = require('./objects.js').makeSurjectiveMappingWith;
var formatCurrency = require('./format-currency.js');
var formatDate = require('./format-date.js');
var formatGiftDescription = require('./format-gift-description.js');

var normalizeCampaignNames = require('./normalize-npsp-types.js').normalizeCampaignNames;

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

    donation_row['Donation RE Campaign'] = normalizeCampaignNames( donation_row['Donation RE Campaign'] );
    donation_row['Donation Amount'] = formatCurrency( donation_row['Donation Amount'] );
    donation_row['Donation Date'] = formatDate( donation_row['Donation Date'] );
    donation_row['Donation Donor'] = type; // NOTE: One of Account1 or Contact1
    donation_row['Campaign Name'] = donation_row['Donation RE Appeal'];
    donation_row['Donation Description'] = formatGiftDescription( gift );

    return donation_row;

}


module.exports = {
    makeBaseGift: makeBaseGift
};
