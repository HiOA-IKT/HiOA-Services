var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var redisStore = require('connect-redis')(session);
var app = express();
var flash = require('connect-flash');
var sessionStore = new redisStore({
	host: '***REMOVED***',
});
var passportSocketIo = require('passport.socketio');
var router = express.Router();
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(session({secret: '***REMOVED***', resave: false, saveUninitialized: false, store: sessionStore, cookie: {secure:true}}));
app.use(flash());
app.use(router);
app.use(express.static(__dirname));
app.set('view engine', 'ejs');
app.use(passport.initialize());
app.use(passport.session());
var fs = require('fs');
var privateKey = fs.readFileSync('***REMOVED***', 'utf8');
var certificate = fs.readFileSync('***REMOVED***', 'utf8');
var ca_file = fs.readFileSync('***REMOVED***', 'utf8');
var credentials = {key: privateKey, cert: certificate, ca: ca_file};
var http = require('http').createServer(app);
var https = require('https').createServer(credentials, app);
var io = require('socket.io')(https);
var chokidar = require('chokidar');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
//var $ = require('jquery');
//global.jQuery = $;
var unique = require('array-unique');
//require('bootstrap');
var LdapStrategy = require('passport-ldapauth');
var ldap_opts = require("./ldap.js").opts;
passport.use(new LdapStrategy(ldap_opts,
function(user,done){
  console.log(user);
  return done(null,user);
}));
    var vars = require('./vars');
    var logdir = vars.logdir;
    var testdir = vars.testdir;
    var count = 0;

    var watcher = chokidar.watch(logdir, {
      ignored: /[\/\\]\./, 
	persistent: true
    });
watcher.on('add',function(path){
  fs.readFile(path, "utf8", function(err, data){
    if(err) throw err;
    var path_ar = path.split("/");
    var file = path_ar.pop();
    var cat = path_ar.pop();
    extract_and_emit("err-add", cat, file, data, "all");
  });
})
.on('change', function(path){
  fs.readFile(path, "utf8", function(err, data){
    if(err) throw err;
    var path_ar = path.split("/");
    var file = path_ar.pop();
    var cat = path_ar.pop();
    extract_and_emit("err-update", cat, file, data, "all");
  });
})
.on('unlink', function(path){
  var path_ar = path.split("/");
  var file = path_ar.pop();
  var cat = path_ar.pop();
  io.emit('err-rm', cat, file);
})
function extract_and_emit(ev, cat, file, data, target){
  var data_ar = unique(data.split("\n"));
  var urls="";
  data_ar.forEach(function(url){
    urls+="<a href=\""+url+"\">"+url+"</a><br />";
  });
  if(target!="all"){
    target.emit(ev, cat, file, urls);
  }
  else{
    io.emit(ev, cat, file, urls);
  }
}

http.listen(8080);
https.listen(8443);
io.use(passportSocketIo.authorize({
	cookieParser: cookieParser,
	key: '***REMOVED***',
	secret: '***REMOVED***',
	store: sessionStore,
	success: onAuthorizeSuccess,
	fail: onAuthorizeFail,
}));
function onAuthorizeSuccess(data, accept){
	console.log('successful connection to socket.io');
	accept();
}
function onAuthorizeFail(data, message, error, accept){
  	console.log("unsuccessful login: "+message);
	if(error) accept(new Error(message));
}
//app.post("/login", passport.authenticate('ldap', {
app.post("/login", passport.authenticate('ldapauth', {
  successRedirect: "/services.html",
  failureRedirect: "/",
  failureFlash: true,
  userNotFound: "User not found"
}));
app.get("/logout", function(req,res){
	req.logout();
	res.redirect("/");
});
router.get("/", function(req,res){
	//console.log(req.flash("error"));
	res.render("index.ejs", {message: req.flash("error")});
});
passport.serializeUser(function(user, done) {
	  done(null, user);
});
passport.deserializeUser(function(user, done) {
	  done(null, user);
});
io.sockets.on("connection", function(socket){
  socket.on("init", function(magicword){
    if(magicword=="Please"){
      console.log("Initializing "+socket.request.user.uid+" from \""+socket.request.user.department+"\"");
      //console.log(socket.request.flash());
      socket.emit("welcome", socket.request.user.uid,socket.request.user.department);
      fs.readdir(testdir, function(err, tests){
	if(err) throw err;
	tests.forEach(function(test){
	  var ext = test.substr(test.lastIndexOf('.')+1);
	  if(ext=="yml"){
	    var name = test.slice(0, -4);
	    socket.emit("new-test", testdir+"/"+test, name);
	  }
	});
      });
      fs.readdir(logdir, function(err, dirs){
	if(err) throw err;
	dirs.forEach(function(dir){
	  fs.readdir(logdir+"/"+dir, function(err, files){
	    if(err) throw err;
	    files.forEach(function(file){
	      fs.readFile(logdir+"/"+dir+"/"+file, "utf8", function(err, data){
		if(err) throw err;
		extract_and_emit("err-add", dir, file, data, socket);
	      });
	    });
	  });
	});
      });
    }
  });
  socket.on("test_run", function(test, username, password, random_pages, conc, iter, pause, server, fn){
    var name = test.split("/").pop().slice(0, -4);
    socket.emit("alert", "info", "Info", name+" started.", "test-info"+count);
    console.log("Running test...");
    //console.log(command);
    /*yml_test = exec(command, function(error, stdout, stderr){
      console.log('stdout: '+stdout);
      console.log('stderr: '+stderr);
      if(error !== null){
      socket.emit("alert", "danger", "Oops!", test.split("/").pop()+" failed with error: "+stderr);
      console.log('exec error: ' + error);
      } else{
      socket.emit("alert", "success", "Success!", test.split("/").pop()+" completed successfully.");
      }
      });*/
    yml_test = spawn("bzt", [test, "-o", "execution.scenario.script="+testdir+"JMX/"+name+".jmx", "-o", "modules.console.disable=true", "-o", "execution.scenario.variables.username="+username, "-o", "execution.scenario.variables.password="+password, "-o", "execution.scenario.variables.random_pages="+random_pages, "-o", "execution.scenario.variables.logdir="+logdir, "-o", "execution.concurrency="+conc, "-o", "execution.iterations="+iter, "-o", "execution.scenario.variables.pause="+pause, "-o", "execution.scenario.variables.server="+server]);
    socket.emit("add-output", name);
    yml_test.stdout.on("data", function(data){
      socket.emit("update-output", name, String.fromCharCode.apply(null, new Uint16Array(data)), "stdout");
      console.log("stdout: "+ data);
    });
    yml_test.stderr.on("data", function(data){
      socket.emit("update-output", name, String.fromCharCode.apply(null, new Uint16Array(data)), "stderr");
      console.log("stderr: "+ data);
    });
    yml_test.on("exit", function(code){
      if(code==1){
	socket.emit("alert", "danger", "Oops!", name+" failed.", "test-failed"+count);
      }
      else if(code==0){
	socket.emit("alert", "success", "Success!", name+" completed successfully.", "test-success"+count);
      }
    console.log("child process exited with code : "+ code);
    });
    count++;
  });
  socket.on("clear-errors", function(){
    socket.emit("alert", "info", "Info", "Clearing errors...", "error-clear"+count);
    console.log("Clearing errors...");
    var command = "rm "+logdir+"/*/*";
    console.log(command);
    clear_logs = exec(command, function(error, stdout, stderr){
      console.log("stdout: "+stdout);
      console.log("stderr: "+stderr);
      if(error != null){
	socket.emit("alert", "danger", "Oops!", "Couldn't clear logs: "+stderr, "clear-failed"+count);
      }else{
	socket.emit("alert", "success", "Success!", "Logs cleared.", "clear-success"+count);
      }
    });
    count++;
  });
});
