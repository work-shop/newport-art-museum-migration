"use strict";

var fs = require('fs');

var parser = require('csv-parser');
var writer = require('csv-write-stream')();
var ProgressBar = require('progress');
var pandas = require('pandas-js');


function CSVDataPipeline( sources, target ) {
    if ( !(this instanceof CSVDataPipeline) ) { return new CSVDataPipeline( sources, target ); }
    var self = this;

    self.__sources = sources;

    self.__target = target;

    self.__tranformations = [];

    self.__validations = [];

    self.__rows = [];



    self.__readInputFiles = function( then = function() {} ) {

        fs  .createReadStream( self.__inputfiles.shift() )
            .pipe( parser() )
            .on('data', function( d ) { self.__rows.push( d ); } )
            .on('end', function() {

                self.__progress.tick( 1 );

                if ( self.__inputfiles.length > 0 ) {

                    self.__readInputFiles( then );

                } else {

                    then();

                }

            });

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

        var transformed = transformation( data );

        self.__progress.interrupt( '\t' + '[✔] ' + transformation.desc );
        self.__progress.tick( 1 );

        return transformed;

    };

    self.__runValidation = function( ) {};


    self.sources = function( primary_input_csv_paths, secondary_input_csv_files ) {

        self.__inputfiles = primary_input_csv_paths;
        self.__secondaryfiles = secondary_input_csv_files

        return self;

    };


    self.transformations = function( recipe ) {

        self.__tranformations = recipe;

        return self;

    };


    self.validations = function( recipe ) {

        self.__validations = recipe;

        return self;

    };


    self.target = function( output_csv_path ) {

        self.__outputfile = output_csv_path;

        self.__sources.forEach( function( source, i ) {
            if ( i == self.__sources.length - 1 ) {
                console.log( ['\t', source, ' ===> ', self.__target, ].join(''));
            } else {
                console.log( ['\t', source, '\n' ].join(''));
            }

        });

        console.log( '\t--------------------------------------------------------------------\n' );

        self.__progress = new ProgressBar('\toverall \t[:bar] :percent :etas', {
            complete: '=',
            head: '>',
            incomplete: ' ',
            width: 40,
            total: 1 + self.__tranformations.length + self.__validations.length + self.__inputfiles.length,
            renderThrottle: 10
        });

        self.__rows = [];

        self.__readInputFiles( function() {

            self.__rows = self.__tranformations.reduce( self.__runTransformation.bind( self ), self.__rows );

            self.__writeOutputFile();

        } );



        return null;

    }
}




module.exports = CSVDataPipeline;
