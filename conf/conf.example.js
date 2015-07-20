var session = require('express-session');
var redisStore = require("connect-redis")(session);
var fs = require('fs');
var cookieParser = require('cookie-parser');
// CONFIGURE BELOW
var logdir = "/home/user/hioa-test-framework/logs";
var testdir = "/home/user/hioa-test-framework/";
var student = fs.readFileSync(testdir+"/Student.csv", "utf8").split("\n").join("").split("\"").join("").split(","); // Read comma-separated values from the configuration csv's. (Change filename(s) to suit your test plan)
var hioa = fs.readFileSync(testdir+"/HiOA.csv", "utf8").split("\n").join("").split("\"").join("").split(",");
var default_val = { // Parse csv's into default values. (Change parameters to suit your test plan)
	username: student[0],
	password: student[1],
	logdir: student[2],
	random_pages: student[3],
	pause: student[4],
	server: hioa[1],
	iter: 1,
	conc: 5
};

var ldap_opts = { // Your LDAP search query. See https://github.com/vesse/passport-ldapauth for more details.
  server: {
    url: 'ldaps://ldap.example.com',
    bindDn: 'admin@example.com',
    bindCredentials: 'password',
    searchBase: 'OU=People,DC=EXAMPLE,DC=COM',
    searchFilter: 'cn={{username}}'
  }
};
var redis_opts = {
  host: "127.0.0.1", //We'll assume you are running Redis on localhost and default port
};
var sessionStore = new redisStore(redis_opts);
var session_opts = {
  secret: 'session_secret', // You might want to change this
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: 900000,
    secure:true,
  }
};
var passportSocketIo_opts = {
  cookieParser: cookieParser,
  secret: 'session_secret', // Same as above
  key: 'connect.sid',
  store: sessionStore,
  success: onAuthorizeSuccess,
  fail: onAuthorizeFail
};
var privateKey = fs.readFileSync("/path/to/whatever.com.key", "utf8");   //
var certificate = fs.readFileSync("/path/to/whatever.com.pem", "utf8");  // The application depends on https, so these must be configured as well
var ca_file = fs.readFileSync("/path/to/chain-whatever.com.pem", "utf8");//
// END OF CONFIG

function onAuthorizeSuccess(data, accept){
  console.log('successful connection to socket.io');
  accept();
}
function onAuthorizeFail(data, message, error, accept){
  console.log("unsuccessful login: "+message);
  if(error) accept(new Error(message));
}
exports.credentials = {key: privateKey, cert: certificate, ca: ca_file};
exports.default_val = default_val;
exports.session_opts =session_opts;
exports.ldap_opts = ldap_opts;
exports.logdir = logdir;
exports.testdir = testdir;
exports.sessionStore = sessionStore;
exports.session = session;
exports.passportSocketIo_opts = passportSocketIo_opts;
