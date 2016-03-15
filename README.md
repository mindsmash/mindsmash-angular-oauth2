# mindsmash-oauth2
Authentication services for AngularJS. The current implementation features login, logout, interceptors, refreshing token, decoding token and user services. The library is designed to easily integrate with a Spring Boot application backend using an oauth2 security setup.

### Table of Contents

   - [Installation](#1-installation)
   - [Usage](#2-usage)
   - [API](#3-api)

### 1. Installation

   1. Download the [latest release](https://github.com/mindsmash/mindsmash-angular-oauth2/releases) or the [current master](https://github.com/mindsmash/mindsmash-angular-oauth2/archive/master.zip) from GitHub. You can also use [Bower](http://bower.io) to install the latest version:
   ```
   $ bower install mindsmash-angular-oauth2 --save
   ```
   
   2. Include the library in your website (please use either the minified or unminified file in the `dist` directory):
   ```
   <script src="mindsmash-angular-oauth2/mindsmash-angular-oauth2.min.js"></script>
   ```
   
   3. Add oauth2 as a dependency to your app:
   ```
   angular.module('your-app', ['mindsmash-oauth2']);
   ```

**[Back to top](#table-of-contents)**

### 2. Usage

**[Back to top](#table-of-contents)**

### 3. API

**[Back to top](#table-of-contents)**

### Contributors

   * Cornelius Hofmeister @ [mindsmash GmbH](https://www.mindsmash.com/)

### License

The MIT License (MIT)

Copyright (c) 2015 mindsmash GmbH

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
