/*
 Copyright (c) 2012-2025, CKSource Holding sp. z o.o. All rights reserved.
 For licensing, see LICENSE.md
 */

importClass( java.io.BufferedWriter );
importClass( java.io.FileWriter );
importClass( java.io.FileOutputStream );
importClass( java.io.FileInputStream );
importPackage( com.yahoo.platform.yui.compressor );

( function() {
	var importedFiles = {};

	/**
	 * Removes comments from specified text.
	 *
	 * @param {String} text
	 * @returns {String}
	 * @member CKBuilder.css
	 * @private
	 */
	function removeComments( text ) {
		var endIndex,
			startIndex = 0,
			/**
			 * Indicating comment to hide rules from IE Mac.
			 *
			 * @property {Boolean} iemac
			 * @private
			 * @member CKBuilder.css
			 */
			iemac = false,
			preserve = false,
			sb = new StringBuffer( text );

		while ( ( startIndex = sb.indexOf( "/*", startIndex ) ) >= 0 ) {
			preserve = sb.length() > startIndex + 2 && sb.charAt( startIndex + 2 ) === '!';
			endIndex = sb.indexOf( "*/", startIndex + 2 );
			if ( endIndex < 0 ) {
				if ( !preserve )
					sb[ "delete" ]( startIndex, sb.length() );
			} else if ( endIndex >= startIndex + 2 ) {
				if ( sb.charAt( endIndex - 1 ) === '\\' ) {
					/*
					 * Looks like a comment to hide rules from IE Mac.
					 * Leave this comment, and the following one, alone...
					 */
					startIndex = endIndex + 2;
					iemac = true;
				} else if ( iemac ) {
					startIndex = endIndex + 2;
					iemac = false;
				} else if ( !preserve ) {
					try {
						/* Remove new line character if there is nothing else after a comment */
						if ( sb.charAt( endIndex + 2 ) === 13 && sb.charAt( endIndex + 3 ) === 10 )
							endIndex += 2;
						else if ( sb.charAt( endIndex + 2 ) === 10 && sb.charAt( endIndex + 3 ) === 13 )
							endIndex += 2;
						else if ( sb.charAt( endIndex + 2 ) === 13 && sb.charAt( endIndex + 3 ) === 13 )
							endIndex += 1;
						else if ( sb.charAt( endIndex + 2 ) === 10 && sb.charAt( endIndex + 3 ) === 10 )
							endIndex += 1;
					} catch ( e ) {
						/* catch StringIndexOutOfBoundsException if comment is at the end of file */
					}

					sb[ "delete" ]( startIndex, endIndex + 2 );
				} else
					startIndex = endIndex + 2;

			}
		}

		return sb.toString();
	}

	/**
	 * Returns content of source file and all CSS files included in import statements.
	 *
	 * @param {java.io.File} sourceLocation The location of CSS file
	 * @param {java.io.File=} parentLocation The location of parent CSS file, if source file was imported
	 * @returns {String}
	 * @member CKBuilder.css
	 * @private
	 */
	function processCssFile( sourceLocation, parentLocation ) {
		var out = [],
			isImported = false,
			parentPath,
			path = sourceLocation.getCanonicalPath(),
			lines = CKBuilder.io.readFile( new File( path ) ).split( /\r\n|\n|\r/ );

		if ( !parentLocation ) {
			parentLocation = sourceLocation;
			parentPath = sourceLocation.getCanonicalPath();
		} else {
			isImported = true;
			parentPath = parentLocation.getCanonicalPath();
			if ( path === parentPath )
				throw( "Invalid @import statements, file including itself: " + path );

			if ( importedFiles[ parentPath ][ path ] )
				throw( "Invalid @import statement in " + parentPath + ", file " + path + " was already imported." );

			importedFiles[ parentPath ][ path ] = true;
		}

		for ( var i = 0, length = lines.length; i < length; i++ ) {
			if ( lines[ i ].indexOf( "@import" ) === -1 )
				out.push( lines[ i ] );
			else {
				var matches = lines[ i ].match( /^\s*@import\s+url\(["'](.*?)["']\)/ );

				if ( matches[ 1 ] ) {
					var file = new File( sourceLocation.getParent(), matches[ 1 ] );
					if ( !file.exists() )
						throw( "Importing of CSS file failed, file does not exist (" + file.getPath() + ")" );
					else {
						if ( !importedFiles[ parentPath ] )
							importedFiles[ parentPath ] = {};

						out.push( processCssFile( file, parentLocation ) );
					}
				} else
					out.push( lines[ i ] );
			}
		}

		if ( isImported )
			return removeComments( out.join( "\r\n" ) );
		else
			return out.join( "\r\n" ).replace( /(\r\n){2,}/g, "\r\n" );
	}

	/**
	 * Copies files from source to the target folder and calls the CSS processor on each css file.
	 *
	 * @param {java.io.File} targetLocation Target folder
	 * @member CKBuilder.css
	 * @private
	 */
	function processCssFiles( targetLocation ) {
		var children = targetLocation.list();

		for ( var i = 0; i < children.length; i++ ) {
			var f = new File( targetLocation, children[ i ] );
			if ( f.isDirectory() )
				processCssFiles( f );
			else if ( f.getName().toLowerCase().endsWith( ".css" ) ) {
				CKBuilder.io.saveFile( f, processCssFile( f ) );
				if ( CKBuilder.options.debug )
					print( "    Saved CSS file: " + f.getAbsolutePath() );
			}
		}
	}

	/**
	 * Compress all CSS files in given directory.
	 *
	 * @param {java.io.File} targetLocation
	 * @member CKBuilder.css
	 * @private
	 */
	function compressCssFiles( targetLocation ) {
		var children = targetLocation.list();

		for ( var i = 0; i < children.length; i++ ) {
			var f = new File( targetLocation, children[ i ] );
			if ( f.isDirectory() )
				compressCssFiles( f );
			else if ( f.getName().toLowerCase().endsWith( ".css" ) ) {
				if ( CKBuilder.options.debug )
					print( "Compressing " + f.getAbsolutePath() );

				var cssContent = CKBuilder.io.readFile( f ),
					copyright = CKBuilder.tools.getCopyrightFromText( cssContent );

				cssContent = YAHOO.compressor.cssmin( cssContent, -1 );
				CKBuilder.io.saveFile( f, copyright + cssContent );
			}
		}
	}

	/**
	 * Removes imported CSS files.
	 *
	 * @param {Object} importedFiles
	 * @member CKBuilder.css
	 * @private
	 */
	function deleteImportedFiles( importedFiles ) {
		for ( var parentPath in importedFiles ) {
			for ( var path in importedFiles[ parentPath ] ) {
				if ( !importedFiles[ path ] ) {
					var file = new File( path ),
						fileName = String( file.getName() );

					if ( fileName === "dialog.css" || fileName === "editor.css" )
						continue;

					if ( CKBuilder.options.debug > 1 )
						print( "    CSS file was imported, removing: " + path );

					CKBuilder.io.deleteFile( path );
				} else {
					if ( CKBuilder.options.debug > 1 )
						print( "    CSS file was imported, but is also a root CSS file for another file: " + path );
				}
			}
		}
	}

	/**
	 * Handle css files - merge then, and determine dependencies.
	 *
	 * @class
	 */
	CKBuilder.css = {
		/**
		 * Performs optimization of CSS files in given location.
		 * Join @import files into root CSS file.
		 *
		 * @param {java.io.File} targetLocation The folder where to optimize CSS files.
		 * @static
		 */
		mergeCssFiles: function( targetLocation ) {
			if ( !targetLocation.isDirectory() )
				throw( "CSS compression failed. The target location is not a directory: " + targetLocation.getAbsolutePath() );

			importedFiles = {};
			processCssFiles( targetLocation );
			deleteImportedFiles( importedFiles );
			if ( !CKBuilder.options.leaveCssUnminified )
				compressCssFiles( targetLocation );
		}
	};
}() );
