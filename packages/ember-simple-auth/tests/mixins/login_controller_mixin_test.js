var testController;
var TestController = Ember.Controller.extend(Ember.SimpleAuth.LoginControllerMixin, {
  actions: {
    sessionAuthenticationSucceeded: function() {
      this.invokedSessionAuthenticationSucceeded = true;
    },
    sessionAuthenticationFailed: function(error) {
      this.invokedSessionAuthenticationFailed     = true;
      this.invokedSessionAuthenticationFailedWith = error;
    }
  }
});

var sessionMock;
var SessionMock = Ember.Object.extend({
  authenticate: function(authenticator, options) {
    this.invokedAuthenticate     = true;
    this.invokedAuthenticateWith = { authenticator: authenticator, options: options };
    return new Ember.RSVP.Promise(function(resolve, reject) {
      if (!!SessionMock._resolve) {
        resolve(SessionMock._resolve);
      } else {
        reject(SessionMock._reject);
      }
    });
  }
});

module('Ember.SimpleAuth.LoginControllerMixin', {
  setup: function() {
    testController = TestController.create();
    sessionMock    = SessionMock.create();
    testController.set('session', sessionMock);
    testController.setProperties({ identification: 'identification', password: 'password' });
  }
});

test('authenticates the session when login is triggered', function() {
  Ember.run(function() {
    testController.setProperties({ identification: 'identification', password: 'password' });
    testController.send('login');
  });

  ok(sessionMock.invokedAuthenticate, 'Ember.SimpleAuth.LoginControllerMixin authenticates the session when login is triggered.');
  ok(sessionMock.invokedAuthenticateWith.authenticator instanceof Ember.SimpleAuth.Authenticators.OAuth2, 'Ember.SimpleAuth.LoginControllerMixin authenticates the session with the correct authenticator when login is triggered.');
  deepEqual(sessionMock.invokedAuthenticateWith.options, { identification: 'identification', password: 'password' }, 'Ember.SimpleAuth.LoginControllerMixin authenticates the session with identification and password when login is triggered.');
});

test('does not authenticate the session when identification or password are empty', function() {
  testController.setProperties({ identification: '', password: 'password' });
  testController.send('login');

  ok(!sessionMock.invokedAuthenticate, 'Ember.SimpleAuth.LoginControllerMixin does not authenticate the session when login is triggered but identification is empty.');

  testController.setProperties({ identification: 'identification', password: '' });
  testController.send('login');

  ok(!sessionMock.invokedAuthenticate, 'Ember.SimpleAuth.LoginControllerMixin does not authenticate the session when login is triggered but password is empty.');

  testController.setProperties({ identification: '', password: '' });
  testController.send('login');

  ok(!sessionMock.invokedAuthenticate, 'Ember.SimpleAuth.LoginControllerMixin does not authenticate the session when login is triggered but identification and password are empty.');
});

test('triggers the login succeeded action when login is successful', function() {
  SessionMock._resolve = true;
  Ember.run(function() {
    testController.send('login');
  });

  ok(testController.invokedSessionAuthenticationSucceeded, 'Ember.SimpleAuth.LoginControllerMixin triggers the sessionAuthenticationSucceeded action when login was successful.');
});

test('triggers the login failed action with the callback arguments', function() {
  SessionMock._resolve = false;
  SessionMock._reject = 'error!';
  Ember.run(function() {
    testController.send('login');
  });

  ok(testController.invokedSessionAuthenticationFailed, 'Ember.SimpleAuth.LoginControllerMixin triggers the sessionAuthenticationFailed action when login fails.');
  equal(testController.invokedSessionAuthenticationFailedWith, 'error!', 'Ember.SimpleAuth.LoginControllerMixin triggers the sessionAuthenticationFailed action with the rejection value of the session.');
});
