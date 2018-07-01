'use strict';

var RelabelColumnsFactory = require('./abstracts/relabel-columns.js');


module.exports = RelabelColumnsFactory({
    "CnBio_System_ID": "Contact1 Raisers Edge ID __c",
    "CnBio_First_Name": "Contact1 First Name __c",
    "CnBio_Last_Name": "Contact1 Last Name __c",
    "CnBio_Middle_Name": "Contact1 Middle Name __c",
    "CnBio_Birth_date": "Contact1 Birthdate __c",
});
