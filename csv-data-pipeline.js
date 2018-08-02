"use strict";

var fs = require('fs');

var parser = require('csv-parser');
var ProgressBar = require('progress');


/**
 * This routine handles orchestration for the input and output CSV files from a transformation process.
 *
 */
function CSVDataPipeline( sources, target ) {
    if ( !(this instanceof CSVDataPipeline) ) { return new CSVDataPipeline( sources, target ); }
    var self = this;

    /**
     * This constant sets the maximum number of rows to assign to an output csv.
     */
    self.__size_limit = 10000;

    /**
     * This is the set of sources that we're pulling from.
     */
    self.__sources = sources;

    /**
     * This is the target file name that we're tring to generate.
     */
    self.__target = target;

    /**
     * This is the set of transformations that we want to run on the primary rows.
     */
    self.__transformations = [];

    /**
     * This is the set of validations that we want to run on the primary rows.
     */
    self.__validations = [];

    /**
     * This is the set of rows in their current state, which is transformed during processing.
     */
    self.__rows = [];

    /**
     * This is the set of arrays of files that might be used to compute a validation.
     */
    self.__secondaryrows = [];


    /**
     * This is the set of keys indexing the corresponding secondary rows to sort with respect to.
     */
    self.__sortkeys = [];



    self.__readInputFiles = function( then = function() {}, secondary_files = [] ) {

        if ( self.__inputfiles.length > 0 ) {

            fs  .createReadStream( self.__inputfiles.shift() )
                .pipe( parser() )
                .on('data', function( d ) { self.__rows.push( d ); } )
                .on('end', function() {

                    self.__readInputFiles( then, secondary_files );

                });

        } else if ( self.__secondaryfiles.length > 0 ) {

            var file = [];

            fs  .createReadStream( self.__secondaryfiles.shift() )
                .pipe( parser() )
                .on( 'data', function( d ) { file.push( d ); } )
                .on( 'end', function() {

                    secondary_files.push( file );

                    self.__readInputFiles( then, secondary_files );

                });

        } else {

            self.__secondaryrows = secondary_files;

            then();

        }

    };

    /**
     * This internal routine writes a set of calculated CSV rows to a number of
     * different csv files, as determined by a configuration-time size limit.
     */
    self.__writeOutputFile = function( then = function() {} ) {

        const total_rows = self.__rows.length;
        const num_files = Math.ceil( total_rows / self.__size_limit );

        var writers = (new Array( num_files )).fill( 0 ).map( function() { return require('csv-write-stream')(); });

        for ( let i = 0; i < num_files; i += 1 ) {

            let local_writer = writers[i];

            local_writer.pipe( fs.createWriteStream( self.__outputfile + '-' + i ) );

            for ( var j = 0; j < self.__size_limit && (i * self.__size_limit) + j < total_rows; j += 1 ) {

                local_writer.write( self.__rows[ (i * self.__size_limit) + j ] );

            }

            local_writer.end();

        }

        self.__progress.interrupt('\t[✔] Done\n' );
        self.__progress.tick( 1 );
        console.log('\n');

        then();

    }


    self.__runTransformation = function( data, transformation, i ) {

        self.__progress.interrupt( '\t' + transformation.desc );

        var transformed = transformation( data, self.__secondaryrows, self.__progress );

        self.__progress.interrupt( '\t\t\t\t\t\t\t\t\t' + '[✔]' );
        self.__progress.tick( 1 );

        return transformed;

    };


    self.__runValidation = function( data, validation, i ) {

        self.__progress.interrupt( '\t' + validation.desc );

        var result = validation( data, self.__secondaryrows );

        self.__progress.interrupt( '\t' + ((validation.state) ? '[✔]' : '[✗]') + ' ' + validation.statusMessage + '\n' );
        self.__progress.tick( 1 );

        return result;

    };


    self.__expandHeader = function( row ) {

        self.__header.forEach( function( header ) {

            if ( typeof row[ header ] === 'undefined' ) {

                row[ header ] = '';

            }

        });

        return row;

    }





    self.sources = function( primary_input_csv_paths, secondary_input_csv_files ) {

        self.__inputfiles = primary_input_csv_paths;
        self.__secondaryfiles = secondary_input_csv_files

        return self;

    };


    self.recipe = function( recipe ) {

        self.name = recipe.name;

        self.__header = recipe.header;

        self.__transformations = recipe.transformations;

        self.__validations = recipe.validations;

        return self;

    }

    /**
     * Pass this routine an in-order set of keys to sort the secondary spreadsheets on for lookup.
     */
    self.sorts = function( sort_keys ) {

        self.__sortkeys = sort_keys;

        return self;

    }


    self.target = function( output_csv_path ) {

        self.__outputfile = output_csv_path;

        self.__sources.forEach( function( source, i ) {
            if ( i == self.__sources.length - 1 ) {
                console.log( ['\t', source, ' ===> ', self.__target ].join('') );
            } else {
                console.log( ['\t', source ].join(''));
            }

        });

        console.log( '\t--------------------------------------------------------------------\n' );

        self.__rows = [];

        self.__readInputFiles( function( ) {

            self.__progress = new ProgressBar('\tprogress \t[:bar] :percent :etas', {
                complete: '=',
                head: '>',
                incomplete: ' ',
                width: 40,
                total: 1 + (self.__transformations.length * self.__rows.length) + self.__transformations.length + self.__validations.length + self.__sortkeys.length,
                renderThrottle: 10
            });

            if ( typeof self.__sortkeys !== 'undefined' && self.__sortkeys.length > 0 ) {

                self.__secondaryrows.forEach( function( file, i ) {
                    if ( typeof self.__sortkeys[ i ] !== 'undefined' ) {

                        var sort_key = self.__sortkeys[ i ];

                        file.sort( function( a, b ) {

                            if ( a[ sort_key ] < b[ sort_key ] ) {
                                return -1;
                            } else if ( a[ sort_key ] > b[ sort_key ] ) {
                                return 1;
                            } else {
                                return 0;
                            }

                        });

                    }

                    self.__progress.tick( 1 );

                });

            }

            self.__rows = self.__transformations.reduce( self.__runTransformation.bind( self ), self.__rows );

            self.__rows = self.__rows.map( self.__expandHeader );

            self.__progress.interrupt( '\n\tValidating Mapping:' );

            self.__rows = self.__validations.reduce( self.__runValidation.bind( self ), self.__rows );

            self.__writeOutputFile();

        } );

        return null;

    }
}




module.exports = CSVDataPipeline;
