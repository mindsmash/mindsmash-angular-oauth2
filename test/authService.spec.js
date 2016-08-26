(function() {
	'use strict';

	var moduleName = 'mindsmash.oauth2',
		apiBaseUrl = 'http://localhost:8080',
		oauthUrl = apiBaseUrl + '/oauth/token',
		authUserBaseUrl = apiBaseUrl + '/user',
		basicAuthCode = 'uzRgh24l=',
		username = 'testbroker',
		password = 'testpw',
		accessToken = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOlsiZWhtcC12MSJdLCJ1c2VyX25hbWUiOiJ0ZXN0YnJva2VyIiwic2NvcGUiOlsicmVhZCIsIndyaXRlIl0sImV4cCI6MTQ1Nzk3MDI0MCwiYXV0aG9yaXRpZXMiOlsiUk9MRV9VU0VSIiwiUk9MRV9BRE1JTiIsIlJPTEVfQlJPS0VSIl0sImp0aSI6IjZlNmJiZTg2LWE1NDctNDlmZC05YzljLTU1ZWExZGZiMjUyNiIsImNsaWVudF9pZCI6ImVobXAtd2ViIn0.uHnFP5bVCSvnVNwH-UtegpfpLXDmAySSScKS4mR_N_w',
		refreshToken = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOlsiZWhtcC12MSJdLCJ1c2VyX25hbWUiOiJ0ZXN0YnJva2VyIiwic2NvcGUiOlsicmVhZCIsIndyaXRlIl0sImF0aSI6IjZlNmJiZTg2LWE1NDctNDlmZC05YzljLTU1ZWExZGZiMjUyNiIsImV4cCI6MTQ2MDU2MjE4MCwiYXV0aG9yaXRpZXMiOlsiUk9MRV9VU0VSIiwiUk9MRV9BRE1JTiIsIlJPTEVfQlJPS0VSIl0sImp0aSI6ImJlNGU4YTZmLTRlYzAtNDMxMy1hMmQ0LTlhNjJmZjE5ZDQ2NiIsImNsaWVudF9pZCI6ImVobXAtd2ViIn0.yOGI-hpI9-FYL87HPrBfN1XyaRfhLkNDmNWuRu9_mZU',
		expiresIn = 180;
		
	
	function expectSuccessfulLogin($httpBackend) {
		$httpBackend.expectPOST(oauthUrl, 'grant_type=password&username=' + username + '&password=' + password, {
    		'Authorization': 'Basic ' + basicAuthCode,
    		'Content-Type': 'application/x-www-form-urlencoded',
    		'Accept': 'application/json'
    	}).respond(200, {
    		access_token: accessToken, 
    		refresh_token: refreshToken,
    		expires_in: expiresIn
    	});
	}

	describe('oauth2 authService', function() {
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
	    	AuthUserProvider.url(authUserBaseUrl + '/{{username}}')
	    }));
	    
	    beforeEach(function() {			
			inject(function(_$rootScope_, _$q_, _$http_, _$httpBackend_, _authService_, _Auth_, _authUserService_, _AuthUser_) {
				$rootScope = _$rootScope_;
				$q = _$q_;
				$http = _$http_;
				$httpBackend = _$httpBackend_;
		    	authService = _authService_;
		    	Auth = _Auth_;
		    	authUserService = _authUserService_;
		    	AuthUser = _AuthUser_;
		    });
		});
	    
	    afterEach(function() {
	    	authService.unsetTokens();
	    	$httpBackend.verifyNoOutstandingExpectation();
	        $httpBackend.verifyNoOutstandingRequest();
	        $httpBackend.resetExpectations();
	    });
	    
	    describe('login', function() {
		    it('should login and return auth object', function() {
		    	// given
		    	var loginResult, loginEvent;
		    	$rootScope.$on('auth.login', function(event) {
		    		loginEvent = event;
		    	});
		    	expectSuccessfulLogin($httpBackend);
		    	
		    	// when
		    	authService.login(username, password).then(function(auth) {
		    		loginResult = auth;
		    	});
		    	$httpBackend.flush();
				
				// then
		    	expect(loginResult.access_token).toBe(accessToken);
		    	expect(loginResult.refresh_token).toBe(refreshToken);
		    	expect(loginResult.expires_in).toBe(expiresIn);
		    	expect(loginEvent.name).toBe('auth.login');
		    	expect(authService.getAccessToken()).toBe(accessToken);
		    	expect(authService.getRefreshToken()).toBe(refreshToken);
		    	expect(authService.isAuthenticated()).toBe(true);
		    });
		    
		    it('should not login with invalid credentials', function() {
		    	// given
		    	var loginError, loginInvalidEvent, unauthenticatedEvent;
		    	$rootScope.$on('auth.login.invalid', function(event) {
		    		loginInvalidEvent = event;
		    	});
		    	$rootScope.$on('auth.unauthenticated', function(event) {
		    		unauthenticatedEvent = event;
		    	});
		    	$httpBackend.expectPOST(oauthUrl).respond(400, {error: 'invalid_grant'});
		    	
		    	// when
		    	authService.login('invalid_username', 'invalid_password').catch(function(error) {
		    		loginError = error;
		    	});
		    	$httpBackend.flush();
		    	
		    	// then
		    	expect(loginError.status).toBe(400);
		    	expect(loginError.data.error).toBe('invalid_grant');
		    	expect(loginInvalidEvent.name).toBe('auth.login.invalid');
		    	expect(unauthenticatedEvent.name).toBe('auth.unauthenticated');
		    	expect(authService.getAccessToken()).toBe(null);
		    	expect(authService.getRefreshToken()).toBe(null);
		    	expect(authService.isAuthenticated()).toBe(false);
		    })
		    
		    it('should logout', function() {
		    	// given
		    	var logoutEvent;
		    	$rootScope.$on('auth.logout', function(event) {
		    		logoutEvent = event;
		    	});
		    	expectSuccessfulLogin($httpBackend);
		    	authService.login(username, password);
		    	$httpBackend.flush();
		    	expect(authService.getAccessToken()).toBe(accessToken);
		    	expect(authService.getRefreshToken()).toBe(refreshToken);
		    	
		    	// when
		    	authService.logout();
		    	
		    	// then
		    	expect(authService.getAccessToken()).toBe(null);
		    	expect(authService.getRefreshToken()).toBe(null);
		    	expect(authService.getUsername()).toBe(null);
		    	expect(logoutEvent.name).toBe('auth.logout');
		    });
		    
		    it('should login and return user object', function() {
		    	// given
		    	var loginResult, loginEvent;
		    	$rootScope.$on('auth.login', function(event) {
		    		loginEvent = event;
		    	});
		    	expectSuccessfulLogin($httpBackend);
		    	$httpBackend.expectGET(authUserBaseUrl + '/' + username)
		    		.respond(200, {
		    			id: 2, 
		    			username: username, 
		    			test_property: ''
		    		});
		    	
		    	// when
		    	authService.login(username, password, AuthUser).then(function(user) {
		    		loginResult = user;
		    	});
		    	$httpBackend.flush();
		    	
		    	// then
		    	expect(loginResult.id).toBe(2);
		    	expect(loginResult.username).toBe(username);
		    	expect(loginResult.test_property).toBe('');
		    	expect(loginEvent.name).toBe('auth.login');
		    	expect(authService.getAccessToken()).toBe(accessToken);
		    	expect(authService.getRefreshToken()).toBe(refreshToken);
		    	expect(authService.isAuthenticated()).toBe(true);
		    });
	    });
	    
	    describe('interceptor', function() {
	    	it('should send request with token in authentication header', function() {
	    		// given
	    		var result;
	    		authService.setTokens({
	    			access_token: accessToken,
	    			refresh_token: refreshToken
	    		});
	    		$httpBackend.expectGET('http://test', {
	    			'Authorization': 'Bearer ' + accessToken,
	    			'Accept': 'application/json, text/plain, */*'
	    		}).respond(200);
	    		
	    		// when
	    		$http.get('http://test').then(function(response) {
	    			result = response;
	    		});
	    		$httpBackend.flush();
	    		
	    		// then
	    		expect(result.status).toBe(200);
	    	});
	    	
		    it('should refresh token', function() {
		    	// given
		    	var result;
		    	authService.setTokens({access_token: null, refresh_token: refreshToken});
		    	$httpBackend.expectGET('http://test').respond(401, {error: 'invalid_token'});
		    	$httpBackend.expectPOST(oauthUrl + '?grant_type=refresh_token&refresh_token=' + refreshToken, null, {
		    		'Authorization': 'Basic ' + basicAuthCode,
		    		'Accept': 'application/json'
		    	}).respond(200, {
		    		access_token: accessToken, 
		    		refresh_token: refreshToken,
		    		expires_in: expiresIn
		    	});
		    	$httpBackend.expectGET('http://test').respond(200);
		    	
		    	// when
		    	$http.get('http://test').then(function(response) {
		    		result = response;
		    	});
		    	$httpBackend.flush();
		    	
		    	// then
		    	expect(result.status).toBe(200);
		    });

		    it('should reject request when refresh token invalid', function() {
		    	// given
		    	var authError, authEvent;
		    	$rootScope.$on('auth.unauthenticated', function(event) {
		    		authEvent = event;
		    	});
		    	authService.setTokens({access_token: null, refresh_token: refreshToken});
		    	$httpBackend.expectGET('http://test').respond(401, {error: 'invalid_token'});
		    	$httpBackend.expectPOST(oauthUrl + '?grant_type=refresh_token&refresh_token=' + refreshToken, null, {
		    		'Authorization': 'Basic ' + basicAuthCode,
		    		'Accept': 'application/json'
		    	}).respond(400, 'error');
		    	
		    	// when
		    	$http.get('http://test').catch(function(error) {
		    		authError = error;
		    	});
		    	$httpBackend.flush();
		    	
		    	// then
		    	expect(authError.status).toBe(401);
		    	expect(authError.data.error).toBe('invalid_token');
		    	expect(authEvent.name).toBe('auth.unauthenticated');
		    });

		    it('should broadcast when server is not available', function() {
		    	// given
		    	var authError, authEvent;
		    	$rootScope.$on('auth.server.connection.failure', function(event) {
		    		authEvent = event;
		    	});
		    	authService.setTokens({access_token: null, refresh_token: refreshToken});
		    	$httpBackend.expectGET('http://test').respond(-1);

			    // when
		    	$http.get('http://test').catch(function(response) {
		    		authError = response;
		    	});
		    	$httpBackend.flush();

		    	// then
		    	expect(authError.status).toBe(-1);
		    	expect(authEvent.name).toBe('auth.server.connection.failure');
		    });
	    });
	    
	    describe('api', function() {
	    	it('should verify some api methods', function() {
	    		// given
	    		expectSuccessfulLogin($httpBackend);
	    		
	    		// when
		    	authService.login(username, password);
		    	$httpBackend.flush();
		    	
		    	// then
		    	expect(authService.getUsername()).toBe(username);
		    	expect(authService.getClaims().user_name).toBe(username);
		    	expect(authService.getClaim('user_name')).toBe(username);
		    	expect(authService.isAuthenticated()).toBe(true);
	    	});
	    });
	});
})();
