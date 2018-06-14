"use strict";

var fs = require('fs');

var parser = require('csv-parser');
var writer = require('csv-write-stream')();
var ProgressBar = require('progress');
var pandas = require('pandas-js');


function CSVDataPipeline( source, target ) {
    if ( !(this instanceof CSVDataPipeline) ) { return new CSVDataPipeline( source, target ); }
    var self = this;

    self.__source = source;

    self.__target = target;

    self.__tranformations = [];

    self.__rows = [];


    self.source = function( input_csv_path ) {

        self.__inputfile = input_csv_path;

        return self;

    };


    self.transformations = function( recipe ) {

        self.__tranformations = recipe;

        return self;

    }


    self.target = function( output_csv_path ) {

        console.log( ['\tMapping ', self.__source, ' to ', self.__target ].join(''));
        console.log( '\t--------------------------------------------------------------------\n' );

        self.__progress = new ProgressBar('\toverall \t[:bar] :percent :etas', {
            complete: '=',
            head: '>',
            incomplete: ' ',
            width: 40,
            total: 3 + self.__tranformations.length,
            renderThrottle: 10
        });

        self.__rows = [];

        self.__progress.tick( 1 );

        fs  .createReadStream( self.__inputfile )
            .pipe( parser() )
            .on('data', function( d ) { self.__rows.push( d ); } )
            .on('end', function() {


                self.__progress.tick( 1 );


                self.__rows = self.__tranformations.reduce( function( data, transformation, i ) {

                    var transformed = transformation( data );

                    self.__progress.interrupt( '\t' + '[✔] ' + transformation.desc );
                    self.__progress.tick( 1 );

                    return transformed;

                }, self.__rows );


                if ( self.__rows instanceof pandas.DataFrame ) {

                    var csv_string = self.__rows.to_csv();

                    fs.writeFile( output_csv_path, csv_string, function() {

                        self.__progress.tick( 1 );
                        console.log('\n');

                    } );

                } else {

                    writer.pipe( fs.createWriteStream( output_csv_path ) );

                    self.__rows.forEach( function( row ) {

                        writer.write( row );

                    });

                    self.__progress.interrupt('\t[✔] Done\n' );
                    self.__progress.tick( 1 );

                    console.log('\n');

                    writer.end();

                }




            } );

        return null;

    }
}


module.exports = CSVDataPipeline;
