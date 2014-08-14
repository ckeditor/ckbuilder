/*
 Copyright (c) 2012-2014, CKSource - Frederico Knabben. All rights reserved.
 For licensing, see LICENSE.md
 */

importPackage( com.ice.tar );
importPackage( java.util.zip );

importClass( java.io.BufferedReader );
importClass( java.io.BufferedWriter );
importClass( java.io.File );
importClass( java.io.FileWriter );
importClass( java.io.FileOutputStream );
importClass( java.io.FileInputStream );
importClass( java.io.BufferedInputStream );
importClass( java.io.BufferedOutputStream );
importClass( java.lang.StringBuffer );
importClass( java.io.InputStreamReader );
importClass( java.io.FileOutputStream );
importClass( java.io.OutputStreamWriter );
importClass( java.util.zip.ZipOutputStream );
importClass( java.util.zip.ZipEntry );
importClass( java.util.zip.GZIPInputStream );

( function() {

	/**
	 * Creates an archive from specified path.
	 *
	 * @param {String} sourceLocation Path Source path
	 * @param {String} startLocation Path Source path
	 * @param {java.io.OutputStream} outStream Output stream to which the archive is created
	 * @param {String} compressMethod The type of the archive (tar.gz|zip)
	 * @param {String} rootDir The root folder of the archive.
	 * @member CKBuilder.io
	 */
	function compressDirectory( sourceLocation, startLocation, outStream, compressMethod, rootDir ) {
		if ( CKBuilder.options.debug )
			print( "    " + compressMethod + ": " + sourceLocation.getAbsolutePath() );

		if ( !rootDir )
			rootDir = "";

		try {
			var dirList = sourceLocation.list(),
				readBuffer = new Packages.java.lang.reflect.Array.newInstance( java.lang.Byte.TYPE, 2056 ),
				bytesIn = 0,
				anEntry,
				fis;

			for ( var i = 0; i < dirList.length; i++ ) {
				var f = new File( sourceLocation, dirList[ i ] );

				if ( f.isDirectory() ) {
					compressDirectory( f, startLocation, outStream, compressMethod, rootDir );
					continue;
				}

				fis = new FileInputStream( f );

				switch ( compressMethod ) {
					case 'tar.gz' :
						anEntry = new TarEntry( f.getCanonicalPath().replace( startLocation.getCanonicalPath(), rootDir ).replace( "\\", "/" ) );
						break;
					case 'zip' :
						anEntry = new ZipEntry( f.getCanonicalPath().replace( startLocation.getCanonicalPath(), rootDir ).replace( "\\", "/" ) );
						break;
					default:
						throw "Unknown compression method: " + compressMethod;
				}

				outStream.putNextEntry( anEntry );

				while ( ( bytesIn = fis.read( readBuffer ) ) !== -1 ) {
					outStream.write( readBuffer, 0, bytesIn );
				}
				outStream.closeEntry();

				fis.close();
			}
		} catch ( e ) {
			throw "An error occurred during (" + compressMethod + ") compression of " + sourceLocation.getAbsolutePath() + ": " + e;
		}
	}

	/**
	 * Copy file from source to target location.
	 *
	 * @param {String} sourceLocation Source folder
	 * @param {String} targetLocation Target folder
	 * @member CKBuilder.io
	 */
	function copyFile( sourceLocation, targetLocation ) {
		try {
			var inStream = new FileInputStream( sourceLocation ),
				outStream = new FileOutputStream( targetLocation );

			if ( CKBuilder.options.debug > 1 )
				print( "Copying file: " + sourceLocation.getCanonicalPath() );

			var len,
				buf = new Packages.java.lang.reflect.Array.newInstance( java.lang.Byte.TYPE, 1024 );

			while ( ( len = inStream.read( buf ) ) !== -1 )
				outStream.write( buf, 0, len );

			inStream.close();
			outStream.close();

			if ( CKBuilder.options.debug > 1 )
				print( "File copied: " + targetLocation.getCanonicalPath() );
		} catch ( e ) {
			throw "Cannot copy file:\n Source: " + sourceLocation.getCanonicalPath() + "\n Destination : " + targetLocation.getCanonicalPath() + "\n" + e.message;
		}
	}

	/**
	 * Input output actions. Copy, delete files and directories. Save them, show directory info.
	 *
	 * @class
	 */
	CKBuilder.io = {
		/**
		 * This method is preventable depending on callback value.
		 * When callback returns false value then nothing changes.
		 *
		 * @static
		 * @param {java.io.File} sourceLocation
		 * @param {java.io.File} targetLocation
		 * @param {function(java.io.File, java.io.File):Boolean} callback
		 */
		copyFile: function( sourceLocation, targetLocation, callback ) {
			if ( callback ) {
				if ( !callback.call( this, sourceLocation, targetLocation ) )
					return;
			}
			copyFile( sourceLocation, targetLocation );
		},

		/**
		 * Unzips a file recursively.
		 *
		 * @param {String} zipFile Path to the source file
		 * @param {String|java.io.File} newPath Path to the destination folder
		 * @static
		 */
		unzipFile: function( zipFile, newPath ) {
			try {
				var BUFFER = 2048,
					file = new File( zipFile ),
					zip = new ZipFile( file );

				newPath = newPath || zipFile.substring( 0, zipFile.length() - 4 );
				new File( newPath ).mkdir();
				var zipFileEntries = zip.entries();

				// Process each entry
				while ( zipFileEntries.hasMoreElements() ) {
					// grab a zip file entry
					var entry = zipFileEntries.nextElement(),
						currentEntry = entry.getName(),
						destFile = new File( newPath, currentEntry ),
						destinationParent = destFile.getParentFile();

					// create the parent directory structure if needed
					destinationParent.mkdirs();

					if ( !entry.isDirectory() ) {
						var is = new BufferedInputStream( zip.getInputStream( entry ) ),

						// establish buffer for writing file
							data = new Packages.java.lang.reflect.Array.newInstance( java.lang.Byte.TYPE, BUFFER ),

						// write the current file to disk
							fos = new FileOutputStream( destFile ),
							dest = new BufferedOutputStream( fos, BUFFER );

						// read and write until last byte is encountered
						var currentByte;
						while ( ( currentByte = is.read( data, 0, BUFFER ) ) !== -1 ) {
							dest.write( data, 0, currentByte );
						}
						dest.flush();
						dest.close();
						is.close();
					}

					if ( currentEntry.endsWith( ".zip" ) ) {
						// found a zip file, try to open
						CKBuilder.io.unzipFile( destFile.getAbsolutePath() );
					}
				}
			} catch ( e ) {
				throw "Unable to extract archive file:\n Source: " + zipFile + "\n" + e.message;
			}
		},

		/**
		 * Deletes a directory.
		 *
		 * @param {java.io.File} path Directory to delete
		 * @static
		 */
		deleteDirectory: function( path ) {
			var dir = new File( path );

			if ( !dir.exists() )
				return true;

			if ( dir.isDirectory() ) {
				var children = dir.list();
				for ( var i = 0; i < children.length; i++ ) {
					if ( !this.deleteDirectory( new File( dir, children[ i ] ) ) )
						return false;
				}
			}

			return dir['delete']();
		},

		/**
		 * Deletes a file.
		 *
		 * @param {java.io.File} path File to delete
		 * @static
		 */
		deleteFile: function( path ) {
			var f = new File( path );

			if ( !f.exists() )
				return true;

			if ( !f.canWrite() )
				throw "Cannot delete file: " + f.getAbsolutePath();

			return f[ "delete" ]();
		},

		/**
		 * Saves a file.
		 *
		 * @param {java.io.File} file Path to the file
		 * @param {String} text Content of a file
		 * @param {Boolean} [includeBom=false] includeBom Whether to include BOM character
		 * @static
		 */
		saveFile: function( file, text, includeBom ) {
			includeBom = ( includeBom === true );

			try {
				var stream = new BufferedWriter( new OutputStreamWriter( new FileOutputStream( file ), "UTF-8" ) );
				if ( includeBom )
					stream.write( 65279 );

				stream.write( text );
				stream.flush();
				stream.close();
			} catch ( e ) {
				throw "Cannot save file:\n Path: " + file.getCanonicalPath() + "\n Exception details: " + e.message;
			}
		},

		/**
		 * Copies file/folder, with the possibility of ignoring specific paths.
		 *
		 * @param {java.io.File} sourceLocation Source location
		 * @param {java.io.File} targetLocation Target location
		 * @param {function(java.io.File, java.io.File): number} callbackBefore (Optional)
		 *   The possible returned values are:
		 *
		 *   -1 Do not copy file, do not call callbackAfter.
		 *
		 *   0 Copy file, call callbackAfter.
		 *
		 *   1 File was already copied, call callbackAfter.
		 * @param {Function} callbackAfter (Optional) Callback function executed after the file is copied.
		 * @static
		 */
		copy: function( sourceLocation, targetLocation, callbackBefore, callbackAfter ) {
			if ( callbackBefore ) {
				var code = callbackBefore.call( this, sourceLocation, targetLocation );
				if ( code === -1 )
					return;
				if ( callbackAfter )
					callbackAfter.call( this, targetLocation );
				if ( code === 1 )
					return;
			}

			if ( sourceLocation.isDirectory() ) {
				if ( !targetLocation.exists() )
					targetLocation.mkdir();

				var children = sourceLocation.list();
				for ( var i = 0; i < children.length; i++ ) {
					if ( String( children[ i ] ) === ".svn" || String( children[ i ] ) === "CVS" || String( children[ i ] ) === ".git" )
						continue;

					this.copy( new File( sourceLocation, children[ i ] ), new File( targetLocation, children[ i ] ), callbackBefore, callbackAfter );
				}

				if ( !targetLocation.list().length )
					targetLocation[ 'delete' ]();
			} else {
				copyFile( sourceLocation, targetLocation );
				if ( callbackAfter )
					callbackAfter.call( this, targetLocation );
			}
		},

		/**
		 * Creates a zip archive from specified location.
		 *
		 * @param {java.io.File} sourceLocation The location of the folder to compress.
		 * @param {java.io.File} startLocation Starting from this location the folder structure will be replicated.
		 * The startLocation should be a subfolder of sourceLocation.
		 * @param {java.io.File} targetFile The location of the target zip file.
		 * @param {String} rootDir The name of root folder in which the rest of files will be placed
		 * @static
		 */
		zipDirectory: function( sourceLocation, startLocation, targetFile, rootDir ) {
			var outStream = new ZipOutputStream( new FileOutputStream( targetFile ) );
			compressDirectory( sourceLocation, startLocation, outStream, 'zip', rootDir );
			outStream.close();
		},

		/**
		 * Creates a tar.gz archive from specified location.
		 *
		 * @param {java.io.File} sourceLocation The location of the folder to compress.
		 * @param {java.io.File} startLocation Starting from this location the folder structure will be replicated.
		 * The startLocation should be a subfolder of sourceLocation.
		 * @param {java.io.File} targetFile The location of the target tar.gz file.
		 * @param {String} rootDir The name of root folder in which the rest of files will be placed
		 * @static
		 */
		targzDirectory: function( sourceLocation, startLocation, targetFile, rootDir ) {
			var outStream = new TarGzOutputStream( new FileOutputStream( targetFile ) );
			compressDirectory( sourceLocation, startLocation, outStream, 'tar.gz', rootDir );
			outStream.close();
		},

		/**
		 * Sets or removes the BOM character at the beginning of the file.
		 *
		 * @param {String} file Path to the file
		 * @param {Boolean} includeUtf8Bom Boolean value indicating whether the BOM character should exist
		 * @static
		 */
		setByteOrderMark: function( file, includeUtf8Bom ) {
			var buffer = new StringBuffer(),
				chars = new Packages.java.lang.reflect.Array.newInstance( java.lang.Character.TYPE, 32 ),
				inStream;

			try {
				inStream = new InputStreamReader( new FileInputStream( file ), 'UTF-8' );
			} catch ( e ) {
				throw 'An I/O error occurred while opening the ' + file + ' file.';
			}

			try {
				var count = inStream.read( chars, 0, 32 );

				if ( count <= 0 )
					return;

				buffer.append( chars, 0, count );

				/* BOM is at the beginning of file */
				if ( buffer.length() && buffer.charAt( 0 ) === 65279 ) {
					if ( !includeUtf8Bom ) {
						if ( CKBuilder.options.debug )
							print( 'Removing BOM from ' + file.getCanonicalPath() );
						this.saveFile( file, this.readFile( file ) );
					}
				} else {
					if ( includeUtf8Bom ) {
						if ( CKBuilder.options.debug )
							print( 'Adding BOM to ' + file.getCanonicalPath() );
						this.saveFile( file, this.readFile( file ), true );
					}
				}
			} catch ( e ) {
				throw 'An I/O error occurred while reading the ' + file.getCanonicalPath() + ' file.';
			} finally {
				inStream.close();
			}
		},

		/**
		 * Reads files from given array and returns joined file contents.
		 *
		 * @param {java.io.File[]} files The list of files to read.
		 * @returns {String}
		 * @static
		 */
		readFiles: function( files, separator ) {
			var i,
				out = [];

			for ( i = 0; i < files.length; i++ ) {
				out.push( this.readFile( files[ i ] ) );
			}

			return out.join( separator ? separator : "" );
		},

		/**
		 * Reads file and returns file contents without initial UTF-8 Byte Order.
		 *
		 * Mark
		 * @param {java.io.File} file
		 * @returns {String}
		 * @static
		 */
		readFile: function( file ) {
			var buffer = new StringBuffer(),
				chars = new Packages.java.lang.reflect.Array.newInstance( java.lang.Character.TYPE, 8192 ),
				count,
				fis,
				inStream;

			if ( !file.exists() )
				throw 'File ' + file + ' does not exist.';

			try {
				fis = new FileInputStream( file );
				inStream = new InputStreamReader( fis, 'UTF-8' );
			} catch ( e ) {
				throw 'An I/O error occurred while opening the ' + file + ' file.';
			}

			try {
				while ( ( count = inStream.read( chars, 0, 8192 ) ) !== -1 ) {
					if ( count > 0 )
						buffer.append( chars, 0, count );
				}
			} catch ( e ) {
				throw 'An I/O error occurred while reading the ' + file.getCanonicalPath() + ' file.';
			} finally {
				fis.close();
				inStream.close();
			}

			/* http://bugs.sun.com/bugdatabase/view_bug.do?bug_id=4508058 */
			if ( buffer.length() && buffer.charAt( 0 ) === 65279 )
				buffer.deleteCharAt( 0 );

			return String( buffer.toString() );
		},

		/**
		 * Reads file from within .jar file and returns file contents without initial UTF-8 Byte Order Mark.
		 *
		 * @param {String} path Path to the file
		 * @returns {String}
		 * @static
		 */
		readFileFromJar: function( path ) {
			var buffer = new StringBuffer(),
				chars = new Packages.java.lang.reflect.Array.newInstance( java.lang.Character.TYPE, 8192 ),
				fis,
				inStream;

			try {
				fis = java.lang.Class.forName( "ckbuilder.ckbuilder" ).getClassLoader().getResourceAsStream( path );
				inStream = new InputStreamReader( fis, "UTF-8" );
			} catch ( e ) {
				throw 'An I/O error occurred while opening the ' + path + ' file.';
			}

			try {
				var count;
				while ( ( count = inStream.read( chars, 0, 8192 ) ) !== -1 ) {
					if ( count > 0 )
						buffer.append( chars, 0, count );
				}
			} catch ( e ) {
				throw 'An I/O error occurred while reading the ' + path + ' file.';
			} finally {
				fis.close();
				inStream.close();
			}

			/* http://bugs.sun.com/bugdatabase/view_bug.do?bug_id=4508058 */
			if ( buffer.length() && buffer.charAt( 0 ) === 65279 )
				buffer.deleteCharAt( 0 );

			return String( buffer.toString() );
		},

		/**
		 * Returns size and number of files in the specified directory.
		 *
		 * @param {String} path Path to the folder
		 * @returns {{files: Number, size: Number}}
		 * @static
		 */
		getDirectoryInfo: function( path ) {
			var result = {
					files: 0,
					size: 0
				};

			if ( !path.exists() )
				return result;

			var files = path.listFiles();

			if ( !files )
				return result;

			var path_iterator = ( java.util.Arrays.asList( files ) ).iterator();

			while ( path_iterator.hasNext() ) {
				var current_file = path_iterator.next();
				if ( current_file.isFile() ) {
					result.size += current_file.length();
					result.files++;
				} else {
					var info = this.getDirectoryInfo( current_file );
					result.size += info.size;
					result.files += info.files;
				}
			}

			return result;
		},

		/**
		 * Returns the (lower-cased) extension of the file from the specified path (e.g. "txt").
		 *
		 * @param {String} fileName The file name
		 * @returns {String}
		 * @static
		 */
		getExtension: function( fileName ) {
			var pos = fileName.lastIndexOf( "." );

			if ( pos === -1 )
				return "";
			else
				return String( fileName.substring( pos + 1 ).toLowerCase() );
		},

		/**
		 * Check element wether its a zip file. If yes, then extract it into temporary directory.
		 *
		 * @param {java.io.File|String} element Directory or zip file.
		 * @returns {java.io.File} Directory on which work will be done.
		 */
		prepareWorkingDirectoryIfNeeded: function( element ) {
			var elementLocation = new File( element ),
				tmpDir,
				workingDir,
				isTemporary = false;
			if ( !elementLocation.isDirectory() ) { //is not a directory
				if ( CKBuilder.io.getExtension( element ) !== "zip" ) // is not a zip
					throw( "The element file is not a zip file: " + elementLocation.getCanonicalPath() );

				// temporary directory
				tmpDir = new File( System.getProperty( "java.io.tmpdir" ), ".tmp" + Math.floor( ( Math.random() * 1000000 ) + 1 ) );
				// cleaning up dir
				if ( tmpDir.exists() && !CKBuilder.io.deleteDirectory( tmpDir ) )
					throw( "Unable to delete tmp dir: " + tmpDir.getCanonicalPath() );

				try {
					tmpDir.mkdirs(); // creating temporary directory
				} catch ( e ) {
					throw( "Unable to create temp directory: " + tmpDir.getAbsolutePath() + "\nError: " + e.getMessage() );
				}

				// unzip into temp directory
				CKBuilder.io.unzipFile( element, tmpDir );
				isTemporary = true;
				workingDir = tmpDir;
			} else
				workingDir = elementLocation;

			return {
				directory: workingDir,
				cleanUp: function () {
					if ( isTemporary && workingDir.exists() )
						CKBuilder.io.deleteDirectory( workingDir );
				}
			};
		}

	};
}() );
