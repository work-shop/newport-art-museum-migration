'use strict';

var duplicateWith = require('./objects.js').duplicateWith;
var makeSurjectiveMappingWith = require('./objects.js').makeSurjectiveMappingWith;
var formatCurrency = require('./format-currency.js');
var formatDate = require('./format-date.js');

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

    stock_row['Donation Stock Mean Value'] = formatCurrency( stock_row['Donation Stock Mean Value'] );
    stock_row['Donation Stock Liquid Value'] = formatCurrency( stock_row['Donation Stock Liquid Value'] );
    stock_row['Donation Stock Broker Fee'] = formatCurrency( stock_row['Donation Stock Broker Fee'] );
    stock_row['Donation Stock Issuer'] = stock_row['Donation Stock Issuer'].toUpperCase();
    stock_row['Donation Record Type Name'] = 'Donation (Stock)';
    stock_row['Donation Type'] = 'Stock';
    stock_row['Donation Acknowledgement Status'] = 'Acknowledged';
    stock_row['Donation Certainty'] = 100;
    stock_row['Donation Migration Description'] = 'Single stock gift linked directly to Primary Donor.'
    stock_row['Payment Certainty'] = 100;
    stock_row['Payment Migration Description'] = 'Payment automatically created to match donation.'
    stock_row['Payment Date'] = formatDate( gift.Gf_Sale_of_stock_date || gift.Gf_Date );
    stock_row['Payment Paid'] = 1;
    stock_row['Payment Amount'] = stock_row['Donation Amount'];

    return stock_row;

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


module.exports = {
    makeStockGift: makeStockGift,
    isStockGift: isStockGift
};
