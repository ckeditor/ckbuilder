CKEditor "Kama" Skin
====================

The Kama skin is currently the default skin of CKEditor. It is the one included on the standard CKEditor distributions. It is actively maintained by the CKEditor core developers.

For in-depth information about skins, please check the "CKEditor Skin API" documentation:
https://ckeditor.com/docs/ckeditor4/latest/api/CKEDITOR_skin.html

Directory Structure
-------------------

- **editor.css**: the main CSS file. It is split in several different files, for easier maintenance.
- **dialog.css**: the CSS files for dialogs.
- **editor_XYZ.css** and **dialog_XYZ.css**: browser specific CSS hacks.
- **skin.js**: registers the skin, its browser specific files and its icons and defines the Chameleon feature.
- **icons/**: contains all skin defined icons.
- **images/**: contains a fill general used images.

License
-------

Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.

Licensed under the terms of any of the following licenses at your choice: [GPL](https://www.gnu.org/licenses/gpl.html), [LGPL](https://www.gnu.org/licenses/lgpl.html) and [MPL](https://www.mozilla.org/MPL/MPL-1.1.html).

See LICENSE.md for more information.
