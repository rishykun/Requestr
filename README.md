wgwong_rrrahman_davidwu_jroot_final
===================================

deployed at http://requestr-6170.herokuapp.com/

REQUESTR (Final)

1. Signup/Login
	- Signup - Click the login/signup button on the top left, change tab to signup - choose a username and password (if it is not unique it will alert you), and the e-mail address associated with your venmo account (to receive payments)
	- Login - On the login tab login with your username and password

2. Creating a Request
	- On the navbar, click on the create a request button to bring up the create a request form
	- Enter
		- A title: required 
		- An expiration date: required - a calendar you can click on for a date will pop up for you
		- A description - description for your request
		- A reward (required) - Number >= 0 which you will pay each helper (in dollars) once request is completed
		- Tags(optional) - Currently you can enter your own user-defined tags by typing them out, separating each tag with a comma. 

3. Searching Requests
	- The home page currently lists all open requests.
	- The search bar allows for basic filtering by querying via keywords (separated by commas + case sensitive) which returns open requests with a match on any of the keywords in the title or description
	- Advanced search allows querying by tags (separated by commas) in addition to keywords and will also return requests with a tag match, the results will be sorted by the number of tag matches since the higher the match, the more relevant it is. Ideally, users should be using tags to define the scope of their requests.

4. Helping with a request
	- To sign up for a request click the accept button on the request you want to sign up for
	- You can view the profile of the creator of the request by clicking the creator's name in the request box
	- The creator of the request will see you show up as a candidate for that request on his or her active request page (under the my created requests tab on the nav bar)	
	- The creator can choose to accept or reject each candidate that signed up
	- The creator also has the option of viewing the candidate's profile while deciding to accept the candidate for help or not
	- The candidate can choose to drop out of the request before the creator accepts help from the candidate

5. Viewing a profile
	- Viewing someone's profile allows you to:
		- View titles of requests created by that person
		- View titles of requests helped with by that person
		- View reviews of that person
		- Open up a chat window with that person (can be used to discuss the person's qualifications/availability)

6. Messaging
	- Messaging can be accessed by either the nav bar or via a person's profile
	- You can click a user (whether online or offline) and viiew/send a message to the user through the chat bar
	- That user will get a notification on the messages tab on the navbar and can view new messages/reply once he or she opens up the window
	- This serves as a convenience and takes away the need to have extra information posted on a user's profile (such as skills which we said we were going to implement, but decided that messaging would make it unnecessary)

7. Start/Delete a request
	- When a requester feels like he/she has enough candidates to complete his request, he can start the request from the Active Requests page. This will also move the request to the In Progress page (My Created Requests for ther requester, My Accepted Requests for the helpers).
	- A requester also has the option to delete any request which hasn't been started
	- Clicking on the comments link at the bottom of the request opens up a commenting text box which allows participants to discuss the progress of the request

8. End a request
	- When the creator feels that the request is complete - the creator can select complete on the in progress request to move it to completed.
	- Once a request is completed, the creator can pay the helpers the reward associated with the request and the participants (creator + helper) can review each other.

9. Paying a helper
	- Under completed requests, each unpaid user will have a Pay button next to them. 
	- The button redirects to Venmo for the requester to authenticate his or her Venmo account.
	- After authentication, Venmo will attempt to make a payment.
		- If successful, it will redirect to a success page.
		- If not, it wil redirect to a failure page (this can result from insufficient funds, unsuccessful authentication, etc.)
		- The user can go back to the home page from either page. 
	- Paid helpers will be marked as paid.

10. Reviewing a request's participants
	- Completed requests allow the participants to review each other a maximum of 1 time
	- This is accessible under the completed requests page, and clicking Submit a Review under a request.
	- A user can select a participant to review, a rating, and write comments about the participant's performance on the request.
	- On submission, the review will appear on the participant's profile page.