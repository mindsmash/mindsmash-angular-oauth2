(function() {
	'use strict';

	var moduleName = 'mindsmash.oauth2',
		apiBaseUrl = 'http://localhost:8080',
		oauthUrl = apiBaseUrl + '/oauth/token',
		basicAuthCode = 'uzRgh24l=',
		username = 'testbroker',
		password = 'testpw',
		accessToken = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOlsiZWhtcC12MSJdLCJ1c2VyX25hbWUiOiJ0ZXN0YnJva2VyIiwic2NvcGUiOlsicmVhZCIsIndyaXRlIl0sImV4cCI6MTQ1Nzk3MDI0MCwiYXV0aG9yaXRpZXMiOlsiUk9MRV9VU0VSIiwiUk9MRV9BRE1JTiIsIlJPTEVfQlJPS0VSIl0sImp0aSI6IjZlNmJiZTg2LWE1NDctNDlmZC05YzljLTU1ZWExZGZiMjUyNiIsImNsaWVudF9pZCI6ImVobXAtd2ViIn0.uHnFP5bVCSvnVNwH-UtegpfpLXDmAySSScKS4mR_N_w',
		refreshToken = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOlsiZWhtcC12MSJdLCJ1c2VyX25hbWUiOiJ0ZXN0YnJva2VyIiwic2NvcGUiOlsicmVhZCIsIndyaXRlIl0sImF0aSI6IjZlNmJiZTg2LWE1NDctNDlmZC05YzljLTU1ZWExZGZiMjUyNiIsImV4cCI6MTQ2MDU2MjE4MCwiYXV0aG9yaXRpZXMiOlsiUk9MRV9VU0VSIiwiUk9MRV9BRE1JTiIsIlJPTEVfQlJPS0VSIl0sImp0aSI6ImJlNGU4YTZmLTRlYzAtNDMxMy1hMmQ0LTlhNjJmZjE5ZDQ2NiIsImNsaWVudF9pZCI6ImVobXAtd2ViIn0.yOGI-hpI9-FYL87HPrBfN1XyaRfhLkNDmNWuRu9_mZU',
		expiresIn = 180,
		authUserBaseUrl = apiBaseUrl + '/user/',
		authUserUrlTemplate = authUserBaseUrl + '{{username}}',
		authUserActualUrl = authUserBaseUrl + username, 
		user;
		
	
	describe('oauth2 authUserService', function() {
		var $rootScope, 
		$q,
		$http,
		$httpBackend,
		authService,
		Auth,
		authUserService,
		AuthUser;
		
	    beforeEach(module(moduleName, function(authServiceProvider, AuthProvider, authUserServiceProvider, AuthUserProvider) {
	    	authServiceProvider.debugMode();
	    	AuthProvider.apiBaseUrl(apiBaseUrl);
	    	AuthProvider.basicAuthCode(basicAuthCode);
	    	authUserServiceProvider.debugMode();
	    	authUserServiceProvider.rolesProperty('permissions');
	    	AuthUserProvider.url(authUserUrlTemplate);
	    }));
	    
	    beforeEach(inject(function(_$rootScope_, _$q_, _$http_, _$httpBackend_, _authService_, _Auth_, _authUserService_, _AuthUser_) {
			$rootScope = _$rootScope_;
			$q = _$q_;
			$http = _$http_;
			$httpBackend = _$httpBackend_;
	    	authService = _authService_;
	    	Auth = _Auth_;
	    	authUserService = _authUserService_;
	    	AuthUser = _AuthUser_;
		}));
	    
	    beforeEach(function login () {
    		// given
			$httpBackend.expectPOST(oauthUrl, 'grant_type=password&username=' + username + '&password=' + password, {
	    		'Authorization': 'Basic ' + basicAuthCode,
	    		'Content-Type': 'application/x-www-form-urlencoded',
	    		'Accept': 'application/json'
	    	}).respond(200, {
	    		access_token: accessToken, 
	    		refresh_token: refreshToken,
	    		expires_in: expiresIn
	    	});
    		
    		// when
	    	authService.login(username, password);
	    	$httpBackend.flush();
	    });
	    
	    beforeEach(function () {
	    	// given
    		$httpBackend.expectGET(authUserActualUrl, {
        		'Authorization': 'Bearer ' + accessToken,
        		'Accept': 'application/json'
        	}).respond(200, {
        		id : 1,
        		permissions : [
        		    'ROLE_TEST_1',
        		    'ROLE_TEST_2',
        		    'ROLE_TEST_3'
        		]
        	});
    		
    		// when
    		authUserService.loadUser(AuthUser).then(function(_user_) {
    			user = _user_;
    		});
    		$httpBackend.flush();
	    });
	    
	    afterEach(function() {
	    	authService.logout();
	    	$httpBackend.verifyNoOutstandingExpectation();
	        $httpBackend.verifyNoOutstandingRequest();
	        $httpBackend.resetExpectations();
	    });
	    
	    describe('api', function() {
	    	it('should load user', function() {
		    	
		    	// then
		    	expect(user.id).toBe(1);
	    	});
	    	
	    	it('should get user', function() {
	    		
	    		// when
	    		var instantUser = authUserService.getUser();
	    		
	    		// then
	    		expect(instantUser.id).toBe(1);
	    	});
	    	
	    	it('should clear user', function() {
	    		
	    		// when
	    		authUserService.clearUser();
	    		
	    		// then
	    		expect(authUserService.getUser()).toBeNull();
	    	});
	    	
	    	it('should refresh user', function() {
	    		// given
	    		$httpBackend.expectGET(authUserActualUrl).respond(200, {
	        		id : 2
	        	});
	    		
	    		// when
	    		authUserService.refreshUser().then(function(_user_) {
	    			user = _user_;
	    		});
	    		$httpBackend.flush();
	    		
	    		// then
	    		expect(user.id).toBe(2);
	    	});
	    	
	    	it('should check any permission', function() {
	    		// given
	    		var anyPermission = [];
	    		
	    		// when
	    		anyPermission.push(authUserService.hasAnyPermission('ROLE_TEST_1, ROLE_TEST_MISSING'));
	    		anyPermission.push(authUserService.hasAnyPermission('ROLE_TEST_MISSING'));
	    		
	    		// then
	    		expect(anyPermission[0]).toBe(true);
	    		expect(anyPermission[1]).toBe(false);
	    	});
	    	
	    	it('should check all permissions', function() {
	    		// given
	    		var allPermissions = [];
	    		
	    		// when
	    		allPermissions.push(authUserService.hasAllPermissions('ROLE_TEST_1, ROLE_TEST_3'));
	    		allPermissions.push(authUserService.hasAllPermissions('ROLE_TEST_1, ROLE_TEST_MISSING'));
	    		
	    		// then
	    		expect(allPermissions[0]).toBe(true);
	    		expect(allPermissions[1]).toBe(false);
	    	});
	    });
	});
})();
