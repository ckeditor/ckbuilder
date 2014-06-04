/*
Copyright (c) 2003-2011, CKSource - Frederico Knabben. All rights reserved.
For licensing, see LICENSE.html or http://ckeditor.com/license
*/

/**
 * @fileOverview Defines the {@link CKEDITOR.lang} object for the English
 *		language. This is the base file for all translations.
 */

/**#@+
   @type String
   @example
*/

/**
 * Contains the dictionary of language entries.
 * @namespace
 */
CKEDITOR.lang['en'] =
{
	/**
	 * The language reading direction. Possible values are "rtl" for
	 * Right-To-Left languages (like Arabic) and "ltr" for Left-To-Right
	 * languages (like English).
	 * @default 'ltr'
	 */
	dir : 'ltr',

	/*
	 * Screenreader titles. Please note that screenreaders are not always capable
	 * of reading non-English words. So be careful while translating it.
	 */
	editorTitle : 'Rich text editor, %1, press ALT 0 for help.',

	// Common messages and labels.
	common :
	{
		browseServer	: 'Browse Server',
		url				: 'URL',
		protocol		: 'Protocol',
		upload			: 'Upload',
		uploadSubmit	: 'Send it to the Server',

		// Put the voice-only part of the label in the span.
		unavailable		: '%1<span class="cke_accessibility">, unavailable</span>'
	},

	contextmenu :
	{
		options : 'Context Menu Options'
	},

	// Special char dialog.
	specialChar		:
	{
		toolbar		: 'Insert Special Character',
		title		: 'Select Special Character',
		options : 'Special Character Options'
	},

	docprops :
	{
		label : 'Document Properties',
		title : 'Document Properties',
		design : 'Design',
		previewHtml : '<p>This is some <strong>sample text</strong>. You are using <a href="javascript:void(0)">CKEditor</a>.</p>'
	}
};
