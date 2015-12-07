/*
	general javascript functions that serve as utility functions
*/


/*
	Return to home page.
*/
goHome = function() {
	location.href="/";
}

/*
	Return to previous page.
*/
goBack = function() {
	window.history.back();
}

var openIframeModal;

$(document).ready(function() {

	/*
		Open specified src within modal.
		Params:
			src - url of source.
	*/
	openIframeModal = function(src) {

		$("#iframe").attr("src", src); //set iframe
		$("#iframeModal").modal("show"); //open modal containing iframe
	}
});