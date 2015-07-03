function setRules(){
	$(".panel-heading").unbind("click");
	$(".error").unbind("click");
	// Services, dropping down errors
	$(".panel-heading").click(function(){
		$(this).siblings(".panel-body").slideToggle("fast");
	});
	// Service errors, dropping down urls
	$(".error").click(function(){
		$(this).siblings(".urls").slideToggle("fast");
	});
	$(".panel-title:has(span.label-danger)").parents(".panel").attr("class","panel panel-danger");
	$(".panel-title").not(":has(span.label-danger)").parents(".panel").attr("class", "panel panel-success");
}
