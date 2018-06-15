'use strict';


module.exports = {

    'Individuals__c': {
        primary: ['r__Constituents', 'r__Individual_Relationships'],
        secondary: []
    },

    'Organizations__c': {
        primary: ['r__Constituents'],
        secondary: []
    }

}
