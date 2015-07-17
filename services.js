var socket = io();
// Get data from server
socket.emit("init", "Please");
// Add a new error
socket.on('err-add', function(cat, msg, urls){
  var error_element = "<li>";
  error_element+="	<div class=\"error panel panel-danger\">";
  error_element+="		<div class=\"panel-heading\">";
  error_element+="			<h5 class=\"panel-title\">";
  error_element+=msg;
  error_element+="		<span class=\"label label-danger\">Error</span>";
  error_element+="		</h5>";
  error_element+="	</div>";
  error_element+="	<div id=\""+msg.split(" ").join("-").split(".").join("-")+"-urls\" class=\"urls panel-body\">";
  error_element+=urls;
  error_element+="	</div>";
  error_element+="</li>";
  $("#"+cat).find(".errors").append(error_element);
  $("#"+cat).find(".label").attr('class', "label label-danger");
  $("#"+cat).find(".label").text("Error");
  setRules();
});
// Update an error
socket.on('err-update', function(cat, msg, urls){
  $("#"+msg.split(" ").join("-").split(".").join("-")+"-urls").html(urls);
});
// Remove an error
socket.on('err-rm', function(cat, msg){
  $("#"+msg.split(" ").join("-").split(".").join("-")+"-urls").parent().parent().remove();
  $("ul").not(':has(li)').parents(".panel-body").siblings(".panel-heading").children(".panel-title").children(".label").attr('class', "label label-success");
  $("ul").not(':has(li)').parents(".panel-body").siblings(".panel-heading").children(".panel-title").children(".label").text("OK");
  $("#"+cat).not(":has(.label-danger)").attr("class", "panel panel-success");
});
socket.on("cat-add", function(cat){
  var cat_element="<div id=\""+cat+"\" class=\"panel panel-success\">";  
  cat_element+="<div class=\"panel-heading\">";  
  cat_element+="<h5 class=\"panel-title\">";  
  cat_element+=cat+"<span class=\"label label-success\">OK</span>";  
  cat_element+="</h5>";  
  cat_element+="</div>";  
  cat_element+="<div class=\"panel-body\">";  
  cat_element+="<ul class=\"errors\">";  
  cat_element+="</ul>";  
  cat_element+="</div>";  
  cat_element+="</div>";
  $("#services").append(cat_element);
});
// Send tests to clients
socket.on("new-test", function(path, name, default_val){
  var test_element="<li>";
  test_element+="		<div id=\""+name.split(" ").join("-")+"\" class=\"panel panel-default\">";
  test_element+="			<div class=\"panel-heading\">";
  test_element+="				<h5 class=\"panel-title\">";
  test_element+=name;
  test_element+="					<button class=\"btn btn-xs btn-primary\" type=\"button\" onclick=\"run_test(\'"+name+"\', \'"+path+"\')\">Run Test</button>";
  test_element+="				</h5>";
  test_element+="			</div>";
  test_element+="			<div class=\"options panel-body\">";
  test_element+="				<div class=\"input-group\">";
  test_element+="					<span data-toggle=\"tooltip\" title=\"Username\" class=\"input-group-addon\" id=\"basic-addon1\">@</span>";
  test_element+="					<input class=\"form-control\" value=\""+default_val.username+"\" aria-describedby=\"basic-addon1\" id=\""+name.split(" ").join("-")+"-username\" type=\"text\">";
  test_element+="				</div>";
  test_element+="				<div class=\"input-group\">";
  test_element+="					<span data-toggle=\"tooltip\" title=\"Password\" class=\"input-group-addon\" id=\"basic-addon2\">*</span>";
  test_element+="					<input class=\"form-control\" value=\""+default_val.password+"\" aria-describedby=\"basic-addon2\" id=\""+name.split(" ").join("-")+"-password\" type=\"text\">";
  test_element+="				</div>";
  test_element+="				<div class=\"input-group\">";
  test_element+="					<span data-toggle=\"tooltip\" title=\"Server name\" class=\"input-group-addon\" id=\"basic-addon4\">/</span>";
  test_element+="					<input class=\"form-control\" value=\""+default_val.server+"\" aria-describedby=\"basic-addon3\" id=\""+name.split(" ").join("-")+"-server\" type=\"text\">";
  test_element+="				</div>";
  test_element+="				<div class=\"input-group\">";
  test_element+="					<span data-toggle=\"tooltip\" title=\"Random Pages\" class=\"input-group-addon\" id=\"basic-addon3\">?</span>";
  test_element+="					<input class=\"form-control\" value=\""+default_val.random_pages+"\" aria-describedby=\"basic-addon3\" id=\""+name.split(" ").join("-")+"-random_pages\" type=\"number\">";
  test_element+="				</div>";
  test_element+="				<div class=\"input-group\">";
  test_element+="					<span data-toggle=\"tooltip\" title=\"Concurrency\" class=\"input-group-addon\" id=\"basic-addon4\">||</span>";
  test_element+="					<input class=\"form-control\" value=\""+default_val.conc+"\" aria-describedby=\"basic-addon3\" id=\""+name.split(" ").join("-")+"-conc\" type=\"number\">";
  test_element+="				</div>";
  test_element+="				<div class=\"input-group\">";
  test_element+="					<span data-toggle=\"tooltip\" title=\"Iterations\" class=\"input-group-addon\" id=\"basic-addon4\">O</span>";
  test_element+="					<input class=\"form-control\" value=\""+default_val.iter+"\" aria-describedby=\"basic-addon3\" id=\""+name.split(" ").join("-")+"-iter\" type=\"number\">";
  test_element+="				</div>";
  test_element+="				<div class=\"input-group\">";
  test_element+="					<span data-toggle=\"tooltip\" title=\"Pause between requests (ms)\" class=\"input-group-addon\" id=\"basic-addon4\">.</span>";
  test_element+="					<input class=\"form-control\" value=\""+default_val.pause+"\" aria-describedby=\"basic-addon3\" id=\""+name.split(" ").join("-")+"-pause\" type=\"number\">";
  test_element+="				</div>";
  test_element+="			</div>";
  test_element+="		</div>";
  test_element+="</li>";
  $("#tests").prepend(test_element);
  setRules();
});
socket.on("add-output", function(name){
  var tablist_element="<li role=\"representation\"><a href=\"#"+name.split(" ").join("-")+"-output\" aria-controls=\""+name.split(" ").join("-")+"-output\" role=\"tab\" data-toggle=\"tab\">"+name;
  tablist_element+="<button type=\"button\" class=\"close\" data-dismiss=\"output\" aria-label=\"Close\"><span aria-hidden=\"true\">&times</span></button></a></li>";
  $("#output-list").append(tablist_element);
  var output_panel="<div role=\"tabpanel\" class=\"tab-pane\" id=\""+name.split(" ").join("-")+"-output\">";
  output_panel+="		<ul class=\"nav nav-tabs\" role=\"tablist\">";
  output_panel+="			<li role=\"presentation\" class=\"active\"><a href=\"#"+name.split(" ").join("-")+"-stdout\" aria-controls=\""+name.split(" ").join("-")+"-stdout\" role=\"tab\" data-toggle=\"tab\">Stdout</a></li>";
  output_panel+="			<li role=\"presentation\"><a href=\"#"+name.split(" ").join("-")+"-stderr\" aria-controls=\""+name.split(" ").join("-")+"-stderr\" role=\"tab\" data-toggle=\"tab\">Stderr</a></li>";
  output_panel+="		</ul>";
  output_panel+="		<div class=\"tab-content\">";
  output_panel+="			<div role=\"tabpanel\" class=\"tab-pane active output\" id=\""+name.split(" ").join("-")+"-stdout\">";
  output_panel+="			</div>";
  output_panel+="			<div role=\"tabpanel\" class=\"tab-pane output\" id=\""+name.split(" ").join("-")+"-stderr\">";
  output_panel+="			</div>";
  output_panel+="		</div>";
  output_panel+="</div>";
  $("#outputs").prepend(output_panel);
  setRules();
});
socket.on("update-output", function(name, data, output){
  var output_line = "<p>"+data+"</p>";
  $("#"+name.split(" ").join("-")+"-"+output).append(output_line);
});
socket.on("welcome", function(user, group){
  var welcome_element ="<h5>Welcome, <strong>"+user+"</strong></h5><h5><strong>"+group+"</strong></h5><button id=\"silly\" onclick=\"$(\'body\').css(\'background\',\'url(https://bitadmin.hioa.no/image/get/"+user+")\')\">Silly mode</button><h5><a href=\"/logout\">Log out</a></h5>";
  $("#welcome").append(welcome_element);
});
// Set jQuery rules
function setRules(){
  $(".panel-heading").unbind("click");
  $(".error").unbind("click");
  // Services, dropping down errors
  $(".panel-heading").click(function(){
    $(this).siblings(".panel-body").slideToggle("fast");
  });
  $(".btn").click(function(e){
    e.stopPropagation();
  });
  $(".nav-tabs a").click(function(e){
    e.preventDefault();
    $(this).tab('show');
  });
  $('[data-dismiss="output"]').click(function(){
    var href = $(this).parent().attr('href');
    $(href).remove();
    $(this).parent().parent().remove();
  });
  $('[data-toggle="tooltip"]').tooltip();
  $(".panel-title:has(span.label-danger)").parents(".panel").attr("class","panel panel-danger");
  $(".panel-title").not(":has(span.label-danger)").not(":has(button)").parents(".panel").attr("class", "panel panel-success");
}
// Request a test run from server
function run_test(name, path){
  var user = document.getElementById(name.split(" ").join("-")+"-username").value;
  var pass = document.getElementById(name.split(" ").join("-")+"-password").value;
  var pages = document.getElementById(name.split(" ").join("-")+"-random_pages").value;
  var conc = document.getElementById(name.split(" ").join("-")+"-conc").value;
  var iter = document.getElementById(name.split(" ").join("-")+"-iter").value;
  var pause = document.getElementById(name.split(" ").join("-")+"-pause").value;
  var server = document.getElementById(name.split(" ").join("-")+"-server").value;
  socket.emit("test_run", path, user, pass, pages, conc, iter, pause, server);
}
// Alerts
socket.on("alert", function(type, header, msg, id){
  var alert_element="<div class=\"alert alert-block ";
  alert_element+="alert-"+type+"\" id=\""+id+"\" role=\"alert\">";
  alert_element+="<button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\"><span aria-hidden=\"true\">&times</span></button>";
  alert_element+="<strong class=\"alert-header\">"+header+"</strong><p>"+msg+"</p></div>";
  $(".alert-container").append(alert_element);
  window.setTimeout(function(){
    $("#"+id).fadeTo(500,0).slideUp(500, function(){
      $(this).remove();
    });
  }, 5000);
});
