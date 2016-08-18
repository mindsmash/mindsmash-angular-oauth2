(function() {
	'use strict';
	
	angular.module('mindsmash.oauth2')
	
	/**
	 * A front-end authentication user service.
	 */
	.provider('authUserService', function() {
		var rolesProperty = 'roles',
			debugMode = false;
		
		this.rolesProperty = function(_rolesProperty_) {
			rolesProperty = _rolesProperty_;
		};
		
		this.debugMode = function() {
			debugMode = true;
		};
		
		this.$get = function($injector, $rootScope, $q, $timeout) {
			var loadingUser = false,
				connectedUser = null;
			
			var authUserService = {
				loadUser : loadUser,
				getUser : getUser,
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
							if(error && (error.status === 403 || error.status === 404)) {
								$rootScope.$broadcast('auth.logout.auto');
								authService.logout();
							}
							return null;
						}).finally(function() {
							loadingUser = false;
						});
					}
				} else if(loadingUser === true) {
					return $timeout(function(){
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
		};
	});
})();