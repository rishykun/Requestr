var User = require('./models/schema').User;

var loggedInUsers = {};

var messages = {}; //key = target_user, value = dictionary where key = src, value = array of message tuples (msg, date, self?) including self, msg

var Messagebase = (function Messagebase() {
	var that = Object.create(Messagebase.prototype);

	var io = null;

	that.setIO = function(IO) {
		io = IO;

		//io connection
		io.on('connection', function(socket){
			socket.on('disconnect', function(){
			});

			socket.on('chat message', function(msg, from, to, date) {
				if (Object.keys(messages).indexOf(to) === -1) {
					messages[to] = {};
				}
				if (Object.keys(messages[to]).indexOf(from) === -1) {
					messages[to][from] = [];
				}
				messages[to][from].push([msg, date, false]);
				if (Object.keys(messages).indexOf(from) === -1) {
					messages[from] = {};
				}
				if (Object.keys(messages[from]).indexOf(to) === -1) {
					messages[from][to] = [];
				}
				messages[from][to].push([msg, date, true]);

				io.emit("chat message", msg, from, to, date);
			});
		});
	}

	that.login = function(username) {
		loggedInUsers[username] = true;
		if (io) {
			io.emit("login user", username);
		}
	}

	that.logout =  function(username) {
		loggedInUsers[username] = false;
		if (io) {
			io.emit("logout user", username);
		}
	}

	that.getActiveUsers = function() {
		return loggedInUsers;
	}

	that.getOfflineUsers = function(cb) {
		User.getAllUsers(function(err, result) {
			if (err) {
				console.error(err);
				cb(err);
			} else {
				if (result.length > 0) {
					var userList;
					if (result.length > 1) {
						userList = result.reduce(function(prev, cur, i, arr) {
							if (i == 1) {
								return [prev.username, cur.username]
							} else {
								return prev.concat(cur.username);
							}
						});
					} else {
						userList = [result[0].username];
					}
					var offlineUsers = userList.filter(function(user) {
						return Object.keys(loggedInUsers).indexOf(user) === -1 || !loggedInUsers[user];
					});
					cb(null, offlineUsers);
				} else {
					cb(null, []);
				}
			}
		});
	}

	//get all messages associated with the specified user
	that.getMessagesByUsername = function(username) {

		if (Object.keys(messages).indexOf(username) !== -1) {
			return messages[username];
		} else {
			return {};
		}
	}

	Object.freeze(that); //prevent any further modifications to the member fields and methods of this class
	return that;
})();

module.exports = Messagebase;