﻿/*
Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
For licensing, see LICENSE.html or https://ckeditor.com/legal/ckeditor-oss-license/
*/

CKEDITOR.plugins.add( 'uicolor',
{
		requires : [ 'dialog' ],
		lang : [ 'en', 'he' ],

		init : function( editor )
		{
			if ( CKEDITOR.env.ie6Compat )
				return;

			editor.addCommand( 'uicolor', new CKEDITOR.dialogCommand( 'uicolor' ) );
			editor.ui.addButton( 'UIColor',
				{
					label : editor.lang.uicolor.title,
					command : 'uicolor',
					icon : this.path + 'uicolor.gif'
				});
			CKEDITOR.dialog.add( 'uicolor', this.path + 'dialogs/uicolor.js' );

			// Load YUI js files.
			CKEDITOR.scriptLoader.load( CKEDITOR.getUrl( 'plugins/uicolor/yui/yui.js' ));

			// Load YUI css files.
			editor.element.getDocument().appendStyleSheet( CKEDITOR.getUrl( 'plugins/uicolor/yui/assets/yui.css' ));
		}
});
