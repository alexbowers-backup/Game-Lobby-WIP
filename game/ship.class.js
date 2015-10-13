var config = require('../game-config');

var Ship = function (props) {
    if (props.team == 'left') {
        this.direction = 'right';
    }
    else if (props.team == 'right'){
        this.direction = 'left';
    }
    this.col = props.col;
    this.row = props.row;
    this.type = 'ship';

    this.name = props.name;
    this.team = props.team;
    this.hp = config.ship.hp;
    this.cannonDamage = config.ship.cannonDamage;
    this.bumpDamage = config.ship.bumpDamage;
    this.isDamaged = false;
    this.isDead = false;
    this.showCircle = false;
    this.prevPosition = {};
    this.movesOrder = [];
    this.cannonballs = [];
    this.animation = {
        moves: [],
        frame: 0,
        frameR: 0,
        angle: props.team == 'left' ? 90 : 270
    };
    this.roundMoves = [
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
};

module.exports = Ship;