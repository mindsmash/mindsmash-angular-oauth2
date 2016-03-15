(function() {
	'use strict';

	angular.module('mindsmash.oauth2')
	
	.provider('Auth', function() {
		// Config
		var apiBaseUrl = null,
			basicAuthCode = null,
			oauthPath = 'oauth/token';
		
		/**
		 * Set base url for api calls.
		 */
		this.apiBaseUrl = function(_apiBaseUrl_) {
			apiBaseUrl = _apiBaseUrl_;
		};
		
		/**
		 * Set string for basic authentication header
		 */
		this.basicAuthCode = function(_basicAuthCode_) {
			basicAuthCode = _basicAuthCode_;
		};
		
		this.oauthPath = function(_oauthPath_) {
			oauthPath = _oauthPath_;
		};
		
		this.$get = function(railsResourceFactory, railsSerializer) {
			
			var Resource = railsResourceFactory({
				url: apiBaseUrl + '/' + oauthPath,
				name: 'auth',
				httpConfig: {
					headers: {
						'Authorization': getBasicAuth(),
						'Content-Type': 'application/x-www-form-urlencoded'
					},
					skipAuthorization : true
				},
				rootWrapping: false,
				serializer: railsSerializer({
					camelize: function(value) {
						return value;
					}
				}, function() {
				})
			});
			
			// class members
			angular.extend(Resource, {
				login : login,
				refreshToken : refreshToken
			});
		
			// instance members
			angular.extend(Resource.prototype, {
			});
			
			/**
			 * Performs a user login.
			 */
			function login(username, password) {
				return Resource.$post(Resource.$url(), 'grant_type=password&username=' + username + '&password=' + password);
			}

			/**
			 * Refreshes the OAuth2 access token.
			 */
			function refreshToken(refreshTokenString) {
				return Resource.$post(Resource.$url() + '?grant_type=refresh_token&refresh_token=' + refreshTokenString);
			}

			/**
			 * Returns a string with basic Authentication.
			 */
			function getBasicAuth() {
				return 'Basic ' + basicAuthCode;
			}
			
			return Resource;
		};
	});
})();