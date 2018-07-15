'use strict';

/**
 * Format Currency appropriately.
 *
 */
function format_currency( amt ) {

    try {

        return parseFloat( amt.replace('$', '' ).replace(',', '', 'g') );

    } catch( e ) {

        return "";

    }

}

module.exports = format_currency;
