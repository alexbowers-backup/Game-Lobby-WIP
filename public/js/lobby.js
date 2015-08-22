(function () {
    window.socket = io.connect(window.location.href);
    var app = angular.module('lobby', []);

    app.controller('LobbyController', function ($scope, $interval, socket) {
        var lobby = this;
        lobby.query = window.location.query();
        lobby.room = {};

        lobby.game = {
            round: {
                i: 0,
                seconds: 30,
                timer: 0,
                moves: []

            },
            resetMoves: function () {
                this.round.moves = [
                    {
                        move: 'stay',
                        fire: 'no'
                    },
                    {
                        move: 'stay',
                        fire: 'no'
                    },
                    {
                        move: 'stay',
                        fire: 'no'
                    },
                    {
                        move: 'stay',
                        fire: 'no'
                    }
                ];
            },
            startRound: function () {
                var lobbyGame = this;
                lobbyGame.round.i++;
                lobbyGame.round.timer = lobbyGame.round.seconds;
                this.resetMoves();

                var interval = $interval(function () {
                    lobbyGame.round.timer--;
                    if (lobbyGame.round.timer < 1) {
                        $interval.cancel(interval);
                        if (lobby.room.isMaster)
                            socket.emit('round ended');
                        socket.emit('round data', {
                            ship: game.userShip,
                            moves: lobby.game.round.moves
                        });
                    }
                }, 1000);
            },
            //startTimer: function (round) {
            //    console.log(round.i, round.seconds);
            //},
            setFire: function (move, fire) {
                var sideFires = {
                    left: [],
                    right: []
                };
                lobby.game.round.moves.forEach(function (move, i) {
                    if (move.fire === 'left')
                        sideFires.left.push(i);
                    else if (move.fire === 'right')
                        sideFires.right.push(i);
                });
                if (fire === 'left' && sideFires.left.length > 1)
                    lobby.game.round.moves[sideFires.left[0]].fire = 'no';
                else if (fire === 'right' && sideFires.right.length > 1)
                    lobby.game.round.moves[sideFires.right[0]].fire = 'no';
                lobby.game.round.moves[move].fire = fire;
            }
        };
        lobby.game.resetMoves();
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
            if (!lobby.form.user) return;
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
                username = lobby.room.user;
            });
            socket.on('login error', function (error) {
                lobby.showMessage('alert', error);
            });
            socket.on('kick', function(message) {
                lobby.showMessage('message', message);
                lobby.room.leave();
            });
            socket.on('game started', function (data) {
                config = data.config;
                lobby.game.isStarted = true;
                gameInit();
                game.updateShips(data.ships);
                //game.userShip.col = 1; ////////////////////////////////////////////////////////////////////////////
                //game.userShip.row = 1; ////////////////////////////////////////////////////////////////////////////
                //game.setActiveShip(lobby.room.user);
                lobby.game.round.i = 0;
                lobby.game.startRound();
                //game.temp.active = ships[0];
                //game.temp.team = ships[0].team;
                //console.log(game);
            });
            socket.on('updated ships', function (data) {
                game.updateShips(data.ships);
                //game.setActiveShip(lobby.room.user);
                var i = 0;
                var interval = $interval(function () {
                    game.runMove(i);
                    i++;
                    if (i === 3)
                        lobby.game.startRound();
                }, 500, 4);
            });
            socket.on('connected user', function (username) {
                lobby.room.users.push(username);
            });
            socket.on('disconnected user', function (data) {
                lobby.showMessage('message', data.user + ' left the room');
                data.users.shift();
                lobby.room.users = data.users;
                if (lobby.game.isStarted)
                    game.getShipByName(data.user).isDead = true;
            });

            return false;
        };

        lobby.room.leave = function () {
            socket.disconnect();
            lobby.room.id = null;
            lobby.game.isStarted = false;
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