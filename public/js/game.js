var game;
var username;
var config;
var tooltip;
var safeZoneImage = new Image();
safeZoneImage.src = 'images/safe-zone.png';
var openSeaImage = new Image();
openSeaImage.src = 'images/open-sea.png';
var whirlpoolImage = new Image();
whirlpoolImage.src = 'images/whirlpool.png';
var gameInit = function () {
    var canvasWrap = document.getElementById('game-wrap');
    var canvas = document.getElementById("game");
    var curCol, curRow;
    var safeZoneImage = new Image();
    var openSeaImage = new Image();
    safeZoneImage.src = 'images/safe-zone.png';
    openSeaImage.src = 'images/open-sea.png';
    tooltip = document.getElementById('tooltip');
    canvas.width = config.field.width;
    canvas.height = config.field.height;
    canvas.onmousemove = function showTooltip(e) {
        var mouseX, mouseY;
        var wrapX = (e.pageX - canvasWrap.offsetLeft) * 0.99;
        var wrapY = (e.pageY - canvasWrap.offsetTop) * 0.97;

        if(e.offsetX) {
            mouseX = e.offsetX;
            mouseY = e.offsetY;
        }
        else if(e.layerX) {
            mouseX = e.layerX;
            mouseY = e.layerY;
        }
        var newCol = Math.floor(mouseX / game.field.cellWidth());
        var newRow = Math.floor(mouseY / game.field.cellHeight());

        if (newCol != curCol || newRow != curRow) {
            if (isNaN(newCol) || isNaN(newRow)) return;
            curCol = newCol;
            curRow = newRow;
        }
        for (var i in game.ships) {
            var ship = game.ships[i];
            if (curCol == ship.col && curRow == ship.row) {
                tooltip.style.top = (wrapY + 30) + 'px';
                tooltip.style.left = (wrapX + 30) + 'px';
                tooltip.innerHTML = '' +
                    'Name: <b>' + ship.name + '</b> <br>' +
                    'HP: ' + ship.hp;
                tooltip.style.display = 'block';
                ship.showCircle = true;
                break;
            }
            else {
                tooltip.style.display = 'none';
                ship.showCircle = false;
            }
        }
    };

    if (canvas.getContext) {
        game = {
            ctx: canvas.getContext("2d"),
            lastFrameTime: {},
            ships: [],
            flags: [],
            winds: [],
            rocks: [],
            whirlpools: [],
            score: {
                left: 0,
                right: 0
            },
            field: {
                columns: config.field.columns,
                rows: config.field.rows,
                width: config.field.width,
                height: config.field.height,
                cellWidth: function () {
                    return this.width / this.columns
                },
                cellHeight: function () {
                    return this.width / this.columns
                }
            },
            runFrame: function (now, fps, i) {
                this.lastFrameTime[i] = this.lastFrameTime[i] ? this.lastFrameTime[i] : now;
                var timePassed = now - this.lastFrameTime[i];
                if (timePassed >= 999 / fps) {
                    this.lastFrameTime[i] = now;
                    return true;
                }
                return false;
            },
            drawGrid: function () {
                //width
                for (var i = 1; i < this.field.columns; i++) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(i * this.field.cellWidth(), 0);
                    this.ctx.lineTo(i * this.field.cellWidth(), this.field.height);
                    this.ctx.stroke();
                }
                //height
                for (var i = 1; i < this.field.rows; i++) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, i * this.field.cellHeight());
                    this.ctx.lineTo(this.field.width, i * this.field.cellHeight());
                    this.ctx.stroke();
                }
            },
            drawZones: function () {
                for (var i = 0; i < game.field.columns; i++) {
                    for (var j = 0; j < config.field.rows; j++) {
                        this.ctx.drawImage(
                            safeZoneImage,
                            this.field.cellWidth() * i,
                            this.field.cellHeight() * j,
                            this.field.cellWidth(),
                            this.field.cellHeight()
                        );
                    }
                    if (i === 2) {
                        i = game.field.columns - 4;
                    }
                }
                for (var i = 3; i < game.field.columns - 3; i++) {
                    for (var j = 0; j < config.field.rows; j++) {
                        this.ctx.drawImage(
                            openSeaImage,
                            this.field.cellWidth() * i,
                            this.field.cellHeight() * j,
                            this.field.cellWidth(),
                            this.field.cellHeight()
                        );
                    }

                }
            },
            drawTriangle: function (x, y, angle) {
                this.ctx.save();
                this.ctx.translate(x, y);
                this.ctx.rotate(angle * Math.PI / 180);
                this.ctx.translate(-x, -y);
                var triangle = new Path2D();
                triangle.moveTo(
                    x,
                    y - this.field.cellHeight() * 0.25
                );
                triangle.lineTo(
                    x + this.field.cellWidth() * 0.25,
                    y + this.field.cellHeight() * 0.25
                );
                triangle.lineTo(
                    x - this.field.cellWidth() * 0.25,
                    y + this.field.cellHeight() * 0.25
                );
                this.ctx.fill(triangle);
                this.ctx.restore();
            },
            drawShip: function (ship) {
                //var shift = 0;
                if (ship.isDead) {
                    this.ctx.fillStyle = 'black';
                }
                else {
                    if (ship.name === game.userShip.name) {
                        this.ctx.fillStyle = config.colors.userColor;
                        ship.teamColor = config.colors.allyColor;
                    }
                    else if (ship.team === game.userShip.team) {
                        this.ctx.fillStyle = config.colors.allyColor;
                        ship.teamColor = config.colors.allyColor;
                    }
                    else {
                        this.ctx.fillStyle = config.colors.enemyColor;
                        ship.teamColor = config.colors.enemyColor;
                    }
                }
                //var triangle = new Path2D();
                //if (ship.isDamaged) {
                //    shift = ship.isDamaged % 2 ? 5 : -5;
                //}
                this.drawTriangle(ship.x, ship.y, ship.animation.angle);
            },
            drawFlag: function (flag) {
                this.ctx.fillStyle = flag.color;
                this.ctx.fillRect(
                    flag.col * this.field.cellWidth() + this.field.cellWidth() * 0.125,
                    flag.row * this.field.cellHeight() + this.field.cellHeight() * 0.25,
                    this.field.cellWidth() * 0.750,
                    this.field.cellHeight() * 0.5
                );
                this.ctx.fillStyle = flag.color === 'white' ? 'black': 'white';
                this.ctx.font = (this.field.cellWidth() * 0.375) + 'px Arial';
                this.ctx.fillText(
                    flag.points,
                    (flag.col * this.field.cellWidth() + this.field.cellWidth() * 0.5) - (this.field.cellWidth() * 0.375) * 0.25,
                    (flag.row * this.field.cellHeight() + this.field.cellHeight() * 0.5) + (this.field.cellWidth() * 0.375) * 0.33
                );

            },
            drawRock: function (rock) {
                this.ctx.beginPath();
                this.ctx.arc(
                    rock.col * this.field.cellWidth() + this.field.cellWidth() * 0.5,
                    rock.row * this.field.cellHeight() + this.field.cellHeight() * 0.5,
                    this.field.cellWidth() * 0.3,
                    0,
                    2 * Math.PI,
                    false
                );
                this.ctx.fillStyle = 'white';
                this.ctx.fill();
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
                this.ctx.lineWidth = 1;
            },
            drawWhirlpool: function (whirlpool) {
                this.ctx.drawImage(
                    whirlpoolImage,
                    this.field.cellWidth() * whirlpool.col[0],
                    this.field.cellHeight() * whirlpool.row[0],
                    this.field.cellWidth() * 2,
                    this.field.cellHeight() * 2
                );
            },
            drawWind: function (wind) {
                this.ctx.fillStyle = 'black';
                this.ctx.fillStyle = 'black';
                this.ctx.lineWidth = 4;
                var arrow = new Path2D();
                switch (wind.direction) {
                    case 'right':
                        arrow.moveTo(
                            wind.col * this.field.cellWidth() + this.field.cellHeight() / 6,
                            wind.row * this.field.cellHeight() + this.field.cellHeight() / 4
                        );
                        arrow.lineTo(
                            wind.col * this.field.cellWidth() + this.field.cellHeight() / 2,
                            wind.row * this.field.cellHeight() + this.field.cellHeight() / 2
                        );
                        arrow.lineTo(
                            wind.col * this.field.cellWidth() + this.field.cellWidth() / 6,
                            wind.row * this.field.cellHeight() + this.field.cellHeight() * 0.75
                        );

                        arrow.moveTo(
                            wind.col * this.field.cellWidth() + this.field.cellHeight() / 2,
                            wind.row * this.field.cellHeight() + this.field.cellHeight() / 4
                        );
                        arrow.lineTo(
                            wind.col * this.field.cellWidth() + this.field.cellHeight() / 6 * 5,
                            wind.row * this.field.cellHeight() + this.field.cellHeight() / 2
                        );
                        arrow.lineTo(
                            wind.col * this.field.cellWidth() + this.field.cellWidth() / 2,
                            wind.row * this.field.cellHeight() + this.field.cellHeight() * 0.75
                        );
                        break;
                    case 'left':
                        arrow.moveTo(
                            wind.col * this.field.cellWidth() + this.field.cellHeight() / 2,
                            wind.row * this.field.cellHeight() + this.field.cellHeight() / 4
                        );
                        arrow.lineTo(
                            wind.col * this.field.cellWidth() + this.field.cellHeight() / 6,
                            wind.row * this.field.cellHeight() + this.field.cellHeight() / 2
                        );
                        arrow.lineTo(
                            wind.col * this.field.cellWidth() + this.field.cellWidth() / 2,
                            wind.row * this.field.cellHeight() + this.field.cellHeight() * 0.75
                        );

                        arrow.moveTo(
                            wind.col * this.field.cellWidth() + this.field.cellHeight() / 6 * 5,
                            wind.row * this.field.cellHeight() + this.field.cellHeight() / 4
                        );
                        arrow.lineTo(
                            wind.col * this.field.cellWidth() + this.field.cellHeight() / 2,
                            wind.row * this.field.cellHeight() + this.field.cellHeight() / 2
                        );
                        arrow.lineTo(
                            wind.col * this.field.cellWidth() + this.field.cellWidth() / 6 * 5,
                            wind.row * this.field.cellHeight() + this.field.cellHeight() * 0.75
                        );
                        break;
                    case 'up':
                        arrow.moveTo(
                            wind.col * this.field.cellWidth() + this.field.cellHeight() / 4,
                            wind.row * this.field.cellHeight() + this.field.cellHeight() / 2
                        );
                        arrow.lineTo(
                            wind.col * this.field.cellWidth() + this.field.cellHeight() / 2,
                            wind.row * this.field.cellHeight() + this.field.cellHeight() / 6
                        );
                        arrow.lineTo(
                            wind.col * this.field.cellWidth() + this.field.cellWidth() * 0.75,
                            wind.row * this.field.cellHeight() + this.field.cellHeight() / 2
                        );

                        arrow.moveTo(
                            wind.col * this.field.cellWidth() + this.field.cellHeight() / 4,
                            wind.row * this.field.cellHeight() + this.field.cellHeight() / 6 * 5
                        );
                        arrow.lineTo(
                            wind.col * this.field.cellWidth() + this.field.cellHeight() / 2,
                            wind.row * this.field.cellHeight() + this.field.cellHeight() / 2
                        );
                        arrow.lineTo(
                            wind.col * this.field.cellWidth() + this.field.cellWidth() * 0.75,
                            wind.row * this.field.cellHeight() + this.field.cellHeight() / 6 * 5
                        );
                        break;
                    case 'down':
                        arrow.moveTo(
                            wind.col * this.field.cellWidth() + this.field.cellHeight() / 4,
                            wind.row * this.field.cellHeight() + this.field.cellHeight() / 6
                        );
                        arrow.lineTo(
                            wind.col * this.field.cellWidth() + this.field.cellHeight() / 2,
                            wind.row * this.field.cellHeight() + this.field.cellHeight() / 2
                        );
                        arrow.lineTo(
                            wind.col * this.field.cellWidth() + this.field.cellWidth() * 0.75,
                            wind.row * this.field.cellHeight() + this.field.cellHeight() / 6
                        );

                        arrow.moveTo(
                            wind.col * this.field.cellWidth() + this.field.cellHeight() / 4,
                            wind.row * this.field.cellHeight() + this.field.cellHeight() / 2
                        );
                        arrow.lineTo(
                            wind.col * this.field.cellWidth() + this.field.cellHeight() / 2,
                            wind.row * this.field.cellHeight() + this.field.cellHeight() / 6 * 5
                        );
                        arrow.lineTo(
                            wind.col * this.field.cellWidth() + this.field.cellWidth() * 0.75,
                            wind.row * this.field.cellHeight() + this.field.cellHeight() / 2
                        );
                        break;
                }
                this.ctx.stroke(arrow);
                this.ctx.lineWidth = 1;
            },
            drawCircle: function (ship) {
                this.ctx.beginPath();
                this.ctx.arc(
                   ship.col * this.field.cellWidth() + this.field.cellWidth() * 0.5,
                   ship.row * this.field.cellHeight() + this.field.cellHeight() * 0.5,
                   this.field.cellWidth() * 3.5,
                   0,
                   2 * Math.PI,
                   false
                );
                //this.ctx.strokeStyle = 'black';
                this.ctx.stroke();
            },
            drawCannonball: function (cannonball) {
                this.ctx.beginPath();
                this.ctx.lineWidth = 4;
                this.ctx.arc(
                    cannonball.x,
                    cannonball.y,
                    this.field.cellWidth() * 0.125,
                    0,
                    2 * Math.PI,
                    false
                );
                this.ctx.fillStyle = 'yellow';
                this.ctx.fill();
                this.ctx.lineWidth = 1;
            },
            update: function (now) {
                this.drawZones();
                this.drawGrid();
                this.flags.forEach(function (flag) {
                    game.drawFlag(flag);
                });
                this.winds.forEach(function (wind) {
                    game.drawWind(wind);
                });
                this.whirlpools.forEach(function (whirlpool) {
                    game.drawWhirlpool(whirlpool);
                });
                this.rocks.forEach(function (rock) {
                    game.drawRock(rock);
                });
                this.ships.forEach(function (ship, i) {
                    if (ship.isDamaged === true) {
                        game.ships[i].isDamaged = 1;
                    }
                    if (ship.animation.moves[0]) {
                        //if (ship.animation.checkPosition) {
                        //    if (Math.pow(ship.x - ship.getX(), 2) + Math.pow(ship.y - ship.getY(), 2) < Math.pow(game.field.cellHeight() / 4, 2)) {
                        //        ship.animation.checkLimit = true;
                        //    }
                        //    if (ship.animation.checkLimit) {
                        //        game.animations.checkLimit(ship);
                        //    }
                        //}
                        if (ship.animation.collision) {
                            game.animations.checkCollision(ship);
                        }
                        var animationName = Object.keys(ship.animation.moves[0])[0];
                        var animationParams = ship.animation.moves[0][animationName];
                        game.animations[animationName](ship, animationParams);
                    }
                    game.drawShip(ship);
                    if (ship.showCircle) {
                        game.drawCircle(ship);
                    }
                    if (ship.isDamaged !== false) {
                        game.ships[i].isDamaged++;
                    }
                    if (ship.isDamaged > 10) {
                        game.ships[i].isDamaged = false;
                    }
                    if (ship.cannonballs.length) {
                        game.animations.cannonFire(ship);
                    }
                });

                this.frame = this.frame ? this.frame + 1 : 1;
            },
            getShip: function (col, row) {
                for (var i in this.ships) {
                    var ship = this.ships[i];
                    if (ship.col === col && ship.row === row) {
                        return ship;
                    }
                }
                return false;
            },
            checkFlag: function (flag, lastRound) {
                var ships = [];
                var game = this;
                game.ships.forEach(function (ship) {
                    var flagX = (flag.col + 0.5) * game.field.cellWidth();
                    var flagY = (flag.row + 0.5) * game.field.cellHeight();
                    var flagR = game.field.cellWidth() * 3.5;
                    if (Math.pow(ship.getX() - flagX, 2) + Math.pow(ship.getY() - flagY, 2) < Math.pow(flagR, 2)) {
                        ships.push(ship);
                    }
                });
                var teams = {
                    left: false,
                    right: false
                };
                var points = {
                    left: 0,
                    right: 0
                };
                flag.color = 'white';
                ships.forEach(function (ship) {
                    teams[ship.team] = true;
                    if (teams.left && teams.right) {
                        flag.color = 'black';
                        points.left = 0;
                        points.right = 0;
                    }
                    else {
                        flag.color = ship.teamColor;
                        if (lastRound) {
                            points[ship.team] = flag.points;
                        }
                    }
                });
                game.score.left += points.left;
                game.score.right += points.right;
            },
            animations: {
                //TODO: perform all "takeDamage" here
                checkCollision: function (ship) {
                    //if (!(Math.pow(ship.x - ship.getX(), 2) + Math.pow(ship.y - ship.getY(), 2) < Math.pow(game.field.cellHeight() / 4, 2))) {
                    //    ship.animation.stop = true;
                    //    ship.animation.checkPosition = false;
                    //    ship.animation.checkLimit = false;
                    //    ship.x = ship.getX();
                    //    ship.y = ship.getY();
                    //}
                    if (Math.abs(ship.animation.collision.x - ship.x) < game.field.cellHeight() * 0.75
                        && Math.abs(ship.animation.collision.y - ship.y) < game.field.cellHeight() * 0.75) {
                        ship.animation.stop = true;
                        ship.animation.collision = 0;
                        ship.x = ship.getX();
                        ship.y = ship.getY();
                    }
                },
                cannonFire: function (ship) {
                    ship.cannonballs.forEach(function (cannonball, i) {
                        game.drawCannonball(cannonball);
                        var modifier = cannonball.direction === 'left' ? -config.ship.cannonballSpeed : config.ship.cannonballSpeed;
                        cannonball.distance = cannonball.distance
                            ? cannonball.distance + config.ship.cannonballSpeed
                            : config.ship.cannonballSpeed;
                        switch (cannonball.shipDirection) {
                            case 'right':
                                cannonball.y += modifier;
                                break;
                            case 'left':
                                cannonball.y -= modifier;
                                break;
                            case 'up':
                                cannonball.x += modifier;
                                break;
                            case 'down':
                                cannonball.x -= modifier;
                                break;
                        }
                        if (cannonball.distance >= game.field.cellHeight() * 3) {
                            delete ship.cannonballs[i];
                            return;
                        }

                        for (var s in game.ships) {
                            var ship2 = game.ships[s];
                            if (Math.abs(ship2.getX() - cannonball.x) < game.field.cellHeight() * 0.25
                                && Math.abs(ship2.getY() - cannonball.y) < game.field.cellHeight() * 0.25) {
                                if (!ship2.isDead) {
                                    ship2.takeDamage(ship2.cannonDamage);
                                    delete ship.cannonballs[i];
                                    return;
                                }
                            }
                        }
                        for (var r in game.rocks) {
                            var rock = game.rocks[r];
                            if (Math.abs((rock.col + 0.5) * game.field.cellWidth() - cannonball.x) < (game.field.cellHeight() * 0.25 + 12)
                                && Math.abs((rock.row + 0.5) * game.field.cellHeight() - cannonball.y) < (game.field.cellHeight() * 0.25 + 12)) {
                                delete ship.cannonballs[i];
                                return;
                            }
                        }
                    });
                },
                wind: function (ship, wind) {
                    if (ship.animation.frame === config.animationSpeed.forward || ship.animation.stop) {
                        ship.animation.frame = 0;
                        ship.animation.stop = false;
                        ship.animation.moves.shift();
                        return;
                    }
                    switch (wind.direction) {
                        case 'left':
                            ship.x -= game.field.cellHeight() / config.animationSpeed.forward;
                            break;
                        case 'right':
                            ship.x += game.field.cellHeight() / config.animationSpeed.forward;
                            break;
                        case 'up':
                            ship.y -= game.field.cellHeight() / config.animationSpeed.forward;
                            break;
                        case 'down':
                            ship.y += game.field.cellHeight() / config.animationSpeed.forward;
                            break;
                    }
                    ship.animation.frame++;
                },
                whirlpool: function (ship, position) {
                    //var whirlpool = params[0];
                    //var position = params[1];
                    var speed = config.animationSpeed.turn;
                    var side = 'right';
                    //var side = ship.animation.moves[0].split('-')[1];
                    ship.animation.frame++;
                    if (!ship.animation.maxFrameR) {
                        ship.animation.maxFrameR = speed[0] + speed[1] + speed[0];
                    }
                    if (ship.animation.frame > speed[0] + speed[1] + speed[0] || ship.animation.stop) {
                        ship.animation.frame = 0;
                        ship.animation.turn = 0;
                        ship.animation.direction = 0;
                        ship.animation.moves.shift();
                        if (ship.animation.stop) {
                            ship.animation.stop = false;
                            ship.animation.moves.push({rotate: side});
                        }
                        else {
                            ship.animation.frameR = 0;
                        }
                        return;
                    }
                    var modifier = 1;
                    //var directions = ['up', 'right', 'down', 'left'];
                    //var angleNumber = ship.animation.angle / 90;
                    //if (angleNumber < 0) {
                    //    angleNumber = angleNumber % 4 + 4;
                    //}
                    //angleNumber %= 4;
                    //if (!ship.animation.direction) {
                    //    ship.animation.direction = directions[angleNumber];
                    //}
                    switch (position) {
                        case 0:
                            if (ship.animation.frame <= speed[0]) {
                                ship.x += game.field.cellHeight() / 2 / speed[0];
                            }
                            else if (ship.animation.frame <= speed[0] + speed[1]) {
                                var angle = side === 'right' ? 270 : 90;
                                angle += (90 / speed[1] * (ship.animation.frame - speed[0])) * modifier;
                                if (!ship.animation.turn) {
                                    ship.animation.turn = {
                                        circleX: ship.x,
                                        circleY: ship.y + game.field.cellWidth() / 2 * modifier,
                                        circleR: game.field.cellHeight() * 0.5
                                    };
                                }
                                var circleA = Math.PI / 180 * angle;
                                ship.x = ship.animation.turn.circleX + ship.animation.turn.circleR * Math.cos(circleA);
                                ship.y = ship.animation.turn.circleY + ship.animation.turn.circleR * Math.sin(circleA);
                            }
                            else if (ship.animation.frame <= speed[0] + speed[1] + speed[0]) {
                                ship.y += (game.field.cellWidth() / 2 / speed[0]) * modifier;
                            }
                            break;
                        case 1:
                            if (ship.animation.frame <= speed[0]) {
                                ship.y += (game.field.cellHeight() / 2 / speed[0]);
                            }
                            else if (ship.animation.frame <= speed[0] + speed[1]) {
                                var angle = side === 'right' ? 360 : 180;
                                angle += (90 / speed[1] * (ship.animation.frame - speed[0])) * modifier;
                                if (!ship.animation.turn) {
                                    ship.animation.turn = {
                                        circleX: ship.x - game.field.cellWidth() / 2 * modifier,
                                        circleY: ship.y,
                                        circleR: game.field.cellHeight() * 0.5
                                    };
                                }
                                var circleA = Math.PI / 180 * angle;
                                ship.x = ship.animation.turn.circleX + ship.animation.turn.circleR * Math.cos(circleA);
                                ship.y = ship.animation.turn.circleY + ship.animation.turn.circleR * Math.sin(circleA);
                            }
                            else if (ship.animation.frame <= speed[0] + speed[1] + speed[0]) {
                                ship.x -= (game.field.cellWidth() / 2 / speed[0]) * modifier;
                            }
                            break;
                        case 2:
                            if (ship.animation.frame <= speed[0]) {
                                ship.x -= game.field.cellHeight() / 2 / speed[0];
                            }
                            else if (ship.animation.frame <= speed[0] + speed[1]) {
                                var angle = side === 'left' ? 270 : 90;
                                angle += (90 / speed[1] * (ship.animation.frame - speed[0])) * modifier;
                                if (!ship.animation.turn) {
                                    ship.animation.turn = {
                                        circleX: ship.x,
                                        circleY: ship.y - game.field.cellWidth() / 2 * modifier,
                                        circleR: game.field.cellHeight() * 0.5
                                    };
                                }
                                var circleA = Math.PI / 180 * angle;
                                ship.x = ship.animation.turn.circleX + ship.animation.turn.circleR * Math.cos(circleA);
                                ship.y = ship.animation.turn.circleY + ship.animation.turn.circleR * Math.sin(circleA);
                            }
                            else if (ship.animation.frame <= speed[0] + speed[1] + speed[0]) {
                                ship.y -= (game.field.cellWidth() / 2 / speed[0]) * modifier;
                            }
                            break;
                        case 3:
                            if (ship.animation.frame <= speed[0]) {
                                ship.y -= game.field.cellHeight() / 2 / speed[0];
                            }
                            else if (ship.animation.frame <= speed[0] + speed[1]) {
                                var angle = side === 'left' ? 360 : 180;
                                angle += (90 / speed[1] * (ship.animation.frame - speed[0])) * modifier;
                                if (!ship.animation.turn) {
                                    ship.animation.turn = {
                                        circleX: ship.x + game.field.cellWidth() / 2 * modifier,
                                        circleY: ship.y,
                                        circleR: game.field.cellHeight() * 0.5
                                    };
                                }
                                var circleA = Math.PI / 180 * angle;
                                ship.x = ship.animation.turn.circleX + ship.animation.turn.circleR * Math.cos(circleA);
                                ship.y = ship.animation.turn.circleY + ship.animation.turn.circleR * Math.sin(circleA);
                            }
                            else if (ship.animation.frame <= speed[0] + speed[1] + speed[0]) {
                                ship.x += (game.field.cellWidth() / 2 / speed[0]) * modifier;
                            }
                            break;
                    }
                    this.rotate(ship, side);
                },
                forward: function (ship) {
                    if (ship.animation.frame === config.animationSpeed.forward || ship.animation.stop) {
                        ship.animation.frame = 0;
                        ship.animation.stop = false;
                        ship.animation.moves.shift();
                        return;
                    }
                    var directions = ['up', 'right', 'down', 'left'];
                    var angleNumber = ship.animation.angle / 90;
                    if (angleNumber < 0) {
                        angleNumber = angleNumber % 4 + 4;
                    }
                    angleNumber %= 4;
                    switch (directions[angleNumber]) {
                        case 'left':
                            ship.x -= game.field.cellHeight() / config.animationSpeed.forward;
                            break;
                        case 'right':
                            ship.x += game.field.cellHeight() / config.animationSpeed.forward;
                            break;
                        case 'up':
                            ship.y -= game.field.cellHeight() / config.animationSpeed.forward;
                            break;
                        case 'down':
                            ship.y += game.field.cellHeight() / config.animationSpeed.forward;
                            break;
                    }
                    ship.animation.frame++;
                },
                rotate: function (ship, side) {
                    var name = Object.keys(ship.animation.moves[0])[0];
                    if (ship.animation.frameR === ship.animation.maxFrameR) {
                        ship.animation.frameR = 0;
                        ship.animation.maxFrameR = 0;
                        if (name === 'rotate') {
                            ship.animation.moves.shift();
                        }
                        return;
                    }
                    //var side = ship.animation.moves[0].split('-')[1];
                    var step = 90 / ship.animation.maxFrameR;
                    ship.animation.frameR++;
                    ship.animation.angle = side === 'left' ? ship.animation.angle - step : ship.animation.angle + step;
                },
                turn: function (ship, side) {
                    var speed = config.animationSpeed.turn;
                    //var side = ship.animation.moves[0].split('-')[1];
                    ship.animation.frame++;
                    if (!ship.animation.maxFrameR) {
                        ship.animation.maxFrameR = speed[1];
                    }
                    if (ship.animation.frame > speed[0] + speed[1] + speed[0] || ship.animation.stop) {
                        ship.animation.frame = 0;
                        ship.animation.turn = 0;
                        ship.animation.direction = 0;
                        ship.animation.moves.shift();
                        if (ship.animation.stop) {
                            ship.animation.stop = false;
                            ship.animation.moves.push({rotate: side});
                        }
                        else {
                            ship.animation.frameR = 0;
                        }
                        return;
                    }
                    var modifier = side === 'left' ? -1 : 1;
                    var directions = ['up', 'right', 'down', 'left'];
                    var angleNumber = ship.animation.angle / 90;
                    if (angleNumber < 0) {
                        angleNumber = angleNumber % 4 + 4;
                    }
                    angleNumber %= 4;
                    if (!ship.animation.direction) {
                        ship.animation.direction = directions[angleNumber];
                    }
                    //console.log(ship.animation.frame);
                    switch (ship.animation.direction) {
                        case 'left':
                            if (ship.animation.frame <= speed[0]) {
                                ship.x -= game.field.cellHeight() / 2 / speed[0];
                            }
                            else if (ship.animation.frame <= speed[0] + speed[1]) {
                                this.rotate(ship, side);
                                var angle = side === 'left' ? 270 : 90;
                                angle += (90 / speed[1] * (ship.animation.frame - speed[0])) * modifier;
                                if (!ship.animation.turn) {
                                    ship.animation.turn = {
                                        circleX: ship.x,
                                        circleY: ship.y - game.field.cellWidth() / 2 * modifier,
                                        circleR: game.field.cellHeight() * 0.5
                                    };
                                }
                                var circleA = Math.PI / 180 * angle;
                                ship.x = ship.animation.turn.circleX + ship.animation.turn.circleR * Math.cos(circleA);
                                ship.y = ship.animation.turn.circleY + ship.animation.turn.circleR * Math.sin(circleA);
                            }
                            else if (ship.animation.frame <= speed[0] + speed[1] + speed[0]) {
                                ship.y -= (game.field.cellWidth() / 2 / speed[0]) * modifier;
                            }
                            break;
                        case 'right':
                            if (ship.animation.frame <= speed[0]) {
                                ship.x += game.field.cellHeight() / 2 / speed[0];
                            }
                            else if (ship.animation.frame <= speed[0] + speed[1]) {
                                this.rotate(ship, side);
                                var angle = side === 'right' ? 270 : 90;
                                angle += (90 / speed[1] * (ship.animation.frame - speed[0])) * modifier;
                                if (!ship.animation.turn) {
                                    ship.animation.turn = {
                                        circleX: ship.x,
                                        circleY: ship.y + game.field.cellWidth() / 2 * modifier,
                                        circleR: game.field.cellHeight() * 0.5
                                    };
                                }
                                var circleA = Math.PI / 180 * angle;
                                ship.x = ship.animation.turn.circleX + ship.animation.turn.circleR * Math.cos(circleA);
                                ship.y = ship.animation.turn.circleY + ship.animation.turn.circleR * Math.sin(circleA);
                            }
                            else if (ship.animation.frame <= speed[0] + speed[1] + speed[0]) {
                                ship.y += (game.field.cellWidth() / 2 / speed[0]) * modifier;
                            }
                            break;
                        case 'up':
                            if (ship.animation.frame <= speed[0]) {
                                ship.y -= game.field.cellHeight() / 2 / speed[0];
                            }
                            else if (ship.animation.frame <= speed[0] + speed[1]) {
                                this.rotate(ship, side);
                                var angle = side === 'left' ? 360 : 180;
                                angle += (90 / speed[1] * (ship.animation.frame - speed[0])) * modifier;
                                if (!ship.animation.turn) {
                                    ship.animation.turn = {
                                        circleX: ship.x + game.field.cellWidth() / 2 * modifier,
                                        circleY: ship.y,
                                        circleR: game.field.cellHeight() * 0.5
                                    };
                                }
                                var circleA = Math.PI / 180 * angle;
                                ship.x = ship.animation.turn.circleX + ship.animation.turn.circleR * Math.cos(circleA);
                                ship.y = ship.animation.turn.circleY + ship.animation.turn.circleR * Math.sin(circleA);
                            }
                            else if (ship.animation.frame <= speed[0] + speed[1] + speed[0]) {
                                ship.x += (game.field.cellWidth() / 2 / speed[0]) * modifier;
                            }
                            break;
                        case 'down':
                            if (ship.animation.frame <= speed[0]) {
                                ship.y += (game.field.cellHeight() / 2 / speed[0]);
                            }
                            else if (ship.animation.frame <= speed[0] + speed[1]) {
                                this.rotate(ship, side);
                                var angle = side === 'right' ? 360 : 180;
                                angle += (90 / speed[1] * (ship.animation.frame - speed[0])) * modifier;
                                if (!ship.animation.turn) {
                                    ship.animation.turn = {
                                        circleX: ship.x - game.field.cellWidth() / 2 * modifier,
                                        circleY: ship.y,
                                        circleR: game.field.cellHeight() * 0.5
                                    };
                                }
                                var circleA = Math.PI / 180 * angle;
                                ship.x = ship.animation.turn.circleX + ship.animation.turn.circleR * Math.cos(circleA);
                                ship.y = ship.animation.turn.circleY + ship.animation.turn.circleR * Math.sin(circleA);
                            }
                            else if (ship.animation.frame <= speed[0] + speed[1] + speed[0]) {
                                ship.x -= (game.field.cellWidth() / 2 / speed[0]) * modifier;
                            }
                            break;
                    }
                }
            },
            findCollisions: function () {
                var collidedShips = [];
                for (var i in this.ships) {
                    var ship1 = this.ships[i];
                    for (var j = Number(i) + 1; j < this.ships.length; j++) {
                        var ship2 = this.ships[j];
                        if (ship1.col === ship2.col && ship1.row === ship2.row) {
                            collidedShips.push(ship1, ship2);
                        }
                    }
                    this.rocks.forEach(function (rock) {
                        if (ship1.col === rock.col && ship1.row === rock.row) {
                            collidedShips.push(ship1);
                        }
                    });
                }
                return collidedShips;
            },
            resolveCollisions: function (move) {
                var ships = this.findCollisions();
                if (ships.length) {
                    for (var i in ships) {
                        var ship = ships[i];
                        if (ship.turning)
                            ship.turning = false;
                        ship.roundMoves = ship.roundMoves || [{}, {}, {}, {}];
                        if (ship.roundMoves[move].move !== 'stay') {
                            ship.restorePosition();
                        }
                        if (ship.roundMoves[move].secondary !== undefined && ship.roundMoves[move].secondary.type === 'wind') {
                            ship.restorePosition();
                        }
                        if (ship.roundMoves[move].secondary !== undefined && ship.roundMoves[move].secondary.type === 'whirlpool') {
                            ship.restorePosition();
                            ship.takeDamage(ship.bumpDamage);
                            return 'whirlpool';
                        }
                        ship.takeDamage(ship.bumpDamage);
                    }
                }
            },
            //TODO: move timeouts to lobby
            runMove: function (move) {
                var turningShips = [];
                this.ships.forEach(function (ship) {
                    ship.turning = false;
                    if (ship.isDead) return;
                    if (!ship.roundMoves.length) return;
                    switch (ship.roundMoves[move].move) {
                        case 'forward':
                            ship.animation.moves.push({forward: ''});
                            ship.forward();
                            break;
                        case 'turn-left':
                            ship.animation.moves.push({turn: 'left'});
                            if (ship.forward())
                                turningShips.push(ship);
                            ship.rotate('left');
                            ship.turning = true;
                            break;
                        case 'turn-right':
                            ship.animation.moves.push({turn: 'right'});
                            if (ship.forward())
                                turningShips.push(ship);
                            ship.rotate('right');
                            ship.turning = true;
                            break;
                        case 'stay':
                        default:
                            return;
                    }
                });
                this.resolveCollisions(move);
                turningShips.forEach(function (ship) {
                    if (ship.turning)
                        ship.forward();
                });
                this.resolveCollisions(move);

                setTimeout(function () {
                    game.runSecondaryMove(move);
                }, 1500);

                setTimeout(function () {
                    game.runCannonFire(move);
                }, 2500);
            },
            runCannonFire: function (move) {
                this.ships.forEach(function (ship) {
                    if (ship.isDead) return;
                    if (!ship.roundMoves.length) return;
                    for (var side in ship.roundMoves[move].fire) {
                        if (ship.roundMoves[move].fire[side] > 0) {
                            ship.cannonFire(side);
                        }
                    }
                });
                setTimeout(function () {
                    game.ships.forEach(function (ship) {
                        if (ship.isDead) return;
                        if (!ship.roundMoves.length) return;
                        for (var side in ship.roundMoves[move].fire) {
                            if (ship.roundMoves[move].fire[side] === 2) {
                                ship.cannonFire(side);
                            }
                        }
                    });
                }, 250);
            },
            runSecondaryMove: function (move) {
                game.ships.forEach(function (ship) {
                    game.winds.forEach(function (wind) {
                        if (ship.col === wind.col && ship.row === wind.row) {
                            ship.roundMoves[move].secondary = wind;
                            ship.windMove(wind);
                            ship.animation.moves.push({wind: wind});
                            game.resolveCollisions(move);
                        }
                    });
                    game.whirlpools.forEach(function (whirlpool) {
                        for (var i = 0; i < 4; i++) {
                            if (ship.col === whirlpool.col[i] && ship.row === whirlpool.row[i]) {
                                ship.roundMoves[move].secondary = whirlpool;
                                ship.animation.moves.push({whirlpool: i});
                                ship.whirlpoolMove(whirlpool, i, 1);
                                if (game.resolveCollisions(move) === 'whirlpool') {
                                    break;
                                }
                                ship.whirlpoolMove(whirlpool, i, 2);
                                game.resolveCollisions(move);
                                break;
                            }
                        }
                    });
                });
            },
            getShipByName: function (name) {
                for (var i in this.ships) {
                    var ship = this.ships[i];
                    if (ship.name === name) {
                        return ship;
                    }
                }
                return false;
            },
            setUserShip: function (name) {
               this.userShip = this.getShipByName(name);
            },
            updateShips: function (ships) {
                this.ships = ships;
                this.setUserShip(username);
                ships.forEach(function (ship) {
                    ship.getX = function () {
                        return (this.col + 0.5) * game.field.cellWidth();
                    };
                    ship.getY = function () {
                        return (this.row + 0.5) * game.field.cellHeight();
                    };
                    ship.x = ship.getX();
                    ship.y = ship.getY();
                    switch (ship.direction) {
                        case 'left':
                            ship.animation.angle = 270;
                            break;
                        case 'right':
                            ship.animation.angle = 90;
                            break;
                        case 'up':
                            ship.animation.angle = 0;
                            break;
                        case 'down':
                            ship.animation.angle = 180;
                            break;
                    }
                    ship.windMove = function (wind) {
                        this.savePosition();
                        switch (wind.direction) {
                            case 'up':
                                if (this.row === 0) {
                                    this.takeDamage(this.bumpDamage);
                                    return false;
                                }
                                this.row--;
                                break;
                            case 'down':
                                if (this.row === config.field.rows - 1) {
                                    this.takeDamage(this.bumpDamage);
                                    return false;
                                }
                                this.row++;
                                break;
                            case 'left':
                                if (this.col === 0) {
                                    this.takeDamage(this.bumpDamage);
                                    return false;
                                }
                                this.col--;
                                break;
                            case 'right':
                                if (this.col === config.field.columns - 1) {
                                    this.takeDamage(this.bumpDamage);
                                    return false;
                                }
                                this.col++;
                                break;
                        }
                    };
                    ship.whirlpoolMove = function (whirlpool, i, part) {
                        switch (i) {
                            case 0:
                                if (part === 1) {
                                    this.windMove({direction: 'right'});
                                }
                                if (part === 2) {
                                    this.windMove({direction: 'down'});
                                }
                                break;
                            case 1:
                                if (part === 1) {
                                    this.windMove({direction: 'down'});
                                }
                                if (part === 2) {
                                    this.windMove({direction: 'left'});
                                }
                                break;
                            case 2:
                                if (part === 1) {
                                    this.windMove({direction: 'left'});
                                }
                                if (part === 2) {
                                    this.windMove({direction: 'up'});
                                }
                                break;
                            case 3:
                                if (part === 1) {
                                    this.windMove({direction: 'up'});
                                }
                                if (part === 2) {
                                    this.windMove({direction: 'right'});
                                }
                                break;
                        }
                        if (part === 1) {
                            this.rotate('right');
                        }
                    };
                    ship.stay = function () {
                        //do nothing  
                    };
                    ship.forward = function () {
                        this.savePosition();
                        switch (this.direction) {
                            case 'up':
                                if (this.row === 0) {
                                    this.takeDamage(this.bumpDamage);
                                    this.animation.collision = {
                                        x: (this.col + 0.5) * game.field.cellWidth(),
                                        y: (this.row - 1 + 0.5) * game.field.cellHeight()
                                    };
                                    return false;
                                }
                                this.row--;
                                break;
                            case 'down':
                                if (this.row === config.field.rows - 1) {
                                    this.takeDamage(this.bumpDamage);
                                    this.animation.collision = {
                                        x: (this.col + 0.5) * game.field.cellWidth(),
                                        y: (this.row + 1 + 0.5) * game.field.cellHeight()
                                    };
                                    return false;
                                }
                                this.row++;
                                break;
                            case 'left':
                                if (this.col === 0) {
                                    this.takeDamage(this.bumpDamage);
                                    this.animation.collision = {
                                        x: (this.col - 1 + 0.5) * game.field.cellWidth(),
                                        y: (this.row + 0.5) * game.field.cellHeight()
                                    };
                                    return false;
                                }
                                this.col--;
                                break;
                            case 'right':
                                if (this.col === config.field.columns - 1) {
                                    this.takeDamage(this.bumpDamage);
                                    this.animation.collision = {
                                        x: (this.col + 1 + 0.5) * game.field.cellWidth(),
                                        y: (this.row + 0.5) * game.field.cellHeight()
                                    };
                                    return false;
                                }
                                this.col++;
                                break;
                        }
                        return true;
                    };
                    ship.rotate = function (side) {
                        var directions = ['up', 'right', 'down', 'left'];
                        var dirIndex = directions.indexOf(this.direction);
                        if (side == 'left') dirIndex--;
                        else if (side == 'right') dirIndex++;
                        if (dirIndex == -1) dirIndex = 3;
                        else if(dirIndex == 4) dirIndex = 0;
                        this.direction = directions[dirIndex];
                    };
                    ship.turn = function (side) {
                        if (!this.forward()) {
                            this.rotate(side);
                            return false;
                        }
                        this.rotate(side);
                        return this.forward();
                    };
                    ship.move = function (move) {
                        var splitStr = move.split('-');
                        var name = splitStr[0];
                        var param = splitStr[1] ? splitStr[1] : null;
                        this.animation.moves.push(move);
                        this[name](param);
                    };
                    ship.takeDamage = function (val) {
                        if ((this.col < 3 || this.col > config.field.columns - 4) || this.isDead)
                            return;
                        this.hp -= val;
                        this.isDamaged = true;
                        if (this.hp <= 0){
                            this.hp = 0;
                            this.isDead = true;
                        }
                    };
                    ship.cannonFire = function (side) {
                        var modifier = side === 'left' ? -0.5 : 0.5;
                        switch (this.direction) {
                            case 'right':
                                this.cannonballs.push({
                                    x: (this.col + 0.5) * game.field.cellWidth(),
                                    y: (this.row + 0.5 + modifier) * game.field.cellHeight(),
                                    direction: side,
                                    shipDirection: this.direction
                                });
                                break;
                            case 'left':
                                this.cannonballs.push({
                                    x: (this.col + 0.5) * game.field.cellWidth(),
                                    y: (this.row + 0.5 - modifier) * game.field.cellHeight(),
                                    direction: side,
                                    shipDirection: this.direction
                                });
                                break;
                            case 'up':
                                this.cannonballs.push({
                                    x: (this.col + 0.5 + modifier) * game.field.cellWidth(),
                                    y: (this.row + 0.5) * game.field.cellHeight(),
                                    direction: side,
                                    shipDirection: this.direction
                                });
                                break;
                            case 'down':
                                this.cannonballs.push({
                                    x: (this.col + 0.5 - modifier) * game.field.cellWidth(),
                                    y: (this.row + 0.5) * game.field.cellHeight(),
                                    direction: side,
                                    shipDirection: this.direction
                                });
                                break;
                        }
                    };
                    ship.savePosition = function () {
                        this.prevPosition = {
                            //direction: this.direction,
                            col: this.col,
                            row: this.row
                        };
                    };
                    ship.restorePosition = function () {
                        if (!Object.keys(this.prevPosition).length) {
                            return;
                        }
                        if (!this.animation.collision) {
                            this.animation.collision = {
                                x: (this.col + 0.5) * game.field.cellWidth(),
                                y: (this.row + 0.5) * game.field.cellHeight()
                            };
                        }
                        //this.animation.checkPosition = true;
                        //this.direction = this.prevPosition.direction;
                        this.col = this.prevPosition.col;
                        this.row = this.prevPosition.row;
                    };
                    ship.getSideCells = function () {
                        var cells = [];
                        switch (this.direction) {
                            case 'right':
                            case 'left':
                                cells.push({
                                        col: this.col,
                                        row: this.row - 1
                                    }, {
                                        col: this.col,
                                        row: this.row + 1
                                    }
                                );
                                break;
                            case 'up':
                            case 'down':
                                cells.push({
                                        col: this.col - 1,
                                        row: this.row
                                    }, {
                                        col: this.col + 1,
                                        row: this.row
                                    }
                                );
                                break;
                        }
                        return cells;
                    };
                    //ship.animation.reset = function () {
                    //};
                })
            }
        };
    }

    window.canvasAnimation = true;
    requestAnimationFrame(loop);

    function loop(now) {
        if (window.canvasAnimation) {
            requestAnimationFrame(loop);
        }
        game.update(now);
    }

    //$(document).keydown(function(e) {
    //    var ship = game.ships[0];
    //    switch(e.which) {
    //        case 37: // left
    //            ship.animation.moves.push({turn: 'left'});
    //            ship.turn('left');
    //            break;
    //
    //        case 38: // up
    //            ship.animation.moves.push({forward: ''});
    //            ship.forward();
    //            break;
    //
    //        case 39: // right
    //            ship.animation.moves.push({turn: 'right'});
    //            ship.turn('right');
    //            break;
    //
    //        case 40: // down
    //            //var sides = ['left', 'right'];
    //            //var i = Math.floor(Math.random() * 2);
    //            //ship.animation.moves.push('rotate-' + sides[i]);
    //            //ship.rotate(sides[i]);
    //            break;
    //        case 65: // leftFire
    //            ship.cannonFire('left');
    //            break;
    //        case 68: // rightFire
    //            ship.cannonFire('right');
    //            break;
    //
    //        default: return; // exit this handler for other keys
    //    }
    //    game.update();
    //    e.preventDefault(); // prevent the default action (scroll / move caret)
    //});

    $('#fps').html('<b>FPS: 0</b>');
    game.fpsInterval = setInterval(function () {
        $('#fps').html('<b>FPS: ' + game.frame + '</b>');
        game.frame = 0;
    }, 1000);
};