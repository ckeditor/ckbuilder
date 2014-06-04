/*
 Copyright (c) 2012-2014, CKSource - Frederico Knabben. All rights reserved.
 For licensing, see LICENSE.md
 */

importPackage( org.mozilla.javascript );
importClass( java.lang.System );
importClass( java.lang.Integer );

/**
 * @class java.io.File
 *
 * Check out [official java.io.File documentation][1]  for more.
 *
 * [1]: http://docs.oracle.com/javase/7/docs/api/java/io/File.html
 */

/**
 * @class java.io.OutputStream
 *
 * Check out [official java.io.File documentation][1]  for more.
 *
 * [1]: http://docs.oracle.com/javase/7/docs/api/java/io/OutputStream.html
 */

/**
 * @class
 *
 * Main file which is run from Rhino. Responsible for load scripts and run controller.
 */
this.CKBuilder = ( function() {
	var isMinified = true;
	try {
		java.lang.Class.forName( "ckbuilder.ckbuilder" );
	} catch ( e ) {
		isMinified = false;
	}
	var now = new Date();
	var timestamp = Integer.toString( now.getUTCFullYear() % 1000, 36 ) + Integer.toString( now.getUTCMonth(), 36 ) + Integer.toString( now.getUTCDate(), 36 ) + Integer.toString( now.getUTCHours(), 36 );
	timestamp = timestamp.toUpperCase();

	return {
		isMinified : isMinified,
		options : {
			debug : 0,
			all : true,
			overwrite : false,
			version : 'DEV',
			revision : 0,
			timestamp : timestamp
		},
		error : function( msg ) {
			print( 'ERROR:' );
			print( msg );
			print( '' );
			// quit() does not work when compiled.
			System.exit( 1000 );
		},
		load : function( className ) {
			if ( isMinified )
				loadClass( className );
			else
			{
				var path = className;

				if ( path.indexOf( "ckbuilder." ) === 0 )
					path = path.replace( /^ckbuilder\./, "src/" );
				else
					path = path.replace( /^tools\./, 'lib/' );

				path = path.replace( /\./g, '/' ) + '.js';
				load( path );
			}
		}
	};
} )();

/* jshint ignore:start */
function print( arg ) {
	if ( arg === undefined )
		arg = 'undefined';

	if ( arg === null)
		arg = 'null';

	System.out.println( arg );
}
/* jshint ignore:end */

CKBuilder.DEFAULT_SKIN = 'moono';
CKBuilder.DEFAULT_LANGUAGE = 'en';

CKBuilder.load( 'tools.json.json2' );

CKBuilder.load( 'ckbuilder.lib.controller' );
CKBuilder.load( 'ckbuilder.lib.io' );
CKBuilder.load( 'ckbuilder.lib.css' );
CKBuilder.load( 'ckbuilder.lib.cssmin' );
CKBuilder.load( 'ckbuilder.lib.image' );
CKBuilder.load( 'ckbuilder.lib.lang' );
CKBuilder.load( 'ckbuilder.lib.javascript' );
CKBuilder.load( 'ckbuilder.lib.config' );
CKBuilder.load( 'ckbuilder.lib.samples' );
CKBuilder.load( 'ckbuilder.lib.plugin' );
CKBuilder.load( 'ckbuilder.lib.skin' );
CKBuilder.load( 'ckbuilder.lib.utils' );
CKBuilder.load( 'ckbuilder.lib.tools' );
CKBuilder.load( 'ckbuilder.lib.builder' );

if ( typeof CKBuilderTest === 'undefined' ) {
	var controller = new CKBuilder.Controller();
	controller.run( arguments );
}
