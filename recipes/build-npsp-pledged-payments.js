'use strict';

var Recipe = require('./recipe.js');
var fields = require('../fields.js').NPSPImportPayments;

var npsp_payments = require('./transformations/reduce-to-npsp-payment-data.js');


module.exports = Recipe(
    'Build Base NPSP Payments on Pledges.',
    fields.headers,
    [
        npsp_payments
    ],
    []
);
