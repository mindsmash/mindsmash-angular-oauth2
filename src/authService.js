(function() {
	'use strict';
	
	angular.module('mindsmash.oauth2')
	
	/**
	 * A front-end authentication service.
	 */
	.provider('authService', function() {
		var debugMode = false;
		
		this.debugMode = function() {
			debugMode = true;
		};
		
		this.$get = function($rootScope, $q, $window, Auth, authUserService, jwtHelper) {
			
			var authService = {
				login : login,
				logout : logout,
				refreshToken : refreshToken,
				getBearer : getBearer,
				getAccessToken : getAccessToken,
				getRefreshToken : getRefreshToken,
				isAuthValid : isAuthValid,
				setTokens : setTokens,
				unsetTokens : unsetTokens,
				getClaims : getClaims,
				getClaim : getClaim,
				isAuthenticated : isAuthenticated,
				failAuthentication: failAuthentication,
				getUsername : getUsername,
				getUserService : getUserService
			};
			
			/**
			 * Performs a user login and stores the OAuth2 tokens in the localStorage.
			 */
			function login(username, password) {
				return Auth.login(username, password).then(function(auth) {
					setUsername(username);
					debug('access_token expires in ' + auth.expires_in / 60 + ' minutes');
					if (authService.isAuthValid(auth)) {
						authService.setTokens(auth);
						$rootScope.$broadcast('auth.login');
						return $q.resolve(auth);
					} else {
						return $q.reject(auth);
					}
				}, function(error) {
					unsetTokens();
					if(error.status === 400 && error.data.error === 'invalid_grant') {
						$rootScope.$broadcast('auth.login.invalid');
						debug('invalid credentials');
					}
					$rootScope.$broadcast('auth.unauthenticated');
					return $q.reject(error);
				});
			}
			
			/**
			 * Performs a user logout, i.e. deletes the OAuth2 tokens from the localStorage.
			 */
			function logout() {
				unsetTokens();
				unsetUsername();
				authUserService.clearUser();
				$rootScope.$broadcast('auth.logout');
				
				var deferred = $q.defer();
				deferred.resolve(true);
				return deferred.promise;
			}
			
			/**
			 * Tries to refresh the OAuth2 access token.
			 */
			function refreshToken() {
				var refreshTokenString = authService.getRefreshToken();
				unsetTokens();
				debug('access token invalid - trying to refresh with refresh token');
				return Auth.refreshToken(refreshTokenString).then(function(auth) {
					debug('access_token expires in ' + auth.expires_in / 60 + ' minutes');
					if (authService.isAuthValid(auth)) {
						authService.setTokens(auth);
						return $q.resolve();
					} else {
						authService.failAuthentication();
						return $q.reject(auth);
					}
				}, function(error) {
					authService.failAuthentication();
					return $q.reject(error);
				});
			}
			
			/**
			 * Returns a string with bearer.
			 */
			function getBearer() {
				return 'Bearer ' + authService.getAccessToken();
			}
			
			/**
			 * Returns the current OAuth2 Access Token.
			 */
			function getAccessToken() {
				return $window.localStorage.access_token || null;
			}
			
			/**
			 * Returns the current OAuth2 Refresh Token.
			 */
			function getRefreshToken() {
				return $window.localStorage.refresh_token || null;
			}
			
			/**
			 * Is successfully authenticated?
			 */
			function isAuthValid(auth) {
				return auth.access_token && auth.refresh_token;
			}
			
			/**
			 * Stores tokens locally.
			 */
			function setTokens(auth) {
				$window.localStorage.access_token = auth.access_token;
				$window.localStorage.refresh_token = auth.refresh_token;
			}
			
			/**
			 * Removes tokens from local storage.
			 */
			function unsetTokens() {
				delete $window.localStorage.access_token;
				delete $window.localStorage.refresh_token;
			}
			
			/**
			* Returns the decoded JWT Claims (the token's payload).
			*/
			function getClaims() {
				var token = authService.getAccessToken();
				return token !== null ? jwtHelper.decodeToken(token) : null;
			}
			
			/**
			 * Get claim by key.
			 */
			function getClaim(key) {
				var claims = authService.getClaims();
				return claims !== null ? claims[key] : null;
			}
			
			/**
			 * Checks if a token is available.
			 */
			function isAuthenticated() {
				var token = authService.getAccessToken();
				return token !== null;
			}
			
			/**
			 * Performs when refreshToken fails.
			 */
			function failAuthentication() {
				$rootScope.$broadcast('auth.unauthenticated');
				authService.logout();
				$rootScope.$broadcast('auth.logout.auto');
			}
			
			/**
			 * Stores username locally
			 */
			function setUsername(username) {
				$window.localStorage.username = username;
			}
			
			/**
			 * Returns the username address last used for sign in.
			 */
			function getUsername() {
				return $window.localStorage.username || authService.getClaim('user_name') || null;
			}
			
			/**
			 * Remove username from local storage.
			 */
			function unsetUsername() {
				delete $window.localStorage.username;
			}
			
			/**
			 * Returns the user service.
			 */
			function getUserService() {
				return authUserService;
			}
			
			/**
			 * Log when in debug mode.
			 */
			function debug(message, data) {
				if (debugMode) {
					var messageText = 'authService - ' + message + (data ? ' :' : ''); 
					if (data) {
						console.log(messageText, data);
					} else {
						console.log(messageText);
					}
				}
			}

			return authService;
		};
	});
})();