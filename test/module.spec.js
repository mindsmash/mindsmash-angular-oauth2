(function() {
	'use strict';

	var moduleName = 'mindsmash.oauth2';

	describe('oauth2 module', function() {
	    var module;
	
	    beforeEach(function() {
	    	module = angular.module(moduleName); 
	    });
	    
 
	    it("should be registered", function() {
	    	expect(module).not.toEqual(null);
	    });
	    
	    describe("dependencies", function() {
	
	        var deps;
	        var hasModule = function(m) {
	          return deps.indexOf(m) >= 0;
	        };
	        beforeEach(function() {
	          deps = module.value(moduleName).requires;
	        });
	
	        it("should have rails as a dependency", function() {
	          expect(hasModule('rails')).toEqual(true);
	        });
	        
	        it("should have jwt as a dependency", function() {
	        	expect(hasModule('angular-jwt')).toEqual(true);
	        });
	    });
	});
})();
