var socket = io();
socket.on('err-add', function(cat, msg, urls){
	var error_element = "<li>";
	error_element+="	<div class=\"error panel panel-danger\">";
	error_element+="		<div class=\"panel-heading\">";
	error_element+="			<h5 class=\"panel-title\">";
	error_element+=msg;
	error_element+="		<span class=\"label label-danger\">Error</span>";
	error_element+="		</h5>";
	error_element+="	</div>";
	error_element+="	<div id=\""+msg.split(" ").join("-")+"-urls\" class=\"urls panel-body\">";
	error_element+=urls;
	error_element+="	</div>";
	error_element+="</li>";
	$("#"+cat).find(".errors").append(error_element);
	$("#"+cat).find(".label").attr('class', "label label-danger");
	$("#"+cat).find(".label").text("Error");
	setRules();
});
socket.on('err-update', function(cat, msg, urls){
	$("#"+msg.split(" ").join("-")+"-urls").html(urls);
});
socket.on('err-rm', function(cat, msg){
	$("#"+msg.split(" ").join("-")+"-urls").parent().parent().remove();
	$("ul").not(':has(li)').parents(".panel-body").siblings(".panel-heading").children(".panel-title").children(".label").attr('class', "label label-success");
	$("ul").not(':has(li)').parents(".panel-body").siblings(".panel-heading").children(".panel-title").children(".label").text("OK");
	$("#"+cat).not(":has(.label-danger)").attr("class", "panel panel-success");
});
socket.on("new-test", function(path, name){
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
	test_element+="					<input class=\"form-control\" placeholder=\"Username\" aria-describedby=\"basic-addon1\" id=\""+name.split(" ").join("-")+"-username\" type=\"text\">";
	test_element+="				</div>";
	test_element+="				<div class=\"input-group\">";
	test_element+="					<span data-toggle=\"tooltip\" title=\"Password\" class=\"input-group-addon\" id=\"basic-addon2\">*</span>";
	test_element+="					<input class=\"form-control\" placeholder=\"Password\" aria-describedby=\"basic-addon2\" id=\""+name.split(" ").join("-")+"-password\" type=\"text\">";
	test_element+="				</div>";
	test_element+="				<div class=\"input-group\">";
	test_element+="					<span data-toggle=\"tooltip\" title=\"Random Pages\" class=\"input-group-addon\" id=\"basic-addon3\">?</span>";
	test_element+="					<input class=\"form-control\" value=\"10\" aria-describedby=\"basic-addon3\" id=\""+name.split(" ").join("-")+"-random_pages\" type=\"number\">";
	test_element+="				</div>";
	test_element+="				<div class=\"input-group\">";
	test_element+="					<span data-toggle=\"tooltip\" title=\"Log Directory\" class=\"input-group-addon\" id=\"basic-addon4\">/</span>";
	test_element+="					<input class=\"form-control\" value=\"../logs\" aria-describedby=\"basic-addon3\" id=\""+name.split(" ").join("-")+"-logdir\" type=\"text\">";
	test_element+="				</div>";
	test_element+="			</div>";
	test_element+="		</div>";
	test_element+="</li>";
	$("#tests").append(test_element);
	setRules();
});
function setRules(){
	$(".panel-heading").unbind("click");
	$(".error").unbind("click");
	// Services, dropping down errors
	$(".panel-heading").click(function(){
		$(this).siblings(".panel-body").slideToggle("fast");
	});
	// Service errors, dropping down urls
	/*$(".error").click(function(){
	  $(this).siblings(".urls").slideToggle("fast");
	  });*/
	$(".nav-tabs a").click(function(e){
		e.preventDefault();
		$(this).tab('show');
	});
	$('[data-toggle="tooltip"]').tooltip();
	$(".panel-title:has(span.label-danger)").parents(".panel").attr("class","panel panel-danger");
	$(".panel-title").not(":has(span.label-danger)").not(":has(button)").parents(".panel").attr("class", "panel panel-success");
}
function run_test(name, path){
	var user = document.getElementById(name.split(" ").join("-")+"-username").value;
	var pass = document.getElementById(name.split(" ").join("-")+"-password").value;
	var pages = document.getElementById(name.split(" ").join("-")+"-random_pages").value;
	var logdir = document.getElementById(name.split(" ").join("-")+"-logdir").value;
	socket.emit("test_run", path, user, pass, pages, logdir);
}
