(function() {
	'use strict';

	angular
		.module('mindsmash.oauth2', ['rails', 'angular-jwt'])
		.config(function($httpProvider) {
			$httpProvider.interceptors.push('mindsmashOauth2Interceptor');
		});
})();