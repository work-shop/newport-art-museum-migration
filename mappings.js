'use strict';


module.exports = {
    /**
     * Audit Sheets for NPSP
     */
    'Contact1__a': {
        primary: ['r__Heads_of_Household'],
        secondary: ['r__Addresses', 'r__Phones']
    },

    'Contacts_and_Accounts__a': {
        primary: ['r__Constituents', 'r__Individual_Relationships'],
        secondary: ['r__Addresses', 'r__Phones']
    },


    /**
     * Primary Export Sheet for NPSP
     */

    'NPSP_Import_Profile__c': {
        primary: ['r__NPSP_Export_Constituent_Master'],
        secondary: ['r__NPSP_Export_Gifts'],
        sort_keys: ['Gf_CnBio_System_ID']
    },


    /**
     * Primary Objects
     */

    'Individual__c': {
        primary: ['r__Constituents', 'r__Individual_Relationships'],
        secondary: []
    },

    'Organization__c': {
        primary: ['r__Constituents'],
        secondary: []
    },

    'Household__c': {
        primary: [ 'r__Heads_of_Household' ],
        secondary: []
    },

    'Gift__c': {
        primary: ['r__Gifts'],
        secondary: []
    },

    'Membership__c': {
        primary: [ 'r__Memberships' ],
        secondary: []
    },

    'Card__c': {
        primary: ['r__Cards'],
        secondary: []
    },


    /**
     * Supporting objects.
     */

    'Address__c': {
        primary: [ 'r__Addresses' ],
        secondary: []
    },

    'Phone__c': {
        primary: [],
        secondary: []
    },

    'Email__c': {
        primary: [],
        secondary: []
    },


    /**
     * Constituent Code Related objects
     */

    'Constituent_Code__c': {
        primary: [],
        secondary: []
    },

    'Code_IndividualConstituentCode__c': {
        primary: [],
        secondary: []
    },





    /**
     * Gift related relations.
     */

    'Gift_GiftMembershipRelationship__c': {
        primary: [],
        secondary: []
    },

    'HardCredit_GiftIndividualRelationship__c': {
        primary: [],
        secondary: []
    },

    'HardCredit_GiftOrganizationRelationship__c': {
        primary: [],
        secondary: []
    },

    'SoftCredit_GiftIndividualRelationship__c': {
        primary: [],
        secondary: []
    },

    'SoftCredit_GiftOrganizationRelationship__c': {
        primary: [],
        secondary: []
    },


    /**
     * Individual, Household, and Organization relations.
     */

    'Link_IndividualHouseholdRelationship__c': {
        primary: [],
        secondary: []
    },

    'Link_IndividualIndividualRelationship__c': {
        primary: [],
        secondary: []
    },

    'Link_IndividualMembershipRelationship__c': {
        primary: [],
        secondary: []
    },

    'Link_IndividualOrganizationRelationship__c': {
        primary: [],
        secondary: []
    },

    'Link_MembershipCardRelationship__c': {
        primary: [],
        secondary: []
    }


};
