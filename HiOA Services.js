var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var chokidar = require('chokidar');
var fs = require('fs');
//var $ = require('jquery');
//global.jQuery = $;
var unique = require('array-unique');
//require('bootstrap');
var vantage = require('vantage')();
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

var logdir = "/home/***REMOVED***/jmetertesting/logs";
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
		extract_and_emit("err-add", cat, file, data);
		console.log("Error \""+file+"\"");
	});
})
.on('change', function(path){
	fs.readFile(path, "utf8", function(err, data){
		if(err) throw err;
		var path_ar = path.split("/");
		var file = path_ar.pop();
		var cat = path_ar.pop();
		extract_and_emit("err-update", cat, file, data);
	});
})
.on('unlink', function(path){
	var path_ar = path.split("/");
	var file = path_ar.pop();
	var cat = path_ar.pop();
	io.emit('err-rm', cat, file);
	console.log("Error \""+file+"\" fixed! :D");
})
function extract_and_emit(ev, cat, file, data){
	var data_ar = unique(data.split("\n"));
	var urls="";
	data_ar.forEach(function(url){
		urls+="<a href=\""+url+"\">"+url+"</a><br />";
	});
	io.emit(ev, cat, file, urls);
}
var log = console.log.bind(console);

app.use(express.static(__dirname));
http.listen(process.env.PORT || 8000);
io.on("connection", function(socket){
	fs.readdir(logdir, function(err, dirs){
		if(err) throw err;
		dirs.forEach(function(dir){
			fs.readdir(logdir+"/"+dir, function(err, files){
				if(err) throw err;
				files.forEach(function(file){
					fs.readFile(logdir+"/"+dir+"/"+file, "utf8", function(err, data){
						if(err) throw err;
						extract_and_emit("err-add", dir, file, data);
					});
				});
			});
		});
	});
});
