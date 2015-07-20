var conf = require('./conf.js');
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
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(session(session_opts));
app.use(flash());
app.use(router);
app.use(express.static(__dirname));
app.set('view engine', 'ejs');
app.use(passport.initialize());
app.use(passport.session({store: sessionStore}));
var fs = require('fs');
var credentials = conf.credentials;
var https = require('https').createServer(credentials, app);
var io = require('socket.io')(https);
var chokidar = require('chokidar');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var unique = require('array-unique');
var LdapStrategy = require('passport-ldapauth');
var ldap_opts = conf.ldap_opts;
var default_val = conf.default_val;
passport.use(new LdapStrategy(ldap_opts,
      function(user,done){
	return done(null,user);
      }));
var logdir = conf.logdir;
var testdir = conf.testdir;
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
app.post("/login", passport.authenticate('ldapauth', {
  session: true,
  successRedirect: "/services.html",
  failureRedirect: "/",
  failureFlash: true,
  userNotFound: "User not found",
}));
app.get("/logout", function(req,res){
  console.log(req.user.uid+": logged out");
  req.logout();
  res.redirect("/");
});
app.get("/services.html", function(req,res){
  if(req.isAuthenticated()){
    res.render("services.ejs");
  }
  else{
    console.log("Redirected unauthenticated user");
    res.redirect("/");
  }
});
router.get("/", function(req,res){
  //console.log(req.flash("error"));
  res.render("index.ejs", {message: req.flash("error")});
});
//irouter.all("*", function(req,res,next){
//  res.header("Access-Control-Allow-Credentials", true);
//  next()i;
//});
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(user, done) {
  done(null, user);
});
io.sockets.on("connection", function(socket){
  var uid = socket.request.user.uid;
  var group = socket.request.user.department;
  socket.on("init", function(magicword){
    if(magicword=="Please"){
      console.log(uid+": Initializing group \""+group+"\"");
      socket.emit("welcome", uid,group);
      if(fs.statSync(testdir+"/"+group).isDirectory()){
	fs.readdir(testdir+"/"+group, function(err, tests){
	  //console.log("Reading "+testdir+group);
	  if(err) throw err;
	  tests.forEach(function(test){
	    console.log(uid+": got test "+test);
	    var ext = test.substr(test.lastIndexOf('.')+1);
	    if(ext=="yml"){
	      var name = test.slice(0, -4);
	      socket.emit("new-test", testdir+group+"/"+test, name, default_val);
	    }
	  });
	});
	fs.readdir(logdir+"/"+group, function(err, dirs){
	  if(err) throw err;
	  dirs.forEach(function(dir){
	    console.log(uid+": got errors in "+dir);
	    socket.emit("cat-add", dir);
	    fs.readdir(logdir+"/"+group+"/"+dir, function(err, files){
	      if(err) throw err;
	      files.forEach(function(file){
		fs.readFile(logdir+"/"+group+"/"+dir+"/"+file, "utf8", function(err, data){
		  if(err) throw err;
		  extract_and_emit("err-add", dir, file, data, socket);
		});
	      });
	    });
	  });
	});
      }
    }
  });
  socket.on("test_run", function(test, username, password, random_pages, conc, iter, pause, server, fn){
    var name = test.split("/").pop().slice(0, -4);
    socket.emit("alert", "info", "Info", name+" started.", "test-info"+count);
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
    if(name=="Log Replay" || name=="HiOA Tester Overlord"){
      yml_test = spawn("bzt", [test, "-o", "execution.scenario.script="+testdir+"JMX/"+name+".jmx", "-o", "modules.console.disable=true", "-o", "execution.scenario.variables.username="+username, "-o", "execution.scenario.variables.password="+password, "-o", "execution.scenario.variables.random_pages="+random_pages, "-o", "execution.scenario.variables.logdir="+logdir+"/master/", "-o", "execution.concurrency="+conc, "-o", "execution.iterations="+iter, "-o", "execution.scenario.variables.pause="+pause, "-o", "execution.scenario.variables.server="+server]);
    }
    else{
      yml_test = spawn("bzt", [test, "-o", "execution.scenario.script="+testdir+"JMX/Student Tester Overlord.jmx", "-o", "modules.console.disable=true", "-o", "execution.scenario.variables.username="+username, "-o", "execution.scenario.variables.password="+password, "-o", "execution.scenario.variables.random_pages="+random_pages, "-o", "execution.scenario.variables.logdir="+logdir+"/master", "-o", "execution.concurrency="+conc, "-o", "execution.iterations="+iter, "-o", "execution.scenario.variables.pause="+pause, "-o", "execution.scenario.variables.server="+server]);
    }
    socket.emit("add-output", name);
    yml_test.stdout.on("data", function(data){
      socket.emit("update-output", name, String.fromCharCode.apply(null, new Uint16Array(data)), "stdout");
      //console.log("stdout: "+ data);
    });
    yml_test.stderr.on("data", function(data){
      socket.emit("update-output", name, String.fromCharCode.apply(null, new Uint16Array(data)), "stderr");
      //console.log("stderr: "+ data);
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
    console.log(uid+" is clearing errors...");
    var command = "rm "+logdir+"/\""+group+"\"/*/*";
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
