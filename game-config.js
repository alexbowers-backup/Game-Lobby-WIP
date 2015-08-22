var config = {
    field: {
        columns: 30,
        rows: 25,
        width: 1920,  //width of the game window in pixels
        height: 1600  //height of the game window in pixels
    },
    ship: {
        hp: 50,
        cannonDamage: 8,
        cannonRange: 3, //range of cannons in cells
        cannonChargesPerSide: 2,
        bumpDamage: 2
    }
};
module.exports = config;