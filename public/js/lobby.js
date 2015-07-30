(function () {
    window.socket = io.connect(window.location.href);
    var app = angular.module('lobby', []);

    app.controller('LobbyController', function ($scope, socket) {
        var lobby = this;
        lobby.query = window.location.query();
        lobby.room = {};
        lobby.form = {};

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

        lobby.submit = function (type) {
            socket.reconnect();
            if (type === 'create')
                socket.emit('create', lobby.form.user);
            else if (type === 'join')
                socket.emit('join', {
                    username: lobby.form.user,
                    gameID: lobby.form.gameID
                });

            socket.on('login', function (data) {
                lobby.room.users = data.users;
                lobby.room.user = data.user;
                lobby.room.master = data.users.shift();
                lobby.room.isMaster = lobby.room.master === lobby.room.user;
                lobby.room.id = data.gameID;
                lobby.room.link = window.location.origin + window.location.pathname + '?gameid=' + lobby.room.id;
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
            });
            socket.on('connected user', function (username) {
                lobby.room.users.push(username);
            });
            socket.on('disconnected user', function (data) {
                lobby.showMessage('message', data.user + ' left the room');
                data.users.shift();
                lobby.room.users = data.users;
            });

            return false;
        };

        lobby.room.leave = function () {
            socket.disconnect();
            lobby.room.id = null;
            lobby.room.isStarted = false;
        };

        lobby.room.start = function () {
            socket.emit('start');
        };
    });

    app.factory('socket', function ($rootScope) {

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
})();