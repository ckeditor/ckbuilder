﻿/*
Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
For licensing, see LICENSE.html or https://ckeditor.com/legal/ckeditor-oss-license/
*/

/**
 * @fileOverview Plugin definition for the a11yhelp, which provides a dialog
 * with accessibility related help.
 */

(function()
{
	var pluginName = 'a11yhelp',
		commandName = 'a11yHelp';

	CKEDITOR.plugins.add( pluginName,
	{
		requires : [ 'dialog' ],

		// List of available localizations.
		availableLangs : { en:1, he:1 },

		init : function( editor )
		{
			var plugin = this;
			editor.addCommand( commandName,
				{
					exec : function()
					{
						var langCode = editor.langCode;
						langCode = plugin.availableLangs[ langCode ] ? langCode : 'en';

						CKEDITOR.scriptLoader.load(
								CKEDITOR.getUrl( plugin.path + 'lang/' + langCode + '.js' ),
								function()
								{
									CKEDITOR.tools.extend( editor.lang, plugin.langEntries[ langCode ] );
									editor.openDialog( commandName );
								});
					},
					modes : { wysiwyg:1, source:1 },
					readOnly : 1,
					canUndo : false
				});

			CKEDITOR.dialog.add( commandName, this.path + 'dialogs/a11yhelp.js' );
		}
	});
})();
