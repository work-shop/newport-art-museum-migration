'use strict';


module.exports = {

    /**
     * Primary Export Sheet for NPSP
     */

    'NPSP_Import_Profile__c': {
        primary: ['r__NPSP_Export_Constituent_Master'],
        secondary: [ 'r__NPSP_Export_Gifts', 'r__NPSP_Export_Memberships'  ],
        sort_keys: [ 'Gf_CnBio_System_ID', 'Mem_CnBio_System_ID' ]
    },

    'NPSP_Import_Payments__c': {
        primary: ['r__NPSP_Export_Constituent_Master'],
        secondary: ['r__NPSP_Export_Gifts'],
        sort_keys: ['Gf_CnBio_System_ID']
    }


};
