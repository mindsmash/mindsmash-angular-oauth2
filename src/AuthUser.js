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
		
		this.$get = function(railsResourceFactory, railsSerializer) {
	
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
		};
	}
})();