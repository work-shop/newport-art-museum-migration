'use strict';

var pandas = require('pandas-js')


function lift_to_dataframe( dataframe ) {

    return new pandas.DataFrame( dataframe );

};

lift_to_dataframe.desc = 'Lifting to Pandas Dataframe'

module.exports = lift_to_dataframe;
