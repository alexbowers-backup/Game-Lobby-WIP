(function () {
    window.socket = io.connect(window.location.href);
    var app = angular.module('lobby', []);

    app.controller('LobbyController', function ($scope, $interval, socket) {
        var lobby = this;
        lobby.query = window.location.query();
        lobby.room = {};

        lobby.game = {
            score: {
                left: 0,
                right: 0
            },
            round: {
                i: 0,
                timer: 0,
                interval: null,
                moves: []

            },
            over: false,
            createTimer: function () {
                this.timer = this.timer || new ProgressBar.Circle(document.getElementById('timer'), {
                    duration: 1000,
                    color: 'black',
                    trailColor: "#ddd",
                    strokeWidth: 4,
                    trailWidth: 2
                    //text: {
                    //    style: {
                            //margin: '10px 0 0 0',
                            //'font-size': '24px'
                        //}
                        //alignToBottom: false
                    //}
                });
            },
            scrollToShip: function (ship) {
                var gameWrap = $('#game-wrap');
                var center = gameWrap.height() / 2;
                var shipY =  (ship.row + 0.5) * game.field.cellHeight();
                var scrollTo = shipY - center;
                var props = {
                    scrollTop: scrollTo > 0 ? scrollTo : 0,
                    scrollLeft: ship.team === 'right' ? game.field.width : 0
                };
                gameWrap.animate(props, {duration: 2000});
            },
            reset: function () {
                this.round.i = 0;
                this.over = false;
                this.score = {
                    left: 0,
                    right: 0
                };
                $interval.cancel(this.round.interval);
                window.canvasAnimation = false;
                if (game) {
                    clearInterval(game.fpsInterval);
                }
            },
            finish: function () {
                if (this.score.left > this.score.right) {
                    this.overMessage = game.userShip.team === 'left'
                        ? 'You won'
                        : 'You lost';
                }
                else if (this.score.right > this.score.left) {
                    this.overMessage = game.userShip.team === 'right'
                        ? 'You won'
                        : 'You lost';
                }
                else {
                    this.overMessage = 'Draw';
                }
                window.canvasAnimation = false;
                $interval(function () {
                    lobby.game.isStarted = false;
                    lobby.game.over = true;
                    tooltip.style.display = 'none';
                }, 2000, 1);
            },
            resetMoves: function () {
                this.round.moves = [
                    {
                        move: 'stay',
                        fire: {
                            left: 0,
                            right: 0
                        }
                    },
                    {
                        move: 'stay',
                        fire: {
                            left: 0,
                            right: 0
                        }
                    },
                    {
                        move: 'stay',
                        fire: {
                            left: 0,
                            right: 0
                        }
                    },
                    {
                        move: 'stay',
                        fire: {
                            left: 0,
                            right: 0
                        }
                    }
                ];
            },
            startRound: function () {
                lobby.game.timer.set(1);
                lobby.game.round.i++;
                lobby.game.timer.setText(config.round.timer);
                lobby.game.round.timer = config.round.timer;
                this.resetMoves();
                lobby.game.round.interval = $interval(function () {
                    lobby.game.timer.setText(lobby.game.round.timer);
                    var animateTimer = (lobby.game.round.timer - 1) > 0 ? (lobby.game.round.timer - 1) : 0;
                    lobby.game.timer.animate(animateTimer / config.round.timer);
                    if (lobby.game.round.timer < 1) {
                        $interval.cancel(lobby.game.round.interval);
                        if (lobby.room.isMaster) {
                            socket.emit('round ended');
                        }
                        lobby.game.timer.setText('loading');
                        socket.emit('round data', {
                            ship: game.userShip,
                            moves: lobby.game.round.moves
                        });
                    }
                    lobby.game.round.timer--;
                }, 1000);
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
                lobby.game.reset();
                gameInit();
                game.updateShips(data.ships);
                game.flags = data.flags;
                game.winds = data.winds;
                game.rocks = data.rocks;
                game.whirlpools = data.whirlpools;
                lobby.game.userTeam = game.userShip.team;
                lobby.game.createTimer();
                lobby.game.startRound();
                lobby.game.scrollToShip(game.userShip);
                lobby.game.round.number = config.round.number;
            });
            socket.on('next round', function (data) {
                game.updateShips(data.ships);
                var i = 0;
                var interval = $interval(function () {
                    if (i < 4) {
                        game.runMove(i);
                        lobby.game.timer.setText('move ' + (i + 1) + '/4');
                        game.flags.forEach(function (flag) {
                            if (i === 3) {
                                game.checkFlag(flag, true);
                                lobby.game.score = game.score;
                            }
                            else {
                                game.checkFlag(flag);
                            }
                        });
                    }
                    i++;
                    if (i === 5) {
                        if (lobby.game.round.i === config.round.number) {
                            lobby.game.finish();
                            return;
                        }
                        lobby.game.startRound();
                    }
                }, 4000, 5);
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
            socket.on('log', function (log) {
                var logs = document.getElementById('logs');
                logs.innerHTML += log + '<br>';
            });

            return false;
        };

        lobby.room.leave = function () {
            socket.disconnect();
            lobby.room.id = null;
            lobby.game.isStarted = false;
            lobby.game.reset();
        };

        lobby.room.start = function () {
            socket.emit('start');
        };

        ///////////////////// DEVELOPMENT ///////////////////////////

            //lobby.form.user = 'vasya';
            //lobby.submit('create');
            //lobby.room.start();

        ///////////////////// DEVELOPMENT ///////////////////////////
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