/*
 Copyright (c) 2012-2023, CKSource Holding sp. z o.o. All rights reserved.
 For licensing, see LICENSE.md
 */

( function() {
	var regexLib = {
		skinName: Pattern.compile( 'CKEDITOR.skin.name\\s*\\=\\s*([\'"])([a-zA-Z0-9-_]+)\\1', Pattern.DOTALL )
	};

	/**
	 * Finds the skin name in give file (skin.js).
	 *
	 * @param {java.io.File} file
	 * @returns {String|null}
	 * @private
	 * @member CKBuilder.skin
	 */
	function findSkinNameInSkinDefinition( file ) {
		var code = CKBuilder.io.readFile( file );

		code = CKBuilder.javascript.removeWhiteSpace( code, file.getParentFile().getName() + "/skin.js" );
		var matcher = regexLib.skinName.matcher( code ),
			skinName;
		if ( matcher.find() )
			skinName = matcher.group( 2 );

		return skinName === null ? null : String( skinName );
	}

	/**
	 * Finds the correct skin.js in given directory.
	 *
	 * @param {java.io.File} dir
	 * @returns {Boolean|String} Path to the right skin.js file or false.
	 * @member CKBuilder.skin
	 */
	function findCorrectSkinFile( dir ) {
		var skinFiles = CKBuilder.utils.findFilesInDirectory( 'skin.js', dir );

		if ( !skinFiles.length )
			return false;
		if ( skinFiles.length === 1 )
			return skinFiles[ 0 ];
		// let's exclude skin.js located in the _source folder
		if ( skinFiles.length > 1 ) {
			var tmpArray = [];
			for ( var i = 0; i < skinFiles.length; i++ ) {
				if ( !skinFiles[ i ].match( /(\/|\\)_source\1/ ) )
					tmpArray.push( skinFiles[ i ] );

			}
			if ( !tmpArray.length )
				return false;

			else if ( tmpArray.length > 1 )
				return false;

			else
				return tmpArray[ 0 ];

		}
	}

	/**
	 * Handle skins. Validate them and preprocess.
	 *
	 * @class
	 */
	CKBuilder.skin = {
		/**
		 * Checks specified skin for errors.
		 *
		 * @param {String} skin
		 * @param {Object} options
		 * @param {String=} options.skinName
		 * @param {Boolean=} options.exitOnError
		 * @static
		 */
		verify: function( skin, options ) {
			var skinPath,
				errors = '',
				workingDirObj = CKBuilder.io.prepareWorkingDirectoryIfNeeded( skin ),
				workingDir = workingDirObj.directory;

			if ( CKBuilder.options.debug > 1 )
				print( "Validating JS files" );

			errors += CKBuilder.tools.validateJavaScriptFiles( workingDir );
			errors += CKBuilder.tools.validateJavaScriptFilesUsingCC( workingDir );

			if ( !errors ) {
				skinPath = findCorrectSkinFile( workingDir );
				if ( !skinPath ) {
					// check why findCorrectSkinFile() returned false
					var skinPaths = CKBuilder.utils.findFilesInDirectory( 'skin.js', workingDir );
					if ( skinPaths.length > 1 ) {
						var tmpArray = [],
							workingDirPath = workingDir.getAbsolutePath();
						for ( var i = 0; i < skinPaths.length; i++ ) {
							skinPaths[ i ] = String( skinPaths[ i ].replace( workingDirPath, '' ) ).replace( /\\/g, '/' );
							if ( !skinPaths[ i ].match( /(\/|\\)_source\1/ ) )
								tmpArray.push( skinPaths[ i ] );
						}
						if ( !tmpArray.length )
							errors += "Found more than one skin.js:\n" + skinPaths.join( "\n" ) + "\n";
						else if ( tmpArray.length > 1 )
							errors += "Found more than one skin.js:\n" + skinPaths.join( "\n" ) + "\n";
					} else
						errors += "Unable to locate skin.js";
				} else {
					if ( options && options.skinName ) {
						var skinName = findSkinNameInSkinDefinition( new File( skinPath ) );
						if ( skinName && skinName !== options.skinName )
							errors += "The skin name defined inside skin.js (" + skinName + ") does not match the expected skin name (" + options.skinName + ")" + "\n";
					}
				}
			}

			if ( skinPath ) {
				var skinFile = new File( skinPath ),
					iconsFolder = new File( skinFile.getParentFile(), 'icons' );
				// Skin is not obliged to provide icons
				if ( iconsFolder.exists() && !iconsFolder.isDirectory() )
					errors += "There is an \"icons\" file, but a folder with this name is expected." + "\n";
			}

			workingDirObj.cleanUp();

			if ( errors && options && options.exitOnError )
				System.exit( 500 );

			return errors ? errors : "OK";
		},

		/**
		 * Builds the specified skin and saves in an optimized form in the target folder.
		 *
		 * @param {String} skin Path to the skin
		 * @param {String} dstDir Path to the destination folder
		 * @static
		 */
		build: function( skin, dstDir ) {
			var time = new Date(),
				startTime = time,
				skinLocation = new File( dstDir );

			CKBuilder.tools.prepareTargetFolder( skinLocation );

			print( "Building skin: " + skin );
			this.preprocess( skin, dstDir, true );

			var iconsDir = new File( skinLocation, "icons" );
			if ( iconsDir.exists )
				CKBuilder.io.deleteDirectory( File( skinLocation, "icons" ) );

			CKBuilder.utils.printUsedTime( startTime );
		},

		/**
		 * Preprocesses the specified skin and saves in an optimized form in the target folder.
		 *
		 * @param {String} skin Path to the skin
		 * @param {String} dstDir Path to the destination folder
		 * @param {Boolean=} generateSprite Whether to generate strip image from available icons
		 * @static
		 */
		preprocess: function( skin, dstDir, generateSprite ) {
			var workingDirObj = CKBuilder.io.prepareWorkingDirectoryIfNeeded( skin ),
				workingDir = workingDirObj.directory;

			if ( !this.verify( workingDir, { exitOnError: false } ) ) {
				workingDirObj.cleanUp();
				throw( "The skin is invalid" );
			}

			var skinPath = findCorrectSkinFile( workingDir );
			if ( !skinPath ) {
				workingDirObj.cleanUp();
				throw( "The skin file (skin.js) was not found in " + workingDir.getCanonicalPath() );
			}

			var skinFile = new File( skinPath ),
				name = findSkinNameInSkinDefinition( skinFile );
			if ( !name ) {
				workingDirObj.cleanUp();
				throw( "Unable to find skin name" );
			}
			var targetFolder = new File( dstDir );

			try {
				targetFolder.mkdirs();
			} catch ( e ) {
				throw( "Unable to create target directory: " + targetFolder.getAbsolutePath() + "\nError: " + e.getMessage() );
			}

			var flags = {},
				rootFolder = skinFile.getParentFile();
			CKBuilder.io.copy( rootFolder, targetFolder, function( sourceLocation, targetLocation ) {
					if ( sourceLocation.isFile() ) {
						var copied = CKBuilder.tools.fixLineEndings( sourceLocation, targetLocation );
						if ( copied ) {
							// Do not process any directives
							if ( CKBuilder.options.leaveJsUnminified )
								return 1;

							var flag = CKBuilder.tools.processDirectives( targetLocation, null, true );
							if ( flag.LEAVE_UNMINIFIED )
								flags[ targetLocation.getAbsolutePath() ] = flag;

							return 1;
						}
					}
					return 0;
				}, function( targetLocation ) {
					if ( CKBuilder.options.leaveJsUnminified )
						return;

					if ( CKBuilder.io.getExtension( targetLocation.getName() ) === 'js' ) {
						var targetPath = targetLocation.getAbsolutePath();
						if ( flags[ targetPath ] && flags[ targetPath ].LEAVE_UNMINIFIED ) {
							if ( CKBuilder.options.debug > 1 )
								print( "Leaving unminified: " + targetLocation.getPath() );

							CKBuilder.io.saveFile( targetLocation, CKBuilder.tools.removeLicenseInstruction( CKBuilder.io.readFile( targetLocation ) ), true );
							return;
						}

						if ( CKBuilder.options.debug )
							print( "Minifying: " + targetLocation.getPath() );

						CKBuilder.javascript.minify( targetLocation );
					}
				} );

			if ( generateSprite ) {
				var skinIcons = CKBuilder.image.findIcons( targetFolder ),
					files = [],
					outputFile = new File( targetFolder, "icons.png" ),
					outputCssFile = new File( targetFolder, "editor.css" ),
					noIcons = true,
					buttonName;
				// Sorted by plugin name
				for ( buttonName in skinIcons ) {
					files.push( new File( skinIcons[ buttonName ] ) );
					noIcons = false;
				}

				if ( !noIcons )
					CKBuilder.image.createSprite( files, outputFile, outputCssFile );

				// HiDPI support, set some variables again
				skinIcons = CKBuilder.image.findIcons( targetFolder, true );
				files = [];
				outputFile = new File( targetFolder, "icons_hidpi.png" );
				noIcons = true;

				// Sorted by plugin name
				for ( buttonName in skinIcons ) {
					files.push( new File( skinIcons[ buttonName ] ) );
					noIcons = false;
				}

				if ( !noIcons )
					CKBuilder.image.createSprite( files, outputFile, outputCssFile, true );
			}

			if ( !CKBuilder.options.leaveCssUnminified )
				CKBuilder.css.mergeCssFiles( targetFolder );

			workingDirObj.cleanUp();
		}
	};

}() );
