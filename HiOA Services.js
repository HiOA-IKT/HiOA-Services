var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var chokidar = require('chokidar');
var fs = require('fs');
var exec = require('child_process').exec;
//var $ = require('jquery');
//global.jQuery = $;
var unique = require('array-unique');
//require('bootstrap');
/*var vantage = require('vantage')();
vantage
	.command("foo")
	.description("Outputs 'bar'.")
	.action(function(args,cb){
		console.log("bar");
		cb();
	});

vantage
	.delimiter('webapp~$')
	.listen(1234)
	.show();
*/
var logdir = "/home/***REMOVED***/jmetertesting/logs";
var testdir = "/home/***REMOVED***/jmetertesting/YML";
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
		console.log("Error \""+file+"\"");
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
	console.log("Error \""+file+"\" fixed! :D");
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
	fs.readdir(testdir, function(err, tests){
		if(err) throw err;
		tests.forEach(function(test){
			var name = test.slice(0, -4);
			socket.emit("new-test", testdir+"/"+test, name);
			console.log("Sending test: "+testdir+"/"+test+" to connected user");
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
	socket.on("test_run", function(test, username, password, random_pages, log_dir){
		socket.emit("running_test", { data: "Running" });
		console.log("Running test...");
		console.log("bzt \""+test+"\" -o execution.scenario.variables.username=\""+username+"\" -o execution.scenario.variables.password=\""+password+"\" -o execution.scenario.variables.random_pages=\""+random_pages+"\" -o execution.scenario.variables.logdir=\""+log_dir+"\""); 
	});
});
