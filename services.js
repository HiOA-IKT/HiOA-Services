function setRules(){
	$(".title").unbind("click");
	$(".error").unbind("click");
	// Services, dropping down errors
	$(".title").click(function(){
		$(this).siblings(".dropdown").slideToggle("fast");
	});
	// Service errors, dropping down urls
	$(".error").click(function(){
		$(this).siblings(".urls").slideToggle("fast");
	});
	$("div.title:has(div.err-tag)").css("background-color","#f4cabc");
	$("div.title").not(":has(div.err-tag)").css("background-color","DarkSeaGreen");
}
