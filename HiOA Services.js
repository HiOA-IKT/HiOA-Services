var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var chokidar = require('chokidar');
var fs = require('fs');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
//var $ = require('jquery');
//global.jQuery = $;
var unique = require('array-unique');
//require('bootstrap');
var vantage = require('vantage')();
var logdir = "/home/gussef/jmetertesting/logs";
var testdir = "/home/gussef/jmetertesting";
var count = 0;
/*vantage
	.command("cleanlogs")
	.description("Clears all error logs on the server.")
	.action(function(args,cb){
		this.prompt({
			type: "confirm",
			name: "continue",
			default: false,
			message: "Are you sure you want to clear logs?",
		}, function(result){
			if(!result.continue){
				console.log("Good choice.");
				cb();
			} else{
				console.log("All clean. :)");
				ls = exec('ls -la ' + logdir, function(error, stdout, stderr){
					console.log(stdout);
					cb();
				});
			}
		});
	});

vantage
	.delimiter('HiOA Services~$')
	.listen(1234)
	.show();
*/
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

app.use(express.static(__dirname));
http.listen(process.env.PORT || 80);
io.on("connection", function(socket){
	socket.on("init", function(magicword){
		if(magicword=="Please"){
			console.log("Initializing connected user.");
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
		yml_test = spawn("bzt", [test, "-o", "modules.console.disable=true", "-o", "execution.scenario.variables.username="+username, "-o", "execution.scenario.variables.password="+password, "-o", "execution.scenario.variables.random_pages="+random_pages, "-o", "execution.scenario.variables.logdir="+logdir, "-o", "execution.concurrency="+conc, "-o", "execution.iterations="+iter, "-o", "execution.scenario.variables.pause="+pause, "-o", "execution.scenario.variables.server="+server]);
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
