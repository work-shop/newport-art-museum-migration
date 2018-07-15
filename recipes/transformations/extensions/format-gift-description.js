'use strict';

const giftNoteCount = require('../../../package.json').parameters.giftNoteCount;

/**
 * This routine constructs a gift description by scanning across the notes
 * in a gift as well as looking at the 'reference' field in RE.
 */
function formatGiftDescription( gift ) {

    var notes = [];

    if ( typeof gift.Gf_Reference !== 'undefined' && gift.Gf_Reference !== '' ) {
        notes.push( gift.Gf_Reference );
    }

    for ( var i = 1; i < giftNoteCount; i += 1 ){

        var date = gift['Gf_Note_1_' + ((('' + i).length === 1 ) ? '0' + i : i ) + 'Date' ];
        var note = gift['Gf_Note_1_' + ((('' + i).length === 1 ) ? '0' + i : i ) + 'Actual_Notes' ];

        if ( typeof note !== 'undefined' && note.length > 0 ) {
            if ( typeof date !== 'undefined' && date.length > 0 ) {
                notes.push( [ date, note ].join(' - ') );
            } else {
                notes.push( note );
            }
        }

    }

    return notes.join('; ');

}


module.exports = formatGiftDescription;
