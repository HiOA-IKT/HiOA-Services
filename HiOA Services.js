var conf = require('./conf.js'); // Load configuration
var express = require('express');
var session = conf.session; 
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var app = express();
var flash = require('connect-flash');
var passportSocketIo = require('passport.socketio');
var router = express.Router();
var session_opts = conf.session_opts;
var sessionStore = conf.sessionStore;
var passportSocketIo_opts = conf.passportSocketIo_opts;
app.use(cookieParser());                           //
app.use(bodyParser.json());                        //
app.use(bodyParser.urlencoded({extended: false})); //
app.use(session(session_opts));                    //
app.use(flash());                                  // Configure express
app.use(router);                                   //
app.use(express.static(__dirname));                //
app.set('view engine', 'ejs');                     //
app.use(passport.initialize());                    //
app.use(passport.session({store: sessionStore}));  //
var fs = require('fs');
var credentials = conf.credentials;
var https = require('https').createServer(credentials, app); //Create an HTTPS server with the credentials from conf.js
var io = require('socket.io')(https); //Add Socket.io to express
var chokidar = require('chokidar'); //Needed for watching file changes
var spawn = require('child_process').spawn; //Running tests
var exec = require('child_process').exec; //Clearing logs
var unique = require('array-unique');
var LdapStrategy = require('passport-ldapauth');
var ldap_opts = conf.ldap_opts;
var default_val = conf.default_val;
passport.use(new LdapStrategy(ldap_opts, //Configure Passport to use LDAP authentication
      function(user,done){
	return done(null,user);
      }));
var logdir = conf.logdir;
var testdir = conf.testdir;
var count = 0; //Keep track of notifications

var watcher = chokidar.watch(logdir+"/master", { //Start watching logdir for file changes
  ignored: /[\/\\]\./, 
    persistent: true
});
watcher.on('add',function(path){ //If a new file is added...
  fs.readFile(path, "utf8", function(err, data){
    if(err) throw err;
    console.log(path+" added");
    var path_ar = path.split("/");
    var file = path_ar.pop();
    var cat = path_ar.pop();
    extract_and_emit("err-add", cat, file, data, "all"); //...send it to all clients
  });
})
.on('change', function(path){ //If a file is changed...
  fs.readFile(path, "utf8", function(err, data){
    if(err) throw err;
    var path_ar = path.split("/");
    var file = path_ar.pop();
    var cat = path_ar.pop();
    extract_and_emit("err-update", cat, file, data, "all"); //...send the update to all clients
  });
})
.on('unlink', function(path){ //If a file is removed...
  var path_ar = path.split("/");
  var file = path_ar.pop();
  var cat = path_ar.pop();
  io.emit('err-rm', cat, file); //...remove file from all clients
})
function extract_and_emit(ev, cat, file, data, target){ //Extract urls from file and emit to the correct clients
  var data_ar = unique(data.split("\n"));
  var urls="";
  data_ar.forEach(function(url){
    urls+="<a target=\"_blank\" href=\""+url+"\">"+url+"</a><br />";
  });
  if(target!="all"){
    target.emit(ev, cat, file, urls);
  }
  else{
    io.emit(ev, cat, file, urls);
  }
}

https.listen(8443);
io.use(passportSocketIo.authorize(passportSocketIo_opts));
app.post("/login", passport.authenticate('ldapauth', { //Authenticate user
  session: true,
  successRedirect: "/services.html",
  failureRedirect: "/",
  failureFlash: true,
  userNotFound: "User not found",
}));
app.get("/logout", function(req,res){ //Log user out
  console.log(req.user.uid+": logged out");
  req.logout();
  res.redirect("/");
});
app.get("/services.html", function(req,res){ //Serve services.html to user if he/she is authenticated, redirect if not
  if(req.isAuthenticated()){
    res.render("services.ejs");
  }
  else{
    console.log("Redirected unauthenticated user");
    res.redirect("/");
  }
});
router.get("/", function(req,res){ //Serve login page, complete with error messages
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
  var uid = socket.request.user.uid; //Easier to write later on
  var group = socket.request.user.department; //Same as above
  socket.on("init", function(magicword){ //If client asks for an init...
    if(magicword=="Please"){ //...check if client is polite
      console.log(uid+": Initializing group \""+group+"\"");
      socket.emit("welcome", uid,group); //Welcome user
      if(fs.statSync(testdir+"/"+group).isDirectory()){ //Retrieve tests for the newly connected client
	fs.readdir(testdir+"/"+group, function(err, tests){
	  //console.log("Reading "+testdir+group);
	  if(err) throw err;
	  tests.forEach(function(test){
	    console.log(uid+": got test "+test);
	    var ext = test.substr(test.lastIndexOf('.')+1); //Get the extension
	    if(ext=="yml"){
	      var name = test.slice(0, -4);
	      socket.emit("new-test", testdir+group+"/"+test, name, default_val); //Send tests to client
	    }
	  });
	});
	fs.readdir(logdir+"/"+group, function(err, dirs){ //Get error messages and categories for newly connected client
	  if(err) throw err;
	  dirs.forEach(function(dir){
	    console.log(uid+": got errors in "+dir);
	    socket.emit("cat-add", dir);
	    fs.readdir(logdir+"/"+group+"/"+dir, function(err, files){
	      if(err) throw err;
	      files.forEach(function(file){
		fs.readFile(logdir+"/"+group+"/"+dir+"/"+file, "utf8", function(err, data){
		  if(err) throw err;
		  extract_and_emit("err-add", dir, file, data, socket); //Send errors to client
		});
	      });
	    });
	  });
	});
      }
    }
  });
  socket.on("test_run", function(test, username, password, random_pages, conc, iter, pause, server, fn){ //Yay, user wants to run a test!
    var name = test.split("/").pop().slice(0, -4);
    socket.emit("alert", "info", "Info", name+" started.", "test-info"+count); //Send a notification to the user
    console.log(uid+" is running \""+name+"\"");
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
    if(name=="Log Replay" || name=="HiOA Tester Overlord"){ //If test is not part of Student Tester Overlord
      yml_test = spawn("bzt", [test, "-o", "execution.scenario.script="+testdir+"JMX/"+name+".jmx", "-o", "modules.console.disable=true", "-o", "execution.scenario.variables.username="+username, "-o", "execution.scenario.variables.password="+password, "-o", "execution.scenario.variables.random_pages="+random_pages, "-o", "execution.scenario.variables.logdir="+logdir+"/"+group+"/", "-o", "execution.concurrency="+conc, "-o", "execution.iterations="+iter, "-o", "execution.scenario.variables.pause="+pause, "-o", "execution.scenario.variables.server="+server]);
    }
    else{ //If test is part of Student Tester Overlord
      yml_test = spawn("bzt", [test, "-o", "execution.scenario.script="+testdir+"JMX/Student Tester Overlord.jmx", "-o", "modules.console.disable=true", "-o", "execution.scenario.variables.username="+username, "-o", "execution.scenario.variables.password="+password, "-o", "execution.scenario.variables.random_pages="+random_pages, "-o", "execution.scenario.variables.logdir="+logdir+"/"+group+"/", "-o", "execution.concurrency="+conc, "-o", "execution.iterations="+iter, "-o", "execution.scenario.variables.pause="+pause, "-o", "execution.scenario.variables.server="+server]);
    }
    socket.emit("add-output", name); //Add a tab with the output from the test
    yml_test.stdout.on("data", function(data){
      socket.emit("update-output", name, String.fromCharCode.apply(null, new Uint16Array(data)), "stdout"); //Send stdout to user
      //console.log("stdout: "+ data);
    });
    yml_test.stderr.on("data", function(data){
      socket.emit("update-output", name, String.fromCharCode.apply(null, new Uint16Array(data)), "stderr"); //Send stderr to user
      //console.log("stderr: "+ data);
    });
    yml_test.on("exit", function(code){ //When test is finished
      if(code==1){
	socket.emit("alert", "danger", "Oops!", name+" failed.", "test-failed"+count); //Alert user
      }
      else if(code==0){
	socket.emit("alert", "success", "Success!", name+" completed successfully.", "test-success"+count); //Comfort user and tell them that all will be OK
      }
    console.log("child process exited with code : "+ code);
    });
    count++;
  });
  socket.on("clear-errors", function(){ //User wants to clear errors
    socket.emit("alert", "info", "Info", "Clearing errors...", "error-clear"+count); //Send notification
    console.log(uid+" is clearing errors..."); //Alert administrator
    var command = "rm "+logdir+"/\""+group+"\"/*/*";
    console.log(command);
    clear_logs = exec(command, function(error, stdout, stderr){ //Run clear command
      console.log("stdout: "+stdout);
      console.log("stderr: "+stderr);
      if(error != null){
	socket.emit("alert", "danger", "Oops!", "Couldn't clear logs: "+stderr, "clear-failed"+count); //Alert user
      }else{
	socket.emit("alert", "success", "Success!", "Logs cleared.", "clear-success"+count); //Congratulate user on clearing all those evil errors all by himself
      }
    });
    count++;
  });
});
