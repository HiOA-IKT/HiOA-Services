$(document).ready(function(){
	// Services, dropping down errors
	$(".title").click(function(){
		$(this).siblings(".dropdown").slideToggle("fast");
	});
	// Service errors, dropping down urls
	$(".error").click(function(){
		$(this).siblings(".urls").slideToggle("fast");
	});
	$("div.title:has(div.err-tag)").css("background-color","#f4cabc");
});
