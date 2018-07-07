'use strict';

var Recipe = require('./recipe.js');
var fields = require('../fields.js').NPSPImport;

var npsp = require('./transformations/reduce-to-npsp-data.js');

/**
 * First Iteration of the algorithm for building the Primary NPSP Import Object

 Imports

 r__NPSP_Export_Constituent_Master (indexed by CnBio_System_ID)
 r__NPSP_Export_Memberships

 seen_map = {}

 For Each (c : Head of Household) and (i : Index) in (r__Heads_of_Households):  // These will be the Contact1s in our new Import
    c = Get Constituent from r__NPSP_Export_Constituent_Master (assume indexed on CnBio_System_ID)
    if ( c == Individual ) :
        Contact1 = get Contact1 Fields from c
        Contact1_Relationships[] = get relationships from r__NPSP_Export_Constituent_Master // this will be an array of Contact2 info with relevant information.
            required-fields from Master:
                    Spouse:
                        - CnSpSpBio_System_ID
                        - CnSpSpBio_First_Name
                        - CnSpSpBio_Last_Name
                        - CnSpSpBio_Middle_Name
                        - CnSpSpBio_Title_1
                        - CnSpSpBio_Birth_date

                        ** seen[ {CnSpSpBio_Name} ] = { as: 'Contact2', major_row: i, minor_row: 0 }

                    Ind Rel: (all prefixed with CnRelInd_1_0k_, k from 1 - 5)
                        - if ( !Is_Spouse && (!Is_Consit || !Is_Headofhousehold) ):
                        - if ( Relation_Code == Kinship Term ): // Kinship Term is one of ("Family", "Partner", "")
                            - Birth_date
                            - First_Name
                            - Middle_Name
                            - Last_Name
                            - Title_1
                            - <Address Fields Forthcoming> TODO: setup linked memberships

                            ** seen[ {CnRelInd_1_0k_Name} ] = { as: 'Contact2', major_row: i, minor_row: k }



                    Org Ind: (all prefixed with CnRelOrg_1_0k_, k from 1 - 5.)
                        - Org_Name
                        - <Primary Phone> TODO: setup linked memberships
                        - <Address Fields> TODO: setup linked memberships

                        ** seen[ {CnRelInd_1_0k_Name} ] = { as: 'Account1', major_row: i, minor_row: k }


        Contact1_Gifts[] = get gifts from r__NPSP_Export_Constituent_Master
            required-fields from Master (all prefixed with CnGf_1_k_, k from 01 – 10 ):
                - Donation Donor __c = "Contact1"
                - Date => Donation Date __c
                - Amount => Donation Amount __c
                - Appeal
                - Fund
                - Campaign => Donation Campaign Name __c
                - Pay_method => Payment Method __c
                - System_ID => Donation RE Migration ID __c
                - Check_date => Donation Check Date __c

                if (Appeal == Membership):
                    - Donation Type __c = "Membership"
                    - let membership = <Linked_Membership> TODO: setup linked memberships
                    - membership.Member Level => Donation Member Level __c
                    - membership.Start Date => Donation Start Date  __c
                    - membership.End Date => Donation End Date __c
                    - ?? membership.Origin => Donation Member Level __c ??
                    - Name =>
                else:
                    - map(Appeal) =>  Donation Type __c  // Donation, In-Kind, Etc.

    else if ( c == Organization ) :



 */


module.exports = Recipe(
    'Build Base NPSP Import.',
    fields.headers,
    [
        npsp
    ],
    [

    ]
);
