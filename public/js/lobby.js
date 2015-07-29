(function () {
    window.socket = io.connect(window.location.href);
    var app = angular.module('lobby', []);

    app.controller('LobbyController', function ($scope, socket) {
        var lobby = this;
        lobby.query = window.location.query();
        lobby.room = {};
        lobby.form = {};

        //lobby.room = 1;
        //lobby.message = 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the a galley of type and scrambled it to make a type specimen book.';

        lobby.tab = lobby.query.gameid ? 'join' : 'create';
        lobby.form.gameID = lobby.query.gameid ? lobby.query.gameid : null;
        lobby.hasMessage = '';
        lobby.isSelected = function (tab) {
            return lobby.tab === tab;
        };
        lobby.selectTab = function (tab) {
            lobby.tab = tab;
        };
        lobby.showMessage = function (type, msg) {
                $('#message').fadeIn(200).css('display','inline-block');
                lobby.message = msg;
                lobby.messageType = type;
                setTimeout("$('#message').fadeOut(1000)", 3000);
        };

        //var form = document.getElementById('create-form');
        //var room = document.getElementById('room-wrap');
        //var startBtn = document.getElementById('start-btn');
        //var leaveBtn = document.getElementById('leave-btn');
        //var messageDiv = document.getElementById('message-wrap');
        //var users = [];
        //var username = '';

        //form.onsubmit = function () {
        //    username = document.getElementById('create-username').value;
        //    socket.emit('username', username);
        //
        //    socket.on('login', function (usersArr) {
        //        users = usersArr;
        //        updateUsersList(users);
        //        lobby.style.display = 'inline-block';
        //        form.style.display = 'none';
        //        messageDiv.innerHTML = '';
        //        startBtn.style.display = users[0] === username
        //            ? 'inline-block'
        //            : 'none';
        //    });
        //};

        lobby.submit = function (type) {
            socket.reconnect();
            //username = document.getElementById('create-username').value;
            if (type === 'create')
                socket.emit('create', lobby.form.user);
            else if (type === 'join')
                socket.emit('join', {
                    username: lobby.form.user,
                    gameID: lobby.form.gameID
                });

            socket.on('login', function (data) {
                //users = usersArr;
                lobby.room.users = data.users;
                lobby.room.user = data.user;
                lobby.room.master = data.users.shift();
                lobby.room.isMaster = lobby.room.master === lobby.room.user;
                lobby.room.id = data.gameID;
                lobby.room.link = window.location.origin + window.location.pathname + '?gameid=' + lobby.room.id;
                //updateUsersList(users);
                //messageDiv.innerHTML = '';
                //startBtn.style.display = users[0] === username
                //    ? 'inline-block'
                //    : 'none';
            });
            socket.on('login error', function (error) {
                lobby.showMessage('alert', error);
            });
            socket.on('kick', function(message) {
                lobby.showMessage('message', message);
                lobby.room.leave();
            });
            socket.on('game started', function () {
                lobby.room.isStarted = true;
                //var message = 'Game Started';
                //if (lobby.room.user === lobby.room.master) message += '\nYou are the master';
                //lobby.showMessage('message', message, true);
            });
            socket.on('connected user', function (username) {
                lobby.room.users.push(username);
                //updateUsersList(users);
            });
            socket.on('disconnected user', function (data) {
                lobby.showMessage('message', data.user + ' left the room');
                data.users.shift();
                lobby.room.users = data.users;
                //updateUsersList(users);
            });

            return false;
        };

        lobby.room.leave = function () {
            socket.disconnect();
            lobby.room.id = null;
            lobby.room.isStarted = false;
            //console.log("LOGOUT");
        };

        lobby.room.start = function () {
            socket.emit('start');
        };
        //leaveBtn.onclick = logout;

        //function logout() {
        //    connection('off');
        //    room.style.display = 'none';
        //    form.style.display = 'inline-block';
        //}
        //function updateUsersList(users) {
        //    var usersList = document.getElementById('users-list');
        //    var usersArr = users.slice();
        //    var usersListHTML = '';
        //    var master = usersArr.shift();
        //    usersArr.sort();
        //    usersListHTML += '<span id="master">' + master + '</span><br/>';
        //    usersArr.forEach(function (user) {
        //        var currUser = user === username ? ' id="user"' : '';
        //        usersListHTML += '<span' + currUser + '>' + user + '</span><br/>';
        //    });
        //    usersList.innerHTML = usersListHTML;
        //}
        //function showMessage(type, message) {
        //    messageDiv.innerHTML = '<div class="' + type + '">' + message + '</div>';
        //}


    });

    app.factory('socket', function ($rootScope) {

        //var socket = connection('on', socket);

        return {
            socket: window.socket,
            reconnect: function () {
                if (window.socket.disconnected) {
                    window.socket = io.connect(window.location.href, {'forceNew': true});
                }
                this.socket = window.socket;
            },
            on: function (eventName, callback) {
                var socket = this.socket;
                socket.on(eventName, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        callback.apply(socket, args);
                    });
                });
            },
            emit: function (eventName, data, callback) {
                var socket = this.socket;
                socket.emit(eventName, data, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        if (callback) {
                            callback.apply(socket, args);
                        }
                    });
                });
            },
            disconnect: function () {
                this.socket.disconnect();
            }
        };
    });

    if(!window.location.query) {
        window.location.query = function(){
            var map = {};

            if ("" != this.search) {
                var groups = this.search.substr(1).split("&"), i;

                for (i in groups) {
                    i = groups[i].split("=");
                    map[decodeURIComponent(i[0])] = decodeURIComponent(i[1]);
                }
            }

            return map;
        };
    }

    //function connection(state) {
    //    console.log('connection');
    //    if (state === 'on') {
    //        if (!window.socket)
    //            return io.connect(window.location.href);
    //        else if (window.socket.disconnected)
    //            return io.connect(window.location.href, {'forceNew': true});
    //    }
    //    else if (state === 'off')
    //        socket.disconnect();
    //}
})();