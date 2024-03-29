var config = {
    field: {
        columns: 30,
        rows: 25,
        width: 1920,  //width of the game window in pixels
        height: 1600  //height of the game window in pixels
    },
    animationSpeed: {
        forward: 40,
        turn: [20, 40] // forward/rotate parts of turning move
    },
    round: {
        number: 10,
        timer: 15  //in seconds
    },
    ship: {
        hp: 50,
        cannonDamage: 8,
        cannonRange: 3, //range of cannons in cells
        cannonballSpeed: 4, //pixels per frame
        cannonChargesPerSide: 2,
        bumpDamage: 2
    },
    flag: {
        //number of flags by points
        points: {
            1: 4,
            2: 3,
            3: 2
        }
    },
    wind: {
        numberRange: [10, 15] // min and max number of winds
    },
    whirlpool: {
        number: 5
    },
    rock: {
        number: 10
    }
};
module.exports = config;