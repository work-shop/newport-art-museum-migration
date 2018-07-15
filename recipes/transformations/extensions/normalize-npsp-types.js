'use strict';


module.exports = {

    /**
     * This routine maps Record Types into
     * Salesforce opportunity record type.
     */
    normalizeRecordType: function( type ) {
        switch( type.toLowerCase().trim() ) {
            case 'cash':
                return 'Donation (Cash)';

            case 'pledge':
                return 'Donation (Pledged)';

            case 'mg pledge':
                return 'Donation (Pledged)';

            case 'other':
                return 'Donation (Cash)';

            case 'stock/property':
            case 'stock/property (sold)':
                return 'Donation (Stock)';

            case 'recurring gift':
                return 'Donation (Pledged)';

            default:
                return '';

        }
    },

    /**
     * This routine maps the different RE installment frequencies into
     * valid installment frequencies for the Salesforce instance.
     */
    normalizeInstallmentPlan: function( plan ) {
        switch ( plan.trim().toLowerCase() ) {

            case 'irregular':
                return 'Irregular Installments';

            case 'semi-annually':
                return 'Semi-Annual Installments';

            case 'annually':
                return 'Annual Installments';

            case 'quarterly':
                return 'Quarterly Installments';

            case 'monthly':
                return 'Monthly Installments';

            case 'single installment':
                return 'Single Installment';

            default:
                return '';

        }
    },

    normalizeCampaignNames: function( type ) {
        switch( type.trim().toLowerCase() ) {
            case 'education':
            case 'events':
            case 'restricted':
            case 'corp/ind underwrite':
            case 'anncamprest':
            case 'art matters now':
            case 'anncamprest':
            case 'bequest':
            case 'grants':
            case 'winter lectures':
            case 'cushing':
            case 'griswold':
            case 'endowment':
            case 'curatorial':
            case 'wet paint':
            case 'scholarship':
            case 'live auction':
            case 'rihphc grant march':
            case 'winslow':
            case 'exhibition':
            case 'end_blake campaign':
            case 'end_comstock':
                return 'Restricted';

            case 'annual':
            case 'anncampunrest':
            case 'operating':
                return 'Unrestricted';

            case 'membership':
                return 'Membership';

            default:
                return '';
        }
    },


    /**
    * Normalize Membership Types.
    * Given a membership type, convert this into a valid picklist value for Salesforce.
    */
    normalizeMembershipTypes: function( type ) {
        switch( type.trim().toLowerCase() ) {
            case 'artist\'s guild-household':
                return 'Household'; //

            case 'conklin shop staff':
                return 'Staff'; //

            case 'military household':
                return 'Military Household';

            case 'senior household':
                return 'Senior Household';

            case 'partners in art b&b':
                return 'Partners in Art B&B'; // TODO Verify

            case 'supporting  membership':
                return 'Supporting';

            case 'partners in art-nonprofit service organization':
                return 'Institutional';

            case 'patron membership-honorarium':
                return 'Patron'; // TODO What should this be?

            case 'student membership-muse':
                return 'MUSE Student'; // TODO what should we do?

            case 'young benefactor membership':
                return 'Student';

            case 'benefactor membership':
                return 'Benefactor';

            case 'contributing membership':
                return 'Contributing';

            case 'council membership':
                return 'Council';

            case 'faculty membership':
                return 'Staff';

            case 'family membership': // TODO is this real?
                return 'Household';

            case 'household membership':
                return 'Household';

            case 'individual membership':
                return 'Individual';

            case 'life membership':
                return 'Life';

            case 'military household membership':
                return 'Military Household';

            case 'military individual membership':
                return 'Military Individual';

            case 'patron membership':
                return 'Patron';

            case 'photo guild':
                return 'Photo Guild';

            case 'senior household membership':
                return 'Senior Household';

            case 'senior membership':
                return 'Senior';

            case 'staff membership':
                return 'Staff';

            case 'student membership':
                return 'Student';

            case 'supporting membership':
                return 'Supporting';

            case 'university membership':
                return 'University';

            case '':
                return 'Benefactor';

            default:
                return 'Individual Membership';
        }
    }
};
