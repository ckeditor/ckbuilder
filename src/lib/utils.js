/*
 Copyright (c) 2012-2021, CKSource - Frederico Knabben. All rights reserved.
 For licensing, see LICENSE.md
 */

( function() {

	function escapeProperty( string ) {
		if ( string.match( /^[a-z][a-z0-9_]+$/i ) )
			return string;

		return "'" + escapeString( string ) + "'";
	}

	function escapeString( string ) {
		return string.replace( /\\/g, "\\\\" ).replace( /\r/g, "\\r" ).replace( /\n/g, "\\n" ).replace( /'/g, "\\'" ).replace( /\u200b/g, "\\u200b" );
	}

	/**
	 * Utility class.
	 *
	 * @class
	 */
	CKBuilder.utils = {
		/**
		 * Returns the copyright header with selected newline characters.
		 *
		 * @param {String} eol
		 * @returns {String}
		 * @static
		 */
		copyright: function( eol ) {
			var copyright,
				date = new Date();

			if ( CKBuilder.options.commercial )
				copyright = "/*" + eol + "This software is covered by CKEditor Commercial License. Usage without proper license is prohibited." + eol + "Copyright (c) 2003-" + date.getFullYear() + ", CKSource - Frederico Knabben. All rights reserved." + eol + "*/" + eol;
			else
				copyright = "/*" + eol + "Copyright (c) 2003-" + date.getFullYear() + ", CKSource - Frederico Knabben. All rights reserved." + eol + "For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license" + eol + "*/" + eol;

				return copyright;
		},

		/**
		 * Helper function that prints how many seconds an operation took.
		 *
		 * @param {Date} timeStart
		 * @return {Date}
		 * @static
		 */
		printUsedTime: function( timeStart ) {
			var timeEnd = new Date(),
				timeTaken = timeEnd - timeStart;

			if ( timeTaken > 1000 )
				print( "    Time taken.....: " + ( timeTaken / 1000 ) + "seconds" );
			return timeEnd;
		},

		/**
		 * Wrap the JavaScript code into anonymous function call.
		 *
		 * @param {String} string Source code
		 * @returns {String} Wrapped source code
		 * @static
		 */
		wrapInFunction: function( string ) {
			return '(function(){' + string + '}());';
		},

		/**
		 * Pretty print JavaScript object.
		 *
		 * @param {Object} obj Object to print
		 * @param {String=} indent Current indentation
		 * @returns {String}
		 * @static
		 */
		prettyPrintObject: function( obj, indent ) {
			var result = "";
			indent = indent || "";

			for ( var property in obj ) {
				var value = obj[ property ];
				if ( typeof value === 'string' )
					value = "'" + escapeString( value ) + "'";
				else if ( typeof value === 'object' ) {
					if ( value instanceof Array )
						value = "[ " + value + " ]";
					else {
						var od = CKBuilder.utils.prettyPrintObject( value, indent + "	" );
						value = "\n" + indent + "{\n" + od + "\n" + indent + "}";
					}
				}
				result += indent + escapeProperty( property ) + " : " + value + ",\n";
			}
			return result.replace( /,\n$/, "" );
		},

		/**
		 * Print JavaScript object.
		 *
		 * @param {Object} obj Object to print
		 * @returns {String}
		 * @static
		 */
		printObject: function( obj ) {
			var result = '';

			for ( var property in obj ) {
				var value = obj[ property ];

				if ( typeof value === 'string' )
					value = "'" + value + "'";
				else if ( typeof value === 'object' ) {
					if ( value instanceof Array )
						value = "[" + value + "]";
					else {
						var od = CKBuilder.utils.printObject( value );
						value = "{" + od + "}";
					}
				}
				result += escapeString( property ) + ":" + value + ",";
			}

			return result;
		},

		/**
		 * Find file in the specified folder.
		 *
		 * @param {String} filename Name of the file to search for
		 * @param {java.io.File} dir The directory in which to search
		 * @returns {java.io.File|null}
		 * @static
		 */
		findFileInDirectory: function( filename, dir ) {
			var dirList = dir.list();

			for ( var i = 0; i < dirList.length; i++ ) {
				var f = new File( dir, dirList[ i ] );

				if ( !f.isDirectory() ) {
					if ( String( f.getName() ) === filename )
						return f;
				} else {
					var file = CKBuilder.utils.findFileInDirectory( filename, f );
					if ( file )
						return file;
				}
			}

			return null;
		},

		/**
		 * Find files in the specified folder.
		 *
		 * @param {String} filename Name of the file to search for
		 * @param {java.io.File} dir The directory in which to search
		 * @returns {Array} An array with absolute paths to files found
		 * @static
		 */
		findFilesInDirectory: function( filename, dir ) {
			var dirList = dir.list().sort(),
				files = [];

			for ( var i = 0; i < dirList.length; i++ ) {
				var f = new File( dir, dirList[ i ] );

				if ( !f.isDirectory() ) {
					if ( String( f.getName() ) === filename )
						files.push( f.getAbsolutePath() );

				} else {
					var tmp = CKBuilder.utils.findFilesInDirectory( filename, f );
					if ( tmp )
						files = files.concat( tmp );
				}
			}

			return files;
		},

		/**
		 * Overwrites the properties from obj1 with values from obj2.
		 * Adds properties from obj2 that do not exists in obj1.
		 * Does not change values of obj1 or obj2.
		 *
		 * @param {Object} obj1 The base object to be extended.
		 * @param {Object} obj2 The object from which copy values.
		 * @param {Boolean} [fullMerge=true] fullMerge Whether to include in the resulting object properties from obj2 that do not exist in obj1
		 * @returns {Object} the extended object
		 * @static
		 */
		merge: function( obj1, obj2, fullMerge ) {
			var result = {};

			for ( var i in obj2 ) {
				if ( fullMerge === false && typeof( obj1[ i ] ) === 'undefined' )
					continue;

				try {
					// Property in destination object set; update its value.
					if ( typeof( obj2[ i ] ) === 'object' )
						result[ i ] = this.merge( obj1[ i ], obj2[ i ], fullMerge ); else
						result[ i ] = obj2[ i ];
				} catch ( e ) {
					// Property in destination object not set; create it and set its value.
					result[ i ] = obj2[ i ];
				}
			}

			for ( var j in obj1 ) {
				if ( typeof obj2[ j ] !== 'undefined' )
					continue;
				// Property is missing in source object.
				result[ j ] = obj1[ j ];
			}

			return result;
		}
	};
}() );
