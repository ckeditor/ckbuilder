/*
Copyright (c) 2003-2011, CKSource - Frederico Knabben. All rights reserved.
For licensing, see LICENSE.md or http://ckeditor.com/license
*/

/**
 * @fileOverview Defines the {@link CKEDITOR.lang} object for the
 * Polish language.
 */

/**#@+
   @type String
   @example
*/

/**
 * Contains the dictionary of language entries.
 * @namespace
 */
CKEDITOR.lang['pl'] =
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
	editorTitle : 'Edytor tekstu sformatowanego, %1, w celu uzyskania pomocy naciśnij ALT 0.',

	// Common messages and labels.
	common :
	{
		browseServer	: 'Przeglądaj',
		url				: 'Adres URL',
		protocol		: 'Protokół',
		upload			: 'Wyślij',
		uploadSubmit	: 'Wyślij',

		// Put the voice-only part of the label in the span.
		unavailable		: '%1<span class="cke_accessibility">, niedostępne</span>'
	},

	contextmenu :
	{
		options : 'Opcje menu kontekstowego'
	},

	// Special char dialog.
	specialChar		:
	{
		toolbar		: 'Wstaw znak specjalny',
		title		: 'Wybierz znak specjalny',
		options : 'Opcje znaków specjalnych'
	},

	docprops :
	{
		label : 'Właściwości dokumentu',
		title : 'Właściwości dokumentu',
		design : 'Projekt strony',
		previewHtml : '<p>To jest <strong>przykładowy tekst</strong>. Korzystasz z programu <a href="javascript:void(0)">CKEditor</a>.</p>'
	}
};
