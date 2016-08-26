(function() {
	'use strict';

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
