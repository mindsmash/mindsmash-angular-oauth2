/**
 * @name mindsmash-oauth2
 * @version v1.0.4
 * @author mindsmash GmbH
 * @license MIT
 */
(function(angular) {
'use strict';

(function() {
	'use strict';

	angular
		.module('mindsmash.oauth2', ['rails', 'angular-jwt'])
		.config(['$httpProvider', function($httpProvider) {
			$httpProvider.interceptors.push('mindsmashOauth2Interceptor');
		}]);
})();

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
		
		this.$get = ['railsResourceFactory', 'railsSerializer', function(railsResourceFactory, railsSerializer) {
			
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
				return Resource.$post(Resource.$url(), 'grant_type=password&username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password));
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
		}];
	});
})();

(function() {
	'use strict';

	angular
		.module('mindsmash.oauth2')
		.provider('AuthUser', AuthUser);

	function AuthUser() {
		// Config
		var url = null;
			
		/**
		 * Set base url for api calls.
		 */
		this.url = function(_url_) {
			url = _url_;
		};
		
		this.$get = ['railsResourceFactory', 'railsSerializer', function(railsResourceFactory, railsSerializer) {
	
			var Resource = railsResourceFactory({
				url: url,
				name: 'authUser',
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
				findByUsername : function(username) {
					return Resource.get({username: username});
				}
			});
		
			// instance members
			angular.extend(Resource.prototype, {
			});
			
			return Resource;
		}];
	}
})();

(function() {
	'use strict';

	angular
		.module('mindsmash.oauth2')
		.provider('authService', authService);

		/**
		 * A front-end authentication service.
		 */
		function authService() {
			var debugMode = false;

			this.debugMode = function() {
				debugMode = true;
			};

			this.$get = ['$rootScope', '$q', '$window', 'Auth', 'authUserService', 'jwtHelper', function($rootScope, $q, $window, Auth, authUserService, jwtHelper) {

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
					failAuthentication : failAuthentication,
					getUsername : getUsername,
					getUserService : getUserService
				};

				/**
				 * Performs a user login and stores the OAuth2 tokens in the localStorage.
				 */
				function login(username, password, userResource) {
					return Auth.login(username, password).then(function(auth) {
						setUsername(username);
						debug('access_token expires in ' + auth.expires_in / 60 + ' minutes');
						if (authService.isAuthValid(auth)) {
							authService.setTokens(auth);
							$rootScope.$broadcast('auth.login');
							if (!!userResource) {
								return authUserService.loadUser(userResource);
							} else {
								return $q.resolve(auth);
							}
						} else {
							return $q.reject(auth);
						}
					}, function(error) {
						unsetTokens();
						if (error.status === 400 && error.data.error === 'invalid_grant') {
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
			}];
		}
})();


(function() {
	'use strict';

	angular
		.module('mindsmash.oauth2')
		.provider('authUserService', authUserService);

	/**
	 * A front-end authentication user service.
	 */
	function authUserService() {
		var rolesProperty = 'roles',
			debugMode = false;

		this.rolesProperty = function(_rolesProperty_) {
			rolesProperty = _rolesProperty_;
		};

		this.debugMode = function() {
			debugMode = true;
		};

		this.$get = ['$injector', '$rootScope', '$q', '$timeout', function($injector, $rootScope, $q, $timeout) {
			var loadingUser = false,
				connectedUser = null;

			var authUserService = {
				loadUser : loadUser,
				getUser : getUser,
				isUser : isUser,
				updateUser : updateUser,
				refreshUser : refreshUser,
				clearUser : clearUser,
				hasAnyPermission : hasAnyPermission,
				hasAllPermissions : hasAllPermissions
			};

			/**
			 * Loads the connected user and keeps it in the singleton and returns a promise.
			 */
			function loadUser(userResource) {
				var authService = $injector.get('authService');

				if (!isUser()) {
					// block additional subsequent loads
					loadingUser = true;

					if (authService.isAuthenticated()) {
						return userResource.findByUsername(authService.getUsername()).then(function(user) {
							debug('loaded connected user with id ' + user.id);
							setUser(user);
							$rootScope.$broadcast('auth.user.loaded');
							return user;
						}, function(error) {
							debug('failed to load connected user', error);
							clearUser();
							$rootScope.$broadcast('auth.user.failed');
							if (error && (error.status === 403 || error.status === 404)) {
								$rootScope.$broadcast('auth.logout.auto');
								authService.logout();
							}
							return null;
						}).finally(function() {
							loadingUser = false;
						});
					}
				} else if (loadingUser === true) {
					return $timeout(function() {
						return loadUser();
					}, 50);
				}

				var deferred = $q.defer();
				deferred[getUser() !== null ? 'resolve' : 'reject'](getUser());
				return deferred.promise;
			}

			/**
			 * Check if user is already present.
			 */
			function isUser() {
				return connectedUser !== null;
			}

			/**
			 * Get connected user instantly.
			 */
			function getUser() {
				return connectedUser;
			}

			/**
			 * Set user locally.
			 */
			function setUser(user) {
				connectedUser = user;
			}

			/**
			 * Update connected user locally.
			 */
			function updateUser(user) {
				connectedUser = user;
			}

			/**
			 * Clear user and retrieve it again from server as a promise.
			 */
			function refreshUser() {
				var user = connectedUser;
				clearUser();
				return loadUser(user.constructor);
			}

			/**
			 * Remove user locally.
			 */
			function clearUser() {
				connectedUser = null;
			}

			/**
			 *
			 */
			function getRoles() {
				return getUser()[rolesProperty];
			}

			/**
			 * Checks if the user has any of the given permissions. Permissions can be
			 * passed as single (comma-separated) string.
			 */
			function hasAnyPermission(permissions) {
				debug('Permissions to check any of', permissions);
				if (getUser() === null) {
					debug('User missing.');
					return false;
				}
				var anyPermission = false,
					roles = getRoles();
				debug('Actual permissions', roles);
				permissions.split(',').forEach(function(permission) {
					permission = permission.trim();
					if (roles.indexOf(permission) !== -1) {
						anyPermission = true;
					}
				});
				return anyPermission;
			}

			/**
			 * Checks if the user has all of the given permissions. Permissions can be
			 * passed as single (comma-separated) string.
			 */
			function hasAllPermissions(permissions) {
				debug('Permissions to check all of', permissions);
				if (getUser() === null) {
					debug('User missing.');
					return false;
				}
				var allPermissions = true,
					roles = getRoles();
				debug('Actual permissions', roles);
				permissions.split(',').forEach(function(permission) {
					permission = permission.trim();
					if (roles.indexOf(permission) === -1) {
						allPermissions = false;
					}
				});
				return allPermissions;
			}

			/**
			 * Log when in debug mode.
			 */
			function debug(message, data) {
				if (debugMode) {
					var messageText = 'authUserService - ' + message + (data ? ' :' : '');
					if (data) {
						console.log(messageText, data);
					} else {
						console.log(messageText);
					}
				}
			}

			return authUserService;
		}];
	}
})();

(function() {
	'use strict';

	mindsmashOauth2Interceptor.$inject = ['$injector', '$q', '$rootScope'];
	angular
		.module('mindsmash.oauth2')
		.factory('mindsmashOauth2Interceptor', mindsmashOauth2Interceptor);

	/**
	 * A $http interceptor for OAuth2.
	 */
	function mindsmashOauth2Interceptor($injector, $q, $rootScope) {
		return {
			request : function(config) {
				var authService = $injector.get('authService');

				// skip if explicitly marked
				if (config.skipAuthorization) {
					return config;
				}
				if (authService.getAccessToken() !== null && (config.headers.Authorization === undefined ||
					config.headers.Authorization.indexOf('Bearer') !== -1)) {
					config.headers.Authorization = authService.getBearer();
				}
				return config;
			},
			responseError : function(response) {
				var $http = $injector.get('$http'),
					authService = $injector.get('authService');

				// check if refresh token can be applied
				if (response.status === 401) {
					if (response.config.url.indexOf('/oauth/token') !== -1) {
						// no refresh when token request fails
						authService.failAuthentication();
						return $q.reject();
					}

					var tokenInvalid = response.data.error && response.data.error === 'invalid_token',
						refreshTokenAvailable = authService.getRefreshToken() !== null;
					if (tokenInvalid && refreshTokenAvailable) {
						return authService.refreshToken().then(function() {
							return $http(response.config);
						}, function() {
							authService.failAuthentication();
							return $q.reject(response);
						});
					} else {
						authService.failAuthentication();
						return $q.reject(response);
					}
				} else {
					if (response.status === -1) {
						$rootScope.$broadcast('auth.server.connection.failure');
					}
					return $q.reject(response);
				}
			}
		};
	}
})();

})(angular);