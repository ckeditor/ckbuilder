CKBuilder
=========

This repository contains the source files of CKBuilder, **a command line builder** for [CKEditor](https://github.com/ckeditor/ckeditor-dev).

CKBuilder generates release packages of CKEditor out of its source code. 

### Compiling CKBuilder

You can compile CKBuilder into a single .jar file by running `build_jar.sh` located in the `dev\build` folder. The compiled file will be generated in the `bin` folder.
[Apache Ant](https://ant.apache.org) is required to run it.

### Using CKBuilder source files

You can generate a CKEditor release version using CKBuilder source files by running `build.sh` available in the `dev\scripts` folder. The release version of CKEditor will be generated in the `release` folder.
Make sure to download the CKEditor submodule first:

	> git submodule update --init

### Using the default ckbuilder.jar

If you did not compile your own version of `ckbuilder.jar` and all you want to do is to build CKEditor, then there is a simpler way to do this:

 1. Clone the [CKEditor](https://github.com/ckeditor/ckeditor-dev) repository.
 2. Inside ckeditor-dev run:

    ```
    > ./dev/builder/build.sh
    ```

 3. That's it - CKBuilder will be downloaded automatically and a "release" version of CKEditor will be built in the new `dev/builder/release/` folder. 

**Note:** CKBuilder which is run by calling ```build.sh``` script will use default ```build-config.js``` which define skin, files to be ignored and plugins. For more information about build-config run builder with ```--build-help``` command.
 
**Note2:** The shell script is designed to run on Mac/Linux. If you are a Windows user, install [Git for Windows](https://msysgit.github.io/), make sure "Git Bash" is checked during the installation process and then run this script using "Git Bash".

### Using a custom ckbuilder.jar

To get the list of all available commands and options, run:

	> java -jar ckbuilder.jar --help

#### Available commands

This is just an overview of available commands. For more details, check the built-in help options.

**--help | --build-help | --full-help**

Display various help information.

**--build**

Build CKEditor, definitely the most frequently used command.

**--build-skin**

Creates a release version of a skin (icons are merged into a single strip image, CSS files are merged and minified, JavaScript files are minified). 

Note: if you want to share your skin with others, do **not** upload the release version of a skin to the [CKEditor addons repository](https://ckeditor.com/cke4/addons/skins/all), upload the source version instead.

**--verify-plugin | --verify-skin**

Used by the online builder to verify if a plugin or skin is valid. If you have problems with uploading a skin or a plugin, it might be because this command returned errors.

**--preprocess-core | --preprocess-plugin | --preprocess-skin**

Used by the [online builder](https://ckeditor.com/cke4/builder), unless you intend to do a similar service, you don't need it.

**--generate-build-config**

Creates a fresh `build-config.js`.

### Build config



### License

Licensed under the terms of the MIT License. For full details about license, please check LICENSE.md file.
