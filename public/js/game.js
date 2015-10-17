var game, username, config, tooltip;
var loadedImages = [
    'safezone',
    'opensea',
    'whirlpool',
    'cannonball',
    'explosion',
    'splash',
    'smoke',
    'wind',
    'rocks',
    'flags',
    'ships'
];
loadedImages.forEach(function (name) {
    window[name + 'Image'] = new Image();
    window[name + 'Image'].src = 'images/' + name + '.png';
});
var gameInit = function () {
    var canvasWrap = document.getElementById('game-wrap');
    var canvas = document.getElementById("game");
    var curCol, curRow;
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
            if (ship.isDead) continue;
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
            animationStack: [],
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
            Animation: {
                splash: function (x, y) {
                    this.x = x;
                    this.y = y;
                    this.lastFrameTime = 0;
                    this.frame = 0;
                    this.maxFrame = 7;
                    this.speed = 6;
                    this.type = 'Splash';
                },
                explosion: function (x, y) {
                    this.x = x;
                    this.y = y;
                    this.lastFrameTime = 0;
                    this.frame = 0;
                    this.maxFrame = 8;
                    this.speed = 7;
                    this.type = 'Explosion';
                },
                speedController: function (obj, now) {
                    obj.lastFrameTime = obj.lastFrameTime ? obj.lastFrameTime : now;
                    var timePassed = now - obj.lastFrameTime;
                    if (timePassed >= 999 / obj.speed) {
                        obj.lastFrameTime = now;
                        return true;
                    }
                    return false;
                }
            },
            runFrame: function (now, fps, animationName) {
                this.lastFrameTime[animationName] = this.lastFrameTime[animationName] ? this.lastFrameTime[animationName] : now;
                var timePassed = now - this.lastFrameTime[animationName];
                if (timePassed >= 999 / fps) {
                    this.lastFrameTime[animationName] = now;
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
                            safezoneImage,
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
                            openseaImage,
                            this.field.cellWidth() * i,
                            this.field.cellHeight() * j,
                            this.field.cellWidth(),
                            this.field.cellHeight()
                        );
                    }

                }
            },
            //drawExplosion: function (ship) {
            //    if (ship.animation.explosionFrame === 8) {
            //        ship.isDamaged = false;
            //        ship.animation.explosionFrame = 0;
            //        return;
            //    }
            //    this.ctx.drawImage(
            //        explosionImage,
            //        ship.animation.explosionFrame * this.field.cellWidth(), 0,
            //        this.field.cellWidth(), this.field.cellHeight(),
            //        ship.x - this.field.cellWidth() / 2, ship.y - this.field.cellHeight() / 2,
            //        this.field.cellWidth(), this.field.cellHeight()
            //    );
            //},
            drawExplosion: function (x, y, frame) {
                this.ctx.drawImage(
                    explosionImage,
                    frame * this.field.cellWidth(), 0,
                    this.field.cellWidth(), this.field.cellHeight(),
                    x - this.field.cellWidth() / 2, y - this.field.cellHeight() / 2,
                    this.field.cellWidth(), this.field.cellHeight()
                );
            },

            drawSplash: function (x, y, frame) {
                this.ctx.drawImage(
                    splashImage,
                    frame * this.field.cellWidth(), 0,
                    this.field.cellWidth(), this.field.cellHeight(),
                    x - this.field.cellWidth() / 2, y - this.field.cellHeight() / 2,
                    this.field.cellWidth(), this.field.cellHeight()
                );
            },
            drawSmoke: function (ship) {
                ['left', 'right'].forEach(function (side) {
                    //var cannonball = ship.cannonballs[0];
                    if (!ship.animation.fireSmoke[side].fire) return;
                    if (ship.animation.fireSmoke[side].frame === 7) {
                        ship.animation.fireSmoke[side].frame = 0;
                        ship.animation.fireSmoke[side].fire = 0;
                        return;
                    }
                        var angle;
                        switch (ship.direction) {
                            case 'right':
                                angle = side === 'left' ? 0 : 180;
                                break;
                            case 'left':
                                angle = side === 'left' ? 180 : 0;
                                break;
                            case 'up':
                                angle = side === 'left' ? 270 : 90;
                                break;
                            case 'down':
                                angle = side === 'left' ? 90 : 270;
                                break;
                        }
                        game.ctx.save();
                        game.ctx.translate(ship.x, ship.y);
                        game.ctx.rotate(angle * Math.PI / 180);
                        game.ctx.translate(-ship.x, -ship.y);
                        game.ctx.drawImage(
                            smokeImage,
                            ship.animation.fireSmoke[side].frame * game.field.cellWidth(), 0,
                            game.field.cellWidth(), game.field.cellHeight(),
                            ship.x - game.field.cellWidth() / 2, ship.y - game.field.cellHeight() * 1.15,
                            game.field.cellWidth(), game.field.cellHeight()
                        );
                        game.ctx.restore();
                });
            },
            drawShip: function (ship) {
                var imageShift = 0;
                if (ship.isDead) {
                    if (ship.animation.opacity > 0.02) {
                        ship.animation.opacity -= 0.01;
                    }
                }
                if (ship.name === game.userShip.name) {
                    ship.color = 'player';
                }
                else if (ship.team === game.userShip.team) {
                    ship.color = 'ally';
                    imageShift = this.field.cellWidth();
                }
                else {
                    ship.color = 'enemy';
                    imageShift = this.field.cellWidth() * 2;
                }

                this.ctx.save();
                this.ctx.translate(ship.x, ship.y);
                this.ctx.rotate(ship.animation.angle * Math.PI / 180);
                this.ctx.translate(-ship.x, -ship.y);
                this.ctx.globalAlpha = ship.animation.opacity;
                this.ctx.drawImage(
                    shipsImage,
                    imageShift, 0,
                    this.field.cellWidth(), this.field.cellHeight(),
                    ship.x - this.field.cellWidth() / 2, ship.y - this.field.cellHeight() / 2,
                    this.field.cellWidth(), this.field.cellHeight()
                );
                this.ctx.restore();
            },
            drawFlag: function (flag) {
                var imageShift;
                switch (flag.color) {
                    case 'neutral':
                        imageShift = 0;
                        this.ctx.drawImage(
                            flagsImage,
                            0, this.field.cellWidth() * 3,
                            this.field.cellWidth(), this.field.cellHeight(),
                            (flag.col) * this.field.cellWidth(), (flag.row) * this.field.cellHeight(),
                            this.field.cellWidth(), this.field.cellHeight()
                        );
                        this.ctx.drawImage(
                            flagsImage,
                            this.field.cellWidth(), this.field.cellHeight() * 3,
                            this.field.cellWidth(), this.field.cellHeight(),
                            (flag.col) * this.field.cellWidth(), (flag.row) * this.field.cellHeight(),
                            this.field.cellWidth(), this.field.cellHeight()
                        );
                        break;
                    case 'player' :
                    case 'ally':
                        imageShift = this.field.cellWidth();
                        this.ctx.drawImage(
                            flagsImage,
                            0, this.field.cellWidth() * 3,
                            this.field.cellWidth(), this.field.cellHeight(),
                            (flag.col) * this.field.cellWidth(), (flag.row) * this.field.cellHeight(),
                            this.field.cellWidth(), this.field.cellHeight()
                        );
                        break;
                    case 'enemy':
                        imageShift = this.field.cellWidth() * 2;
                        this.ctx.drawImage(
                            flagsImage,
                            0, this.field.cellWidth() * 3,
                            this.field.cellWidth(), this.field.cellHeight(),
                            (flag.col) * this.field.cellWidth(), (flag.row) * this.field.cellHeight(),
                            this.field.cellWidth(), this.field.cellHeight()
                        );
                        break;
                    case 'conflict':
                        imageShift = this.field.cellWidth() * 3;
                        this.ctx.drawImage(
                            flagsImage,
                            this.field.cellWidth() * 3, this.field.cellHeight() * 3,
                            this.field.cellWidth(), this.field.cellHeight(),
                            (flag.col) * this.field.cellWidth(), (flag.row) * this.field.cellHeight(),
                            this.field.cellWidth(), this.field.cellHeight()
                        );
                        break;
                }
                this.ctx.drawImage(
                    flagsImage,
                    imageShift, (flag.points - 1) * this.field.cellHeight(),
                    this.field.cellWidth(), this.field.cellHeight(),
                    (flag.col) * this.field.cellWidth(), (flag.row ) * this.field.cellHeight(),
                    this.field.cellWidth(), this.field.cellHeight()
                );
            },
            drawRock: function (rock) {
                this.ctx.drawImage(
                    rocksImage,
                    rock.shift * this.field.cellWidth(), 0,
                    this.field.cellWidth(), this.field.cellHeight(),
                    rock.col * this.field.cellWidth(), rock.row * this.field.cellHeight(),
                    this.field.cellWidth(), this.field.cellHeight()
                );
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
                var windX = (wind.col + 0.5) * this.field.cellWidth();
                var windY = (wind.row + 0.5) * this.field.cellHeight();
                var windAngle;
                this.ctx.save();
                this.ctx.translate(windX, windY);
                switch (wind.direction) {
                    case 'left':
                        windAngle = 270;
                        break;
                    case 'right':
                        windAngle = 90;
                        break;
                    case 'up':
                        windAngle = 0;
                        break;
                    case 'down':
                        windAngle = 180;
                        break;
                }
                this.ctx.rotate(windAngle * Math.PI / 180);
                this.ctx.translate(-windX, -windY);
                this.ctx.drawImage(
                    windImage,
                    wind.col * this.field.cellWidth(), wind.row * this.field.cellHeight(),
                    64, 64
                );
                this.ctx.restore();
            },
            drawCircle: function (ship) {
                if (ship.isDead) return;
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
                this.ctx.drawImage(
                    cannonballImage,
                    cannonball.x - cannonballImage.width / 2, cannonball.y - cannonballImage.height / 2,
                    cannonballImage.width, cannonballImage.height
                );
                //this.ctx.beginPath();
                //this.ctx.lineWidth = 4;
                //this.ctx.arc(
                //    cannonball.x,
                //    cannonball.y,
                //    this.field.cellWidth() * 0.125,
                //    0,
                //    2 * Math.PI,
                //    false
                //);
                //this.ctx.fillStyle = 'yellow';
                //this.ctx.fill();
                //this.ctx.lineWidth = 1;
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
                    //if (ship.isDamaged === true) {
                    //    game.ships[i].isDamaged = 1;
                    //}
                    if (ship.animation.moves[0]) {
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
                    //if (ship.isDamaged) {
                    //    game.animationStack.push(new game.Animation.explosion(ship.x, ship.y));
                    //    ship.isDamaged = false;
                    //    //game.drawExplosion(ship);
                    //    //if (game.runFrame(now, 7, ship.name + 'explosion')) {
                    //    //    ship.animation.explosionFrame++;
                    //    //}
                    //}
                    //if (ship.isDamaged !== false) {
                    //    game.ships[i].isDamaged++;
                    //}
                    //if (ship.isDamaged > 10) {
                    //    game.ships[i].isDamaged = false;
                    //}
                    if (ship.cannonballs.length) {
                        game.animations.cannonFire(ship);
                        //if (ship.animation.fireSmoke.left.fire || ship.animation.fireSmoke.right.fire) {
                            game.drawSmoke(ship);
                            if (game.runFrame(now, 12, ship.name + 'smoke')) {
                                ship.animation.fireSmoke.left.frame = ship.animation.fireSmoke.left.fire
                                    ? ship.animation.fireSmoke.left.frame + 1
                                    : 0;
                                ship.animation.fireSmoke.right.frame = ship.animation.fireSmoke.right.fire
                                    ? ship.animation.fireSmoke.right.frame + 1
                                    : 0;
                                //ship.animation.fireSmoke.left.frame++;
                                //ship.animation.fireSmoke.right.frame++;
                            }
                        //}
                    }
                    if (game.animationStack.length) {
                        game.animationStack.forEach(function (animation, i) {
                            game['draw' + animation.type](animation.x, animation.y, animation.frame);
                            if (game.Animation.speedController(animation, now)) {
                                animation.frame++;
                            }
                            if (animation.frame >= animation.maxFrame) {
                                delete game.animationStack[i];
                            }
                        });
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
                flag.color = 'neutral';
                ships.forEach(function (ship) {
                    teams[ship.team] = true;
                    if (teams.left && teams.right) {
                        flag.color = 'conflict';
                        points.left = 0;
                        points.right = 0;
                    }
                    else {
                        flag.color = ship.color;
                        if (lastRound) {
                            points[ship.team] = flag.points;
                        }
                    }
                });
                game.score.left += points.left;
                game.score.right += points.right;
            },
            animations: {
                checkCollision: function (ship) {
                    if (Math.abs(ship.animation.collision.x - ship.x) < game.field.cellHeight() * 0.75
                        && Math.abs(ship.animation.collision.y - ship.y) < game.field.cellHeight() * 0.75) {
                        ship.animation.stop = true;
                        ship.x = ship.getX();
                        ship.y = ship.getY();
                        ship.takeDamage(ship.bumpDamage);
                        if (ship.animation.collision.type === 'ship') {
                            game.ships.forEach(function (ship1) {
                                if (ship.name !== ship1.name &&
                                    ship.animation.collision.x === ship1.animation.collision.x &&
                                    ship.animation.collision.y === ship1.animation.collision.y)
                                {
                                    ship1.takeDamage(ship1.bumpDamage);
                                }
                            });
                        }
                        ship.animation.collision = 0;
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
                            game.animationStack.push(new game.Animation.splash(cannonball.x, cannonball.y));
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
                                //game.animationStack.push(new game.Animation.explosion((rock.col + 0.5) * game.field.cellWidth(), (rock.row + 0.5) * game.field.cellHeight()));
                                game.animationStack.push(new game.Animation.explosion(cannonball.x, cannonball.y));
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
                    var speed = config.animationSpeed.turn;
                    var side = 'right';
                    ship.animation.frame++;
                    ship.animation.maxRotateFrame = speed[0] + speed[1] + speed[0];
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
                            ship.animation.rotateFrame = 0;
                        }
                        return;
                    }
                    var modifier = 1;
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
                    if (ship.animation.rotateFrame === ship.animation.maxRotateFrame) {
                        ship.animation.rotateFrame = 0;
                        ship.animation.maxRotateFrame = 0;
                        if (name === 'rotate') {
                            ship.animation.moves.shift();
                        }
                        return;
                    }
                    //var side = ship.animation.moves[0].split('-')[1];
                    var step = 90 / ship.animation.maxRotateFrame;
                    ship.animation.rotateFrame++;
                    ship.animation.angle = side === 'left' ? ship.animation.angle - step : ship.animation.angle + step;
                },
                turn: function (ship, side) {
                    var speed = config.animationSpeed.turn;
                    ship.animation.frame++;
                    ship.animation.maxRotateFrame = speed[1];
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
                            ship.animation.rotateFrame = 0;
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
                    if (ship1.isDead) continue;
                    for (var j = Number(i) + 1; j < this.ships.length; j++) {
                        var ship2 = this.ships[j];
                        if (ship2.isDead) continue;
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
                        if (!ship.animation.collision) {
                            ship.animation.collision = {
                                x: (ship.col + 0.5) * game.field.cellWidth(),
                                y: (ship.row + 0.5) * game.field.cellHeight(),
                                type: ships.length === 1 ? 'rock' : 'ship'
                            };
                        }
                        if (ship.roundMoves[move].move !== 'stay') {
                            ship.restorePosition();
                        }
                        if (ship.roundMoves[move].secondary !== undefined && ship.roundMoves[move].secondary.type === 'wind') {
                            ship.restorePosition();
                        }
                        if (ship.roundMoves[move].secondary !== undefined && ship.roundMoves[move].secondary.type === 'whirlpool') {
                            ship.restorePosition();
                            //ship.takeDamage(ship.bumpDamage);
                            return 'whirlpool';
                        }
                        //ship.takeDamage(ship.bumpDamage);
                    }
                }
            },
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
                }, 3000);
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
                    for (var i in game.winds) {
                        var wind = game.winds[i];
                        if (ship.col === wind.col && ship.row === wind.row) {
                            ship.roundMoves[move].secondary = wind;
                            ship.windMove(wind);
                            ship.animation.moves.push({wind: wind});
                            game.resolveCollisions(move);
                            return;
                        }
                    }
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
                                this.row--;
                                break;
                            case 'down':
                                this.row++;
                                break;
                            case 'left':
                                this.col--;
                                break;
                            case 'right':
                                this.col++;
                                break;
                        }
                        if (!this.isOnField()) {
                            this.restorePosition();
                            return false;
                        }
                        return true;
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
                                this.row--;
                                break;
                            case 'down':
                                this.row++;
                                break;
                            case 'left':
                                this.col--;
                                break;
                            case 'right':
                                this.col++;
                                break;
                        }
                        if (!this.isOnField()) {
                            this.restorePosition();
                            return false;
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
                        game.animationStack.push(new game.Animation.explosion(ship.x, ship.y));
                        //this.isDamaged = true;
                        //this.animation.explosionFrame = 0;
                        if (this.hp <= 0){
                            this.hp = 0;
                            this.isDead = true;
                        }
                    };
                    ship.cannonFire = function (side) {
                        var modifier = side === 'left' ? -0.5 : 0.5;
                        this.animation.fireSmoke[side].fire = 1;
                        this.animation.fireSmoke[side].frame = 0;
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
                    ship.isOnField = function () {
                        if (this.col < 0 ||
                            this.col > game.field.columns - 1 ||
                            this.row < 0 ||
                            this.row > game.field.rows -1)
                        {
                            this.animation.collision = {
                                x: (this.col + 0.5) * game.field.cellWidth(),
                                y: (this.row + 0.5) * game.field.cellHeight(),
                                type: 'border'
                            };
                            return false;
                        }
                        return true;
                    };
                    ship.savePosition = function () {
                        this.prevPosition = {
                            col: this.col,
                            row: this.row
                        };
                    };
                    ship.restorePosition = function () {
                        if (!Object.keys(this.prevPosition).length) {
                            return;
                        }
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