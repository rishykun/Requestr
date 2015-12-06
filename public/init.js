$(document).ready(function() {
	$('[data-toggle="tooltip"]').tooltip(); //initializes all bootstrap tooltips
	$('input[name="requestExpiresTime"]').ptTimeSelect(); //initializes the expiration date tool
	$("#ptTimeSelectCntr").css("z-index", 1051); //manually force it to show in front of modal, default z-index is not high enough
});