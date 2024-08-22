/*
 Copyright (c) 2012-2024, CKSource Holding sp. z o.o. All rights reserved.
 For licensing, see LICENSE.md
 */

importClass( java.io.File );
importClass( javax.imageio.ImageIO );
importClass( java.awt.image.BufferedImage );

( function() {
	/**
	 * Iterating through files in directory and when file has one of the following
	 * png, jpg, gif extension then file absolute path is set as a value and
	 * file name is set as a key
	 *
	 * @param {java.io.File} directory
	 * @param {Object=} paths
	 * @private
	 * @returns {Object}
	 * @member CKBuilder.image
	 */
	function getAbsolutePathForImageFiles( directory, paths ) {
		paths = paths || {};

		var files = directory.list().sort();
		for ( var i = 0; i < files.length; i++ ) {
			var f = new File( directory, files[ i ] );

			if ( f.isFile() ) {
				var extension = CKBuilder.io.getExtension( files[ i ] );
				if ( extension === "png" || extension === "jpg" || extension === "gif" ) {
					var fileName = files[ i ].slice( 0, files[ i ].indexOf( "." ) );
					paths[ String( fileName ) ] = String( f.getAbsolutePath() );
				}
			}
		}

		return paths;
	}

	/**
	 * Responsible for generating sprite with icons.
	 *
	 * @class
	 */
	CKBuilder.image = {
		/**
		 * @param {java.io.File} sourceLocation
		 * @param {Boolean} hidpi
		 * @static
		 */
		findIcons: function( sourceLocation, hidpi ) {
			if ( !sourceLocation || !sourceLocation.exists() )
				return {};

			var result = {},
				children = sourceLocation.list().sort();

			for ( var i = 0; i < children.length; i++ ) {
				var child = new File( sourceLocation, children[ i ] );

				// Handle only directories
				if ( !child.isDirectory() )
					continue;

				if ( String( children[ i ] ) === "icons" ) {
					getAbsolutePathForImageFiles( child, result );

					// When the "hidpi" flag is set, overwrite 16px icons with hidpi versions.
					// Searching above for 16px icons still makes sense, because a plugin may not
					// provide hidpi icons at all.
					if ( hidpi ) {
						var hidpiFolder = new File( child, 'hidpi' );
						if ( !hidpiFolder.isDirectory() )
							continue;

						getAbsolutePathForImageFiles( hidpiFolder, result );
					}
				// When directory name is not "icons", going deeper.
				} else {
					var icons = CKBuilder.image.findIcons( child, hidpi );
					result = CKBuilder.utils.merge( result, icons );
				}
			}

			return result;
		},

		/**
		 * Creates a complete sprite, based on passed plugins and skin location.
		 *
		 * @param {java.io.File} pluginsLocation
		 * @param {java.io.File} skinLocation
		 * @param {java.io.File} outputFile
		 * @param {java.io.File} outputCssFile
		 * @param {String[]} pluginNamesSorted
		 * @param {Boolean} [hidpi=false]
		 * @returns {*}
		 * @static
		 */
		createFullSprite: function( pluginsLocation, skinLocation, outputFile, outputCssFile, pluginNamesSorted, hidpi ) {
			var pluginIcons = {};

			// Include all available icons
			if ( CKBuilder.options.all )
				pluginIcons = CKBuilder.image.findIcons( pluginsLocation, hidpi );

			// Include in strip image only icons provided by plugins included in core
			else {
				for ( var i = 0; i < pluginNamesSorted.length; i++ ) {
					var pluginName = pluginNamesSorted[ i ],
						pluginFolder = new File( pluginsLocation, pluginName );

					if ( pluginFolder.exists() && pluginFolder.isDirectory() ) {
						var result = CKBuilder.image.findIcons( pluginFolder, hidpi );
						pluginIcons = CKBuilder.utils.merge( result, pluginIcons, true );
					}
				}
			}
			var skinIcons = CKBuilder.image.findIcons( skinLocation, hidpi ),
				icons = CKBuilder.utils.merge( pluginIcons, skinIcons, false );

			if ( CKBuilder.options.debug > 1 ) {
				print( "Generating sprite image" );
				print( "\n== Plugin names ==\n" );
				print( pluginNamesSorted.join( "," ) );
				print( "\n== Plugin icons ==\n" );
				print( CKBuilder.utils.prettyPrintObject( pluginIcons ) );
				print( "\n== Skin icons ==\n" );
				print( CKBuilder.utils.prettyPrintObject( skinIcons ) );
				print( "\n== Used icons ==\n" );
				print( CKBuilder.utils.prettyPrintObject( icons ) );
			}

			var files = Object.keys( pluginIcons )// Map to paths array.
				.map( function( buttonName ) {
					return icons[ buttonName ];
				} )// Sort in paths order, so icon-rtl.png will be before icon.png.
				.sort()// Map to files array.
				.map( function( iconPath ) {
					return new File( iconPath );
				} );

			return this.createSprite( files, outputFile, outputCssFile, hidpi );
		},

		/**
		 * Generate sprite file from given images.
		 *
		 * @param {Array} files An array with image files ({java.io.File})
		 * @param {Boolean} outputFile Where to save sprite image
		 * @param {java.io.File} outputCssFile Where to save CSS information about buttons
		 * @param {Boolean} hidpi Whether to create hidpi strip image
		 * @static
		 */
		createSprite: function( files, outputFile, outputCssFile, hidpi ) {
			if ( !files.length ) {
				if ( CKBuilder.options.debug )
					print( "No images given, sprite file will not be created." );
				return '';
			}

			var totalHeight = 0,
				iconsOffset = [],
				iconsHasRtl = {},
				minimumIconSpace = hidpi ? 16 : 8,
				cssRules = [];

			if ( outputCssFile && outputCssFile.exists() )
				cssRules.push( CKBuilder.io.readFile( outputCssFile ) || "" );

			// Read images
			var i,

				// each image is an object with keys:
				// {Boolean} isHidpi
				// {java.awt.image.BufferedImage} bufferedImage
				// {String} fileName
				images = [],

				// while iterating through images there is determined highest icon width and height
				maxIconWidth = 0,
				maxIconHeight = 0;

			for ( i = 0; i < files.length; i++ ) {
				images[ i ] = {
					isHidpi: String( files[ i ].getAbsolutePath() ).replace( /\\/g, '/' ).indexOf( "/icons/hidpi/" ) !== -1,
					bufferedImage: ImageIO.read( files[ i ] ),
					fileName: files[ i ].getName()
				};
				images[ i ].width = images[ i ].bufferedImage.getWidth();
				images[ i ].height = images[ i ].bufferedImage.getHeight();

				// Humm huge images? That's probably not an icon, ignore that file.
				if ( images[ i ].height > 100 || images[ i ].width > 100 ) {
					print( "WARNING: cowardly refused to add an image to a sprite because it's too big: " + files[ i ].getAbsolutePath() );
					images[ i ] = null;
					continue;
				}
				maxIconHeight = Math.max( images[ i ].height, maxIconHeight );
				maxIconWidth = Math.max( images[ i ].width, maxIconWidth );
			}
			// Get rid of images that turned out to be too big
			images = images.filter( function( image ) {
				return !!image;
			} );

			if ( maxIconWidth <= 0 )
				throw( 'Error while generating sprite image: invalid width (' + maxIconWidth + ')' );

			var cssHidpiPrefix = hidpi ? ".cke_hidpi" : "",
				iconsStrip = ( hidpi ? "icons_hidpi.png" : "icons.png" ) + "?t=" + CKBuilder.options.timestamp;

			for ( i = 0; i < images.length; i++ ) {
				var buttonName = images[ i ].fileName.match( /.*?(?=\.|-rtl)/ ),
					buttonSelector = ".cke_button__" + buttonName + '_icon',
					ypos,
					backgroundSize,
					cssBackgroundSize;

				if ( hidpi ) {
					if ( images[ i ].isHidpi ) {
						backgroundSize = Math.round( maxIconWidth / 2 ) + "px";
						cssBackgroundSize = "background-size: " + backgroundSize + " !important;";

						// This is the default value in CKEditor, so it does not make sense to specify it again
						if ( backgroundSize === '16px' )
							backgroundSize = "";
						ypos = totalHeight / 2;
					} else {
						backgroundSize = "auto";
						cssBackgroundSize = "";
						ypos = totalHeight;
					}
				} else {
					// The icons folder in 3rd party plugins may contain surprises
					// As a result, the strip image may have unpredictable width
					// https://github.com/WebSpellChecker/ckeditor-plugin-wsc/issues/6
					// Here, with wsc plugin, the strip image had 108px width, so default background-size:16px was invalid
					// We need to always reset it to auto
					backgroundSize = "auto";
					cssBackgroundSize = "";
					ypos = totalHeight;
				}

				if ( images[ i ].fileName.indexOf( "-rtl" ) !== -1 ) {
					iconsHasRtl[ buttonName ] = 1;
					cssRules.push( ".cke_rtl" + cssHidpiPrefix + " " + buttonSelector + "," + // The "cke_mixed_dir_content" env class is to increase the specificity,
							// with RTL button in LTR editor.
							( cssHidpiPrefix ? " " : "" ) + cssHidpiPrefix + " .cke_mixed_dir_content .cke_rtl " + buttonSelector + " {background: url(" + iconsStrip + ") no-repeat 0 -" + ypos + "px !important;" + cssBackgroundSize + "}" );
					iconsOffset.push( buttonName + '-rtl' );
					iconsOffset.push( ypos );
					iconsOffset.push( backgroundSize );
				} else {
					var envSelector = ( buttonName in iconsHasRtl ? ".cke_ltr" : "" ) + cssHidpiPrefix;
					if ( envSelector )
						envSelector = envSelector + " ";
					if ( hidpi && buttonName in iconsHasRtl )
						cssRules.push( ".cke_hidpi .cke_ltr " + buttonSelector + "," );

					cssRules.push( envSelector + buttonSelector + " {background: url(" + iconsStrip + ") no-repeat 0 -" + ypos + "px !important;" + cssBackgroundSize + "}" );
					iconsOffset.push( buttonName );
					iconsOffset.push( ypos );
					iconsOffset.push( backgroundSize );
				}
				totalHeight = totalHeight + maxIconHeight + minimumIconSpace;
			}

			if ( totalHeight <= 0 )
				throw( 'Error while generating sprite image: invalid height (' + totalHeight + ')' );

			if ( CKBuilder.options.debug )
				System.out.format( "Sprites generator: %s images. Total height: %spx, width: %spx%n", images.length, totalHeight, maxIconWidth );

			// Create the actual sprite
			var sprite = new BufferedImage( maxIconWidth, totalHeight, BufferedImage.TYPE_INT_ARGB ),
				currentY = 0,
				g = sprite.getGraphics();

			for ( i = 0; i < images.length; i++ ) {
				// image = BufferedImage object
				g.drawImage( images[ i ].bufferedImage, 0, currentY, null );
				currentY = currentY + maxIconHeight + minimumIconSpace;
			}

			if ( CKBuilder.options.debug )
				print( "Saving sprite: ", outputFile.getAbsolutePath() );

			ImageIO.write( sprite, "png", outputFile );
			if ( outputCssFile ) {
				if ( CKBuilder.options.debug )
					print( "Saving CSS rules to " + outputCssFile.getAbsolutePath() );

				CKBuilder.io.saveFile( outputCssFile, cssRules.join( CKBuilder.options.leaveCssUnminified ? "\r\n" : "" ) );
			}
			return iconsOffset.join( ',' );
		}
	};

}() );
