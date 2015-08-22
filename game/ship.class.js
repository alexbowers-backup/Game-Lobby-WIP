var config = require('../game-config');

var Ship = function (name, team) {
    if (team == 'left') {
        this.direction = 'right';
        this.col = Math.floor(Math.random() * 3);
    }
    else if (team == 'right'){
        this.direction = 'left';
        this.col = Math.floor(Math.random() * 3) + config.field.columns - 3;
    }
    this.row = Math.floor(Math.random() * config.field.rows);

    this.name = name;
    this.team = team;
    this.hp = config.ship.hp;
    this.cannonDamage = config.ship.cannonDamage;
    this.bumpDamage = config.ship.bumpDamage;
    this.isDamaged = false;
    this.isDead = false;
    this.prevPosition = {};
    this.movesOrder = [];
    this.roundMoves = [];
};

module.exports = Ship;