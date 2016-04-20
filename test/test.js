/*
 Copyright (c) 2012-2014, CKSource - Frederico Knabben. All rights reserved.
 For licensing, see LICENSE.md
 */

var CKBuilderTest = true;
load( "src/ckbuilder.js" );
CKBuilder.options.debug = 2;

( function()
{
	// Run tests.
	var passCount = 0, failCount = 0;
	var assetsPath = 'test/_assets';
	var assetsDir = new File( assetsPath );
	var tempPath = 'test/tmp';
	var tempDir = new File( tempPath );

	function removeTimestamp( text ) {
		return text.replace( new RegExp( '\\?t=' + CKBuilder.options.timestamp, 'g' ), '' );
	}

	function isArray(o) {
		return Object.prototype.toString.call(o) === '[object Array]';
	}

	function assertDirectoriesAreEqual( expected, actual, title )
	{
		var dirList = expected.list(), actualFile, expectedFile;

		for ( var i = 0 ; i < dirList.length ; i++ )
		{
			actualFile = new File( actual, dirList[i] );
			expectedFile = new File( expected, dirList[i] );
			assertEquals( true, actualFile.exists(), '[' + title + '] file should exist: ' + actualFile.getPath() );
			assertEquals( expectedFile.isDirectory(), actualFile.isDirectory(), '[' + title + '] files should be of the same type: ' + actualFile.getPath() );
			if ( actualFile.exists() )
			{
				if ( actualFile.isDirectory() )
					assertDirectoriesAreEqual( expectedFile, actualFile, title );
				else
					assertFilesAreEqual( expectedFile, actualFile, title );
			}
		}

		dirList = actual.list();

		// Check for files that should not exists
		for ( var i = 0 ; i < dirList.length ; i++ )
		{
			actualFile = new File( actual, dirList[i] );
			expectedFile = new File( expected, dirList[i] );
			if ( !expectedFile.exists() )
				assertEquals( false, actualFile.exists(), '[' + title + '] file should not exist: ' + actualFile.getPath() );
		}
	}

	function assertFilesAreEqual( expected, actual, title )
	{
		assertEquals(
			String( md5( removeTimestamp( CKBuilder.io.readFile( expected ) ) ) ),
			String( md5( removeTimestamp( CKBuilder.io.readFile( actual ) ) ) ),
			'[' + title + '] Checking MD5 of ' + actual.getPath() );
	}

	function assertEquals( expected, actual, title )
	{
		if ( ( !isArray( expected ) && expected !== actual) || JSON.stringify( expected ) !== JSON.stringify( actual ) )
		{
			var error = {
				expected : expected,
				actual : actual
			};

			print( 'FAILED: ' + (title ? title : "") );

//			if ( !error.expected )
//				throw error;

			print( '  Expected: ' + error.expected );
			print( '  Actual  : ' + error.actual );

			failCount++;
		}
		else
			passCount++;
	}

	function md5( s )
	{
		s = new java.lang.String( s );
		var m = java.security.MessageDigest.getInstance( "MD5" );
		m.update( s.getBytes("UTF-8"), 0, s.length() );
		return new java.math.BigInteger( 1, m.digest() ).toString( 16 );
	}

	function error( msg )
	{
		print( msg );
		quit();
	}

	function prepareTempDirs()
	{
		if ( tempDir.exists() && !CKBuilder.io.deleteDirectory( tempPath ) )
			error( "Can't delete temp directory" );

		if ( !tempDir.mkdir() )
			error( "Can't create temp directory: " + tempDir );

		var assetsDirList = assetsDir.list();
		for ( var i = 0; i < assetsDirList.length; i++ )
		{
			var f = new File( tempDir, assetsDirList[i] );
			if ( !f.mkdir() )
				error( "Can't create temp directory: " + f );
		}
	}

	function testLanguageFiles()
	{
		print( "\nTesting processing language files\n" );
		var dir = new File( assetsDir, 'langfiles' );
		var dirList = dir.list();
		var pluginNames = { devtools : 1, placeholder : 1, uicolor : 1 };
		var languages = { en : 1, he : 1, pl : 1 };

		CKBuilder.lang.mergeAll( new File( assetsDir, 'langfiles' ), new File( tempDir, 'langfiles' ), pluginNames, languages );

		for ( var i = 0; i < dirList.length; i++ )
		{
			if ( dirList[i].indexOf( ".correct" ) === -1 )
				continue;

			var correctFile = new File( dir, dirList[i] );
			var testName = correctFile.getName().replace( ".correct", "" );
			var tempFile = new File( tempDir + '/langfiles/' + testName );

			assertEquals( CKBuilder.io.readFile( correctFile ), CKBuilder.io.readFile( tempFile ), 'Language file: ' + testName );
		}
		var french = new File( tempDir + '/langfiles/fr.js' );
		assertEquals( french.exists(), false );
	}

	function testCssProcessor( testFolder, leaveCssUnminified )
	{
		print( "\nTesting CSS processor\n" );
		var correctFile, dir, dirList, test, tempFile;

		CKBuilder.options.leaveCssUnminified = leaveCssUnminified;
		CKBuilder.io.copy( new File( assetsDir + testFolder ), new File( tempDir + testFolder ) );
		CKBuilder.css.mergeCssFiles( new File( tempDir + testFolder ) );

		var sourceDir = new File( assetsDir + testFolder );
		var sourceDirList = sourceDir.list();

		for ( var i = 0 ; i < sourceDirList.length ; i++ )
		{
			if ( String( sourceDirList[i] ) === ".svn" || String( sourceDirList[i] ) === ".git" )
				continue;

			dir = new File(  tempDir + testFolder, sourceDirList[i] );
			assertEquals( true, dir.exists(), dir + " exists?" );

			dirList = dir.list();
			assertEquals( true, dirList.length > 0, dir + " not empty?" );

			var foundCorrect = 0;
			var foundCss = 0;
			/**
			 * Loop through files in the target directory and search for valid
			 * CSS files
			 */
			for ( var j = 0 ; j < dirList.length ; j++ )
			{
				if ( dirList[j].indexOf( ".css" ) !== -1 )
					foundCss++;

				if ( dirList[j].indexOf( "correct.txt" ) !== -1 )
				{
					foundCorrect++;
					test = dirList[j].replace( ".correct.txt", "" );

					correctFile = new File( dir, dirList[j] );
					tempFile = new File( dir, test + '.css' );

					assertEquals( true, tempFile.exists(), tempFile + " exists?" );

					assertEquals( String( md5( CKBuilder.io.readFile( correctFile ) ) ), String( md5( CKBuilder.io.readFile( tempFile ) ) ),
						'Checking md5 of created file [' + dir.getName() + "/" + test + '.css]' );
				}
			}
			if ( foundCorrect )
				assertEquals( foundCorrect, foundCss, 'The number of created and correct css files must be equal in skin ' + dir.getName() );
		}
	}

	function testSprite()
	{
		var plugins = ['basicstyles', 'link', 'list', 'table'];
		var pluginsLocation = new File( assetsDir, "/sprite/plugins" );
		var skinLocation = new File( assetsDir, "/sprite/skins/v2" );

		// 1. Unminified CSS, use only specified plugins
		CKBuilder.options.all = false;
		CKBuilder.options.leaveCssUnminified = true;

		var imageFile = new File( tempPath + "/sprite/icons.png" );
		var cssFile = new File( tempPath + "/sprite/icons.css" );

		CKBuilder.image.createFullSprite( pluginsLocation, skinLocation, imageFile, cssFile, plugins );

		assertEquals(
			CKBuilder.io.readFile( new File( assetsDir, "/sprite/icons.correct.css" ) ),
			removeTimestamp( CKBuilder.io.readFile( cssFile ) ),
			'Checking content of icons.css' );
		assertEquals( imageFile.exists(), true, "Sprite image should exist." );

		var image = ImageIO.read( imageFile );
		// 14 icons x (21px + 8px)
 		// 21 pixels - biggest single icon height
		// 8 pixels - a distance in a non-hidpi strip
		assertEquals( 14 * (21 + 8), image.getHeight(), "Checking height of sprite image." );
		assertEquals( 21, image.getWidth(), "Checking width of sprite image." );


		// 2. Minified CSS, include icons for all plugins (also the maximize plugin)
		CKBuilder.options.all = true;
		CKBuilder.options.leaveCssUnminified = false;

		imageFile = new File( tempPath + "/sprite/icons2.png" );
		cssFile = new File( tempPath + "/sprite/icons2.css" );

		CKBuilder.image.createFullSprite( pluginsLocation, skinLocation, imageFile, cssFile, plugins );

		assertEquals(
			CKBuilder.io.readFile( new File( assetsDir, "/sprite/icons2.correct.css" ) ),
			removeTimestamp( CKBuilder.io.readFile( cssFile ) ),
			'Checking content of icons2.css'
		);
		assertEquals( imageFile.exists(), true, "Sprite image should exist." );

		var image = ImageIO.read( imageFile );
		// 15 icons x (21px + 8px)
		// 21 pixels - biggest single icon height
		// 8 pixels - a distance in a non-hidpi strip
		assertEquals( 15 * (21 + 8), image.getHeight(), "Checking height of sprite image." );
		assertEquals( 21, image.getWidth(), "Checking width of sprite image." );

		// 3. Unminified CSS, use only specified plugins, hidpi
		CKBuilder.options.all = false;
		CKBuilder.options.leaveCssUnminified = true;
		var skinLocation = new File( assetsDir, "/sprite/skins/sapphire" );

		var imageFile = new File( tempPath + "/sprite/icons3.png" );
		var cssFile = new File( tempPath + "/sprite/icons3.css" );

		CKBuilder.image.createFullSprite( pluginsLocation, skinLocation, imageFile, cssFile, plugins, true );

		assertEquals(
			CKBuilder.io.readFile( new File( assetsDir, "/sprite/icons3.correct.css" ) ),
			removeTimestamp( CKBuilder.io.readFile( cssFile ) ),
			'Checking content of icons3.css'
		);
		assertEquals( imageFile.exists(), true, "Sprite image should exist." );

		var image = ImageIO.read( imageFile );
		// 14 icons x (32px + 16px)
		// 32 pixels - biggest single icon height
		// 16 pixels - a distance in a hidpi strip
		assertEquals( 14 * ( 32 + 16 ), image.getHeight(), "Checking height of sprite image." );
		assertEquals( 32, image.getWidth(), "Checking width of sprite image." );
	}

	function testDirectives()
	{
		print( "\nTesting directives\n" );

		var name = 'directives';
		var testName, tempFile, correctFile, sampleFile;

		var dir = new File( assetsDir, 'directives' );
		var dirList = dir.list();

		for ( var i = 0 ; i < dirList.length ; i++ )
		{
			if ( dirList[i].indexOf( ".correct." ) === -1 )
				continue;

			testName = dirList[i].replace( ".correct.txt", "" );

			sampleFile = new File( dir, testName + '.txt' );
			correctFile = new File( dir, testName + '.correct.txt' );
			tempFile = new File( tempDir, name + '/' + testName + '.out.txt' );

			CKBuilder.io.copy( sampleFile, tempFile );
			CKBuilder.tools.processDirectives( tempFile, { version: '3.1beta', revisionNumber : '1234', timestamp : 'AB89' } );

			assertEquals( CKBuilder.io.readFile( correctFile ), CKBuilder.io.readFile( tempFile ),
				'releaser.directives[' + testName + ']' );
		}
	}

	function testBom()
	{
		var file, extension;
		var dir = new File( tempDir, 'bom' );

		CKBuilder.io.copy( new File( assetsDir, 'bom' ), dir, function( sourceLocation, targetLocation ) {
			if ( !sourceLocation.isDirectory() )
				return CKBuilder.tools.fixLineEndings( sourceLocation, targetLocation ) ? 1 : 0;
		} );

		var children = dir.list();
		for ( var i = 0 ; i < children.length ; i++ )
		{
			file = new File( dir, children[i] );

			extension = CKBuilder.io.getExtension( file.getName() );

			switch ( extension )
			{
				case "asp":
				case "js":
					// BOM + CRLF
					assertEquals( 8, file.length(), "testing BOM: " + children[i] );
					break;

				case "sh":
					// !BOM + LF
					assertEquals( 4, file.length(), "testing BOM: " + children[i] );
					break;

				default:
					// !BOM + CRLF
					assertEquals( 5, file.length(), "testing BOM: " + children[i] );
					break;
			}
		}
	}

	function testLineEndings()
	{
		print( "\nTesting line endings\n" );
		var testName, tempFile, correctFile, sampleFile;
		var name = "lineendings";
		var dir = new File( assetsDir, 'lineendings' );
		var dirList = dir.list();

		for ( var i = 0 ; i < dirList.length ; i++ )
		{
			if ( dirList[i].indexOf( ".correct." ) === -1 )
				continue;

			testName = dirList[i].replace( ".correct", "" );

			sampleFile = new File( assetsDir, name + '/' + testName );
			correctFile = new File( assetsDir, name + '/' + dirList[i] );
			tempFile = new File( tempDir, name + '/' + testName );

			CKBuilder.tools.fixLineEndings( sampleFile, tempFile );

			assertEquals( CKBuilder.io.readFile( correctFile ), CKBuilder.io.readFile( tempFile ),
				'testing line endings: [' + testName + ']' );
		}
	}

	function listFiles( file )
	{
		var result = [];

		if ( file.isDirectory() )
		{
			var children = file.list();
			if ( !children.length )
			{
				result.push( file );
			}
			else
			{
				for ( var i = 0 ; i < children.length ; i++ )
				{
					result.push( listFiles( new File( file, children[i] ) ) );
				}
			}
		}
		else
		{
			result.push( file );
		}

		return result;
	}

	function testIgnoringPaths()
	{
		print( "\nTesting ignored paths...\n" );

		var sourceLocation = new File( assetsDir, 'ignored' );
		var targetLocation = new File( tempDir, 'ignored' );

		var ignored = [ 'devtools', 'placeholder/lang/he.js', 'uicolor.js' ];
		CKBuilder.io.copy( sourceLocation, targetLocation , function( sourceLocation, targetLocation ) {
			if ( CKBuilder.config.isIgnoredPath( sourceLocation, ignored ) )
				return -1;
		});

		var files = listFiles(targetLocation);
		var validResult = [
			'test/tmp/ignored/a11yhelp/lang/en.js',
			'test/tmp/ignored/a11yhelp/lang/he.js',
			'test/tmp/ignored/a11yhelp/plugin.js',
			'test/tmp/ignored/placeholder/dialogs/placeholder.js',
			'test/tmp/ignored/placeholder/lang/en.js',
			'test/tmp/ignored/placeholder/lang/pl.js',
			'test/tmp/ignored/placeholder/plugin.js',
			'test/tmp/ignored/uicolor/lang/en.js',
			'test/tmp/ignored/uicolor/lang/he.js',
			'test/tmp/ignored/uicolor/plugin.js'];

		assertEquals( files.length, 3, "Comparing plugins directories (same number of subfolders?)" );

		// For some magic reason simple sorting doesn't work.
		var areEqual = files.toString().split(",").sort().toString().replace(/\\/g, "/") === validResult.toString();

		assertEquals( true, areEqual, "Comparing plugins directories (are equal?)" );
	}

	function testLangProps()
	{
		print( "\nTesting language properties...\n" );

		var sourceLocation = new File( assetsDir, 'langprops' );
		var targetLocation = new File( tempDir, 'langprops' );

		CKBuilder.io.copy( sourceLocation, targetLocation );

		var plugins = {
			devtools : {
				test : { en : 1, pl : 1, foo : 1 },
				expected : ['en', 'pl']
			},
			div : {
				test: { foo : 1, bar : 1 },
				expected: false
			},
			find : {
				test : { en : 1, pl : 1, 'zh-cn' : 1, fr : 0 },
				expected : ['en', 'pl', 'zh-cn']
			},
			colordialog : {
				test : { en : 1, pl : 1, 'zh-cn' : 1, fr : 1 },
				expected : ['en', 'pl', 'zh-cn', 'fr']
			},
			liststyle : {
				test : { en : 1, pl : 1, 'zh-cn' : 1, he : 1 },
				expected : ['en', 'pl', 'zh-cn', 'he']
			},
			magicline : {
				test : { en : 1, pl : 1, foo : 1 },
				expected : true
			},
			specialchar : {
				test : { en : 1, pl : 1, 'zh-cn' : 1, he : 1 },
				expected : ['en', 'pl', 'zh-cn', 'he']
			}
		};

		for ( var plugin in plugins )
		{
			assertEquals( plugins[plugin].expected, CKBuilder.plugin.updateLangProperty( File( targetLocation, 'plugins/' + plugin + '/plugin.js'), plugins[plugin].test ), "lang property (" + plugin + ")" );
			assertFilesAreEqual( File( sourceLocation, 'plugins_correct/' + plugin + '/plugin.js'), File( targetLocation, 'plugins/' + plugin + '/plugin.js') );
		}
	}

	CKBuilder.plugin.updateLangProperty(File("test/_assets/requires/plugin_hr.js"), 'en.pl');

	function testMinification()
	{
		print( "\nTesting minification...\n" );

		var sourceLocation = new File( assetsDir, 'minification' );
		var targetLocation = new File( tempDir, 'minification' );

		CKBuilder.io.copy( sourceLocation, targetLocation , null, function( targetLocation ) {
			if ( CKBuilder.io.getExtension( targetLocation.getName() ) === 'js'  )
				CKBuilder.javascript.minify( targetLocation );
		} );

		var testName, tempFile, correctFile;
		var dir = new File( tempDir, 'minification' );
		var dirList = dir.list();

		for ( var i = 0 ; i < dirList.length ; i++ )
		{
			if ( dirList[i].indexOf( ".correct" ) === -1 )
				continue;

			testName = dirList[i].replace( ".correct", "" );

			correctFile = new File( dir, testName + '.correct' );
			tempFile = new File( dir, testName );

			assertEquals( CKBuilder.io.readFile( correctFile ), CKBuilder.io.readFile( tempFile ),
				'minification[' + testName + ']' );
		}
	}

	function testRequiredPlugins()
	{
		print( "\nTesting required plugins...\n" );

		var assetsLocation = new File( assetsDir, 'requires' );
		assertEquals( ['dialog', 'fakeobjects'], CKBuilder.plugin.getRequiredPlugins(new File( assetsLocation, "plugin_flash.js" )));
		assertEquals( ['richcombo'], CKBuilder.plugin.getRequiredPlugins(new File( assetsLocation, "plugin_font.js" )));
		assertEquals( ['dialog', 'fakeobjects'], CKBuilder.plugin.getRequiredPlugins(new File( assetsLocation, "plugin_link.js" )));
		assertEquals( ['floatpanel'], CKBuilder.plugin.getRequiredPlugins(new File( assetsLocation, "plugin_menu.js" )));
		assertEquals( [], CKBuilder.plugin.getRequiredPlugins(new File( assetsLocation, "plugin_xml.js" )));
		assertEquals( [], CKBuilder.plugin.getRequiredPlugins(new File( assetsLocation, "plugin_hr.js" )));
		assertEquals( [], CKBuilder.plugin.getRequiredPlugins(new File( assetsLocation, "plugin_hr2.js" )));
		assertEquals( ['foo'], CKBuilder.plugin.getRequiredPlugins(new File( assetsLocation, "plugin_hr3.js" )));
		assertEquals( ['dialog', 'contextmenu'], CKBuilder.plugin.getRequiredPlugins(new File( assetsLocation, "plugin_liststyle.js" )));
	}

	function testSkinBuilder()
	{
		print( "\nTesting skin builder...\n" );

		CKBuilder.options.leaveCssUnminified = true;
		var sourceLocation = new File( assetsDir, 'skins/kama' );
		var correctResultLocation = new File( assetsDir, 'skins/kama_correct' );
		var targetLocation = new File( tempDir, 'skins/kama' );

		CKBuilder.skin.build( sourceLocation, targetLocation );
		assertDirectoriesAreEqual( correctResultLocation, targetLocation, 'Checking skin builder (CSS minification disabled)' );

		CKBuilder.options.leaveCssUnminified = false;
		var sourceLocation = new File( assetsDir, 'skins_minified/kama' );
		var correctResultLocation = new File( assetsDir, 'skins_minified/kama_correct' );
		var targetLocation = new File( tempDir, 'skins_minified/kama' );

		CKBuilder.skin.build( sourceLocation, targetLocation );
		assertDirectoriesAreEqual( correctResultLocation, targetLocation, 'Checking skin builder (CSS minification enabled)' );
	}

	function testVerifyPlugins()
	{
		print( "\nTesting plugins verification...\n" );

		var pluginsLocation = new File( assetsDir, 'verify_plugins' );
		var dirList = pluginsLocation.list();
		var plugins = {
			'_pubme_extratags_1_1.zip' : { name : '_pubme_extratags',  expected : 'OK' },
			'apinstein-ckeditor-autocss-2e37374.zip' : { name : 'autocss',  expected : 'OK' },
			'autosave_1.0.2.zip' : { name : 'autosave',  expected : 'OK' },
			'confighelper1.2.zip' : { name : 'confighelper',  expected : 'OK' },
			'fakeelements_checkbox_radio_select.zip' : { name : 'formchanges',  expected : 'OK' },
			'groupedcolorbutton.zip' : { name : 'groupedcolorbutton',  expected : 'OK' },
			'highlite_source_with_codemirror.zip' : { name : 'highlightsource',  expected : "The plugin name defined inside plugin.js (sourcepopup) does not match the expected plugin name (highlightsource)\n" },
			'htmlbuttons1.0.zip' : { name : 'htmlbuttons',  expected : 'OK' },
			'imagepaste1.0.zip' : { name : 'imagepaste',  expected : 'OK' },
			'insert-edit_source_code_icons.zip' : { name : 'insertedit',  expected : "The plugin name defined inside plugin.js (scriptcode) does not match the expected plugin name (insertedit)\n" },
			'languages.zip' : { name : 'languages',  expected : 'OK' },
			'lightbox_plus.zip' : { name : 'lightboxplus',  expected : "The plugin name defined inside plugin.js (lightbox) does not match the expected plugin name (lightboxplus)\n" },
			'links_to_own_pages.zip' : { name : 'linktoown',  expected : "The plugin name defined inside plugin.js (internpage) does not match the expected plugin name (linktoown)\n" },
			'loremIpsum.zip' : { name : 'loremipsum',  expected : "The plugin name defined inside plugin.js (loremIpsum) does not match the expected plugin name (loremipsum)\n" },
			'onchange1.5.zip' : { name : 'onchange',  expected : 'OK' },
			'small_google_map.zip' : { name : 'gmap',  expected : 'OK' },
			'smallerselection0.1.zip' : { name : 'smallerselection',  expected : 'OK' },
			'video1.3.zip' : { name : 'video',  expected : 'OK' },
			'w8tcha-CKEditor-oEmbed-Plugin-481d449.zip' : { name : 'oEmbed',  expected : "Found more than one plugin.js:\n/w8tcha-CKEditor-oEmbed-Plugin-481d449/oEmbed_CKEditor3/oEmbed/plugin.js\n/w8tcha-CKEditor-oEmbed-Plugin-481d449/oEmbed_CKEditor4/oEmbed/plugin.js\n" },
			'whitelist1.0.zip' : { name : 'whitelist',  expected : 'OK' },
			'xmltemplates1.0.zip' : { name : 'xmltemplates',  expected : 'OK' },
			'youtube.zip' : { name : 'youtube',  expected : 'OK' },
			'youtube_mp3.zip' : { name : 'youtube',  expected : "Found more than one plugin.js:\n/youtube_mp3/mp3player/plugin.js\n/youtube_mp3/youtube/plugin.js\n" },
			'zoom1.0.zip' : { name : 'zoom', expected : 'OK' }
		};

		for ( var i = 0 ; i < dirList.length ; i++ )
		{
			var file = new File( pluginsLocation, dirList[i] );
			if ( file.isDirectory() )
			{
				assertEquals( "OK", CKBuilder.plugin.verify( file.getPath(), { pluginName : String( file.getName() ) } ));
			}
			else
			{
				assertEquals( plugins[file.getName()].expected, CKBuilder.plugin.verify( file.getPath(), { pluginName : plugins[file.getName()].name } ));
			}
			//print('Checking ' + file.getPath());

		}
	}

	function testVerifySkins()
	{
		print( "\nTesting skins verification...\n" );

		var skinsLocation = new File( assetsDir, 'verify_skins' );
		var dirList = skinsLocation.list();

		for ( var i = 0 ; i < dirList.length ; i++ )
		{
			var file = new File( skinsLocation, dirList[i] );
			if ( file.isDirectory() )
			{
				if ( file.getName() == "fake" ) {
					assertEquals( "The skin name defined inside skin.js (kama) does not match the expected skin name (fake)\n", CKBuilder.skin.verify( file.getPath(), { skinName : file.getName() } ));
				}
				else if ( file.getName() == "noicons" ) {
					assertEquals( "OK", CKBuilder.skin.verify( file.getPath(), { skinName : String( file.getName() ) } ));
				}
				else {
					assertEquals( "OK", CKBuilder.skin.verify( file.getPath(), { skinName : String( file.getName() ) } ));
				}
			}
		}
	}

	function testSamples()
	{
		print( "\nTesting samples merging...\n" );

		var samplesLocation = new File( assetsDir, 'samples/ckeditor-dev' );
		var targetLocation = new File( tempDir, 'samples' );
		CKBuilder.io.copy( samplesLocation, targetLocation );
		CKBuilder.samples.mergeSamples( targetLocation );

		var correctResultLocation = new File( assetsDir, 'samples/ckeditor-dev-correct' );
		assertDirectoriesAreEqual( correctResultLocation, targetLocation, 'Checking merged samples' );

	}

	function testCopyrights()
	{
		print( "\nTesting copyrights...\n" );
		CKBuilder.options.commercial = true;
		CKBuilder.options.leaveJsUnminified = true;
		var sourceLocation = new File( assetsDir, 'copyrights' );
		var targetLocation = new File( tempDir, 'copyrights' );
		CKBuilder.io.copy( sourceLocation, targetLocation );

		var testName, tempFile, correctFile;
		var dir = new File( tempDir, 'copyrights' );
		var dirList = dir.list();

		for ( var i = 0 ; i < dirList.length ; i++ )
		{
			if ( dirList[i].indexOf( ".correct" ) === -1 )
				continue;

			testName = dirList[i].replace( ".correct", "" );

			correctFile = new File( dir, testName + '.correct' );
			tempFile = new File( dir, testName );
			CKBuilder.tools.updateCopyrights( tempFile );

			assertEquals( CKBuilder.io.readFile( correctFile ), CKBuilder.io.readFile( tempFile ),
					'copyrights[' + testName + ']' );
		}
		CKBuilder.options.commercial = false;
		CKBuilder.options.leaveJsUnminified = false;
	}

	prepareTempDirs();
	testLangProps();
	testLanguageFiles();
	testSprite();
	testCssProcessor( "/css", true );
	testCssProcessor( "/css_minified", false );
	testDirectives();
	testBom();
	testLineEndings();
	testIgnoringPaths();
	testMinification();
	testRequiredPlugins();
	testSkinBuilder();
	testVerifyPlugins();
	testVerifySkins();
	testSamples();
	testCopyrights();

	print( '' );
	print( 'Finished: ' + passCount + ' passed / ' + failCount + ' failed' );

}());
