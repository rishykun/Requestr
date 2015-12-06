$(document).ready(function() {
	$('[data-toggle="tooltip"]').tooltip(); //initializes all bootstrap tooltips
	try { //we don't need to import pttimeselectcntr for request.ejs and profile.ejs, but they still call init.js
		//therefore, we put this in a try statement and ignore if it fails
		$('input[name="requestExpiresTime"]').ptTimeSelect(); //initializes the expiration date tool
		$("#ptTimeSelectCntr").css("z-index", 1051); //manually force it to show in front of modal, default z-index is not high enough
	} catch (err) {

	}
});