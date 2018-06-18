'use strict';

var RelabelColumnsFactory = require('./abstracts/relabel-columns.js');


module.exports = RelabelColumnsFactory({
    "CnBio_System_ID": "RE_ID__c",
    "CnBio_ID": "RE_Constituent_ID__c",
    "CnBio_Org_Name": "Name__n",
    "CnBio_No_Valid_Addresses": "RE_No_Valid_Address__f"
});
