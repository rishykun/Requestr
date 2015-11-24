wgwong_rrrahman_davidwu_jroot_final
===================================

REQUESTR (MVP)

1. Signup/Login
	Note: Sign up with MIT email will be implemented in the future
	- Signup - Click the login/signup button on the top left, change tab to signup - choose a username and password (if it is not unique it will alert you)
	- Login - On the login tab login with your username and password

2. Creating a Request
	- On the navbar, click on the create a request button to bring up the create a request form
	- Enter
		- A title: required
		- An expiration date: required - a calendar you can click on for a date will pop up for you (proper form for date submission is not enforced yet)
		- A description - description for your request
		- A reward (optional) - Currently a string - future implementation might integrate venmo for enforcing monetary rewards
		- Tags(optional) - Currently you can enter your own user-defined tags by typing them out, separating each tag with a comma. (Categories - which are basically predefined tags - will be implemented in the next version)

3. Searching Requests
	- The home page currently lists all requests in no specific order. (We will eventually try to order requests based on user preferences.)
	- We did not orignally plan to have any search functionality in our MVP, however we decided to add simple searching for requests based on tags and tags only. We will improve on search for the final product
	- To search for a request that has a specific tag, enter the tags into the search bar. Separate individual tags by commas.

4. Sign up to help out for a request and choose helpers for your request
	- To sign up for a request click the accept button on the request you want to sign up for
	- The creator of the request will see you show up as a candidate for that request on their active request page (under the my requests tab on the nav bar)
	- The creator can choose to accept or reject each candidate that signed up

5. Start a request/End a request
	- When a requester feels like he/she has enough candidates to complete his request, he can start the request from his/her Active Requests page. This will also move the request to the In Progress page.
	- When the creator feels that the request is complete - the creator can select complete on the in progress request to move it to completed.

6. Commenting
	- You can view a request by clicking on the view button (currently you can only view from the front page)
	- Users can add comments to each request. In the future we will enforce that only users that made the request or are working on completing the request can comment on it.

The Messages, Search Helpers buttons, and Accepted Requests on the Nav Bar do nothing at the moment as the features have not been implemented.
Deleting requests and dropping out have not yet been implemented.