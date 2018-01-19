/*
 Copyright (c) 2012-2018, CKSource - Frederico Knabben. All rights reserved.
 For licensing, see LICENSE.md
 */

importPackage( org.apache.commons.cli );
importClass( java.lang.System );
/**
 * The main controller, parses the command line options and calls the right methods.
 *
 * @class
 * @constructor
 */
CKBuilder.Controller = function() {
	/**
	 * Command definitions along with descriptions.
	 *
	 * @type {Array}
	 * @private
	 */
	var options = [
		// Commands
		[ null, "build", false, "build release" ],
		[ null, "generate-build-config", false, "generate build configuration file" ],
		[ null, "help", false, "print help" ],
		[ null, "full-help", false, "print help for all advanced commands" ],
		[ null, "build-help", false, "print help about build configuration" ],
		[ null, "preprocess-core", false, "preprocess CKEditor core" ],
		[ null, "preprocess-plugin", false, "preprocess plugin" ],
		[ null, "preprocess-skin", false, "preprocess skin" ],
		[ null, "build-skin", false, "build skin" ],
		[ null, "verify-plugin", false, "verify plugin" ],
		[ null, "verify-skin", false, "verify skin" ],
		// Options
		[ null, "build-config", [ "FILE", "path to the file" ], "path to the build configuration" ],
		[ null, "leave-js-unminified", false, "leave javascript files as is, do not minify them" ],
		[ null, "leave-css-unminified", false, "leave CSS files as is, do not minify them" ],
		[ "s", "skip-omitted-in-build-config", false, "exclude from release all plugins/skins that are not specified in build-config" ],
		[ null, "revision", [ "NUMBER", "revision number" ], "revision number" ],
		[ null, "version", [ "NUMBER", "version number" ], "version number" ],
		[ null, "overwrite", false, "overwrite target folder if exists" ],
		[ null, "no-ie-checks", false, "turn off warnings about syntax errors on Internet Explorer, like trailing commas" ],
		[ null, "no-zip", false, "do not create zip file" ],
		[ null, "no-tar", false, "do not create tar.gz file" ],
		[ null, "core", false, "build only the core file (ckeditor.js)" ],
		[ null, "commercial", false, "builds a package with commercial license" ],
		[ null, "name", [ "NAME", "expected name" ], "the expected name of the skin/plugin, used for verification" ],
		[ "d", "debug-level", [ "LEVEL", "debug level (0, 1, 2)." ], "sets the debug level" ]
	];

	/**
	 * Object with functions which are called for appropriate commands.
	 * Key is command name and value is function which is called with `CKBuilder.Controller` context
	 * and two arguments:
	 * first - Array of strings which are command line arguments
	 * second - Command line instance {org.apache.commons.cli.CommandLine}
	 *
	 * @type {Object}
	 */
	this.commandsHandlers = {
		'help': function() {
			this.printHelp( [ 'help.txt' ] );
		},
		'full-help': function() {
			this.printHelp( [ 'help.txt', 'help-extra.txt' ] );
		},
		'build-help': function() {
			this.printHelp( [ 'help-build.txt' ] );
		},
		'build': function( args ) {
			if ( args.length < 2 )
				CKBuilder.error( "The build command requires two arguments." );

			var builder = CKBuilder.builder( args[ 0 ], args[ 1 ] );
			if ( CKBuilder.options.core )
				builder.generateCore();
			else
				builder.generateBuild();
		},
		'generate-build-config': function( args ) {
			if ( args.length < 1 )
				CKBuilder.error( "The generate-build-config command requires an argument." );

			CKBuilder.config.create( args[ 0 ] );
		},
		'preprocess-core': function( args ) {
			if ( args.length < 2 )
				CKBuilder.error( "The preprocess-core command requires two arguments." );

			var builder = CKBuilder.builder( args[ 0 ], args[ 1 ] );
			builder.preprocess();
		},
		'preprocess-plugin': function( args ) {
			if ( args.length < 2 )
				CKBuilder.error( "The preprocess-plugin command requires two arguments." );

			CKBuilder.plugin.preprocess( args[ 0 ], args[ 1 ] );
			print( "Plugin preprocessed successfully" );
		},
		'preprocess-skin': function( args ) {
			if ( args.length < 2 )
				CKBuilder.error( "The preprocess-skin command requires two arguments." );

			CKBuilder.skin.preprocess( args[ 0 ], args[ 1 ] );
			print( "Skin preprocessed successfully" );
		},
		'build-skin': function( args ) {
			if ( args.length < 2 )
				CKBuilder.error( "The build-skin command requires two arguments." );

			CKBuilder.skin.build( args[ 0 ], args[ 1 ] );
		},
		'verify-plugin': function( args, line ) {
			var options = {};

			if ( line.hasOption( "name" ) )
				options.pluginName = String( line.getOptionValue( "name" ) );

			if ( args.length < 1 )
				CKBuilder.error( "The verify-plugin command requires an argument." );

			print( CKBuilder.plugin.verify( args[ 0 ], options ) );
		},
		'verify-skin': function( args, line ) {
			var options = {};
			if ( line.hasOption( "name" ) )
				options.skinName = String( line.getOptionValue( "name" ) );

			if ( args.length < 1 )
				CKBuilder.error( "The verify-skin command requires an argument." );

			print( CKBuilder.skin.verify( args[ 0 ], options ) );
		}
	};

	/**
	 * @type {org.apache.commons.cli.PosixParser}
	 */
	this.parser = new PosixParser();

	/**
	 * @type {org.apache.commons.cli.Options}
	 */
	this.options = new Options();

	for ( var i = 0; i < options.length; i++ ) {
		if ( !options[ i ][ 2 ] )
			this.options.addOption.apply( this.options, options[ i ] );
		else {
			var option = OptionBuilder.withLongOpt( options[ i ][ 1 ] ).withDescription( options[ i ][ 2 ][ 1 ] ).hasArg().withArgName( options[ i ][ 2 ][ 0 ] );

			this.options.addOption( option.create( options[ i ][ 0 ] || null ) );
		}
	}
};

CKBuilder.Controller.prototype = {
	/**
	 * Prints all available options.
	 *
	 * @param {Array} types
	 */
	printHelp: function( types ) {
		var i, date = new Date();

		if ( CKBuilder.isMinified ) {
			for ( i = 0; i < types.length; i++ )
				print( "\n" + CKBuilder.io.readFileFromJar( types[ i ] ) );
		} else {
			for ( i = 0; i < types.length; i++ )
				print( "\n" + CKBuilder.io.readFile( new File( "src/assets/" + types[ i ] ) ) );
		}
		print( "Copyright (c) 2003-" + date.getFullYear() + ", CKSource - Frederico Knabben" );
	},

	/**
	 * Executes commands based on passed arguments.
	 *
	 * @param {Array} _arguments An array containing the strings of all the arguments given at the command line when the shell was invoked
	 */
	run: function( _arguments ) {
		// parse the command line arguments
		var line = this.parser.parse( this.options, _arguments );

		// Options
		if ( line.hasOption( "debug-level" ) )
			CKBuilder.options.debug = line.getOptionValue( "debug-level" );

		if ( line.hasOption( "overwrite" ) )
			CKBuilder.options.overwrite = true;

		if ( line.hasOption( "build-config" ) )
			CKBuilder.options.buildConfig = line.getOptionValue( "build-config" );

		if ( line.hasOption( "skip-omitted-in-build-config" ) )
			CKBuilder.options.all = false;

		if ( line.hasOption( "version" ) )
			CKBuilder.options.version = line.getOptionValue( "version" );

		if ( line.hasOption( "core" ) )
			CKBuilder.options.core = true;

		if ( line.hasOption( "commercial" ) )
			CKBuilder.options.commercial = true;

		if ( line.hasOption( "revision" ) )
			CKBuilder.options.revision = line.getOptionValue( "revision" );

		if ( line.hasOption( "leave-js-unminified" ) )
			CKBuilder.options.leaveJsUnminified = true;

		if ( line.hasOption( "leave-css-unminified" ) )
			CKBuilder.options.leaveCssUnminified = true;

		if ( line.hasOption( "no-zip" ) )
			CKBuilder.options.noZip = true;

		if ( line.hasOption( "no-ie-checks" ) )
			CKBuilder.options.noIeChecks = true;

		if ( line.hasOption( "no-tar" ) )
			CKBuilder.options.noTar = true;

		var foundCommandName = null;
		for ( var commandName in this.commandsHandlers ) {
			if ( line.hasOption( commandName ) ) {
				foundCommandName = commandName;
				break;
			}
		}

		foundCommandName = foundCommandName || 'help';

		this.commandsHandlers[ foundCommandName ].call(this, line.getArgs(), line );

		System.exit( 0 );
	}
};