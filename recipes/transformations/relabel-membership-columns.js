'use strict';

var RelabelColumnsFactory = require('./abstracts/relabel-columns.js');


module.exports = RelabelColumnsFactory({
    "Mem_System_ID": "RE_ID__c",
    "Mem_Membership_ID": "RE_Membership_ID__c",
    "Mem_Current_Dues_Amount": "Membership_Outstanding_Dues__c",
    "Mem_Standing": "Membership_Status__c",
    "Mem_Date_Joined": "Start_Date__c",
    "Mem_DateChanged": "Last_Changed_Date__c",
    "Mem_Last_Renewed_Date": "Last_Renewed_Date__c",
    "Mem_Last_Dropped_Date": "Last_Dropped_Date__c",
    "Mem_Total_Members": "Total_Members__c",
    "Mem_Total_Children": "Total_Children__c",
    "Mem_Total_Years": "Total_Years_of_Membership__c",
    "Mem_Consecutive_Years": "Consecutive_Years_of_Membership__c",
    "Mem_Times_Renewed": "Times_Renewed__c",
    "Mem_Cur_Expires_on": "Expiration_Date__c"
});
