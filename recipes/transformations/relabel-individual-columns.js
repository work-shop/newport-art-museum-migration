'use strict';

var RelabelColumnsFactory = require('./abstracts/relabel-columns.js');


module.exports = RelabelColumnsFactory({
    "CnBio_System_ID": "RE_ID__c",
    "CnBio_ID": "RE_Constituent_ID__c",
    "CnBio_First_Name": "First_Name__c",
    "CnBio_Last_Name": "Last_Name__c",
    "CnBio_Middle_Name": "Middle_Name__c",
    "CnBio_Birth_date": "Birthday__c",
    "CnBio_No_Valid_Addresses": "RE_No_Valid_Address__f",
    "CnAdrSal_Salutation": "Salutation__c"
});
