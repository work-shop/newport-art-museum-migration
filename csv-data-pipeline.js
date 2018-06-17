"use strict";

var fs = require('fs');

var parser = require('csv-parser');
var writer = require('csv-write-stream')();
var ProgressBar = require('progress');
var pandas = require('pandas-js');
var sort = require('array-sort');


function sortComparator( a,b ) {

    var a_i = a['Sort_Index__f'];
    var b_i = b['Sort_Index__f']

    if ( a_i < b_i ) {

        return -1;

    } else if ( b_i < a_i ) {

        return 1;

    } else {

        return 0;

    }
}


function CSVDataPipeline( sources, target ) {
    if ( !(this instanceof CSVDataPipeline) ) { return new CSVDataPipeline( sources, target ); }
    var self = this;

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



    self.__readInputFiles = function( then = function() {}, secondary_files = [] ) {

        if ( self.__inputfiles.length > 0 ) {

            fs  .createReadStream( self.__inputfiles.shift() )
                .pipe( parser() )
                .on('data', function( d ) { self.__rows.push( d ); } )
                .on('end', function() {

                    self.__progress.tick( 1 );

                    self.__readInputFiles( then, secondary_files );

                });

        } else if ( self.__secondaryfiles.length > 0 ) {

            var file = [];

            fs  .createReadStream( self.__secondaryfiles.shift() )
                .pipe( parser() )
                .on( 'data', function( d ) { file.push( d ); } )
                .on( 'end', function() {

                    self.__progress.tick( 1 );

                    self.__readInputFiles( then, secondary_files.concat( file ) );

                });

        } else {

            self.__secondaryrows = secondary_files;

            then();

        }

    };


    self.__writeOutputFile = function( then = function() {} ) {

        if ( self.__rows instanceof pandas.DataFrame ) {

            var csv_string = self.__rows.to_csv();

            fs.writeFile( self.__outputfile, csv_string, function() {

                self.__progress.interrupt('\t[✔] Done\n' );
                self.__progress.tick( 1 );
                console.log('\n');

                then();

            } );

        } else {

            writer.pipe( fs.createWriteStream( self.__outputfile ) );

            self.__rows.forEach( function( row ) {

                writer.write( row );

            });

            self.__progress.interrupt('\t[✔] Done\n' );
            self.__progress.tick( 1 );
            console.log('\n');

            writer.end();

            then();

        }

    }


    self.__runTransformation = function( data, transformation, i ) {

        var transformed = transformation( data, self.__secondaryrows );

        self.__progress.interrupt( '\t' + '[✔] ' + transformation.desc );
        self.__progress.tick( 1 );

        return transformed;

    };


    self.__runValidation = function( data, validation, i ) {

        var result = validation( data, self.__secondaryrows );

        self.__progress.interrupt( '\t' + ((validation.state) ? '[✔]' : '[✗]') + ' ' + validation.statusMessage );
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

        self.__progress = new ProgressBar('\tprogress \t[:bar] :percent :etas', {
            complete: '=',
            head: '>',
            incomplete: ' ',
            width: 40,
            total: 2 + self.__transformations.length + self.__validations.length + self.__inputfiles.length + self.__secondaryfiles.length,
            renderThrottle: 10
        });

        self.__rows = [];

        self.__readInputFiles( function( ) {

            self.__rows = self.__transformations.reduce( self.__runTransformation.bind( self ), self.__rows );

            self.__rows = self.__rows.map( self.__expandHeader );

            sort( self.__rows, 'Sort_Index__f' );

            self.__progress.tick( 1 );

            self.__progress.interrupt( '\n\tValidating Mapping:' );

            self.__rows = self.__validations.reduce( self.__runValidation.bind( self ), self.__rows );

            self.__writeOutputFile();

        } );

        return null;

    }
}




module.exports = CSVDataPipeline;
