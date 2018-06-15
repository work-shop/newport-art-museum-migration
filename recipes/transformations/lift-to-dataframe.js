'use strict';

var pandas = require('pandas-js')
var RowOperator = require('./abstracts/row-operator.js');


function lift_to_dataframe( dataframe ) {

    return new pandas.DataFrame( dataframe );

};

lift_to_dataframe.desc = 'Lifting to Pandas Dataframe';

module.exports = { transformation: lift_to_dataframe };
