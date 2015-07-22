/* This is the game as (more-or-less) obtained from cambridgecoding (with annotations).

/* I define a set of global variables before the game is created. */
/* The first of these dictates the order by which the game runs (I think). */
var actions = { preload: preload, create: create, update: update };
/* The game's height and width were once just used to define the size of the game window.
 * By using variables instead, these values can be referred to later on easily. */
var width = 700;
var height = 400;
/* Following this, we create a new game object in Phaser, which we can begin to interact with. */
// Phaser parameters:
// - game width
// - game height
// - renderer (go for Phaser.AUTO)
// - element where the game will be drawn ('game')
// - actions on the game state (or null for nothing)
var game = new Phaser.Game(width, height, Phaser.AUTO, "game", actions);
/* The score at the start of the game begins at 0. */
var score = -3;
/* A new variable is created which will become an object to contain the score of the current game. */
var labelScore;
/* A new variable is created which will become an object to contain the score of the current game. */
var labelText;
/* A new variable is created which will become an object that can be used to create player sprites and then change their properties. */
var player;
/* A new variable is created which will become an object that can be used to change the properties of any child sprites of the player. */
var pipes = [];
/* A new variable is created to dictate the difference in time between pipe stack generations. */
var pipeInterval = 1.75;

/* These variables have been drawn out from existing values in former implementations.*/
var gameGravity = 200;
var gameVelocity = -200;
var jumpPower = -125;
var pipeGap = 100;

/* Bonuses are a new feature - these arrays store the sprites.*/
var balloons = [];
var weights =[];

/* JQuery obtains the locally stored scores and prints them to the empty unordered list on the HTML page. */
$.get("/score", function(data){
    console.log("received:", data);
    var scores = JSON.parse(data);
    for (var i = 0; i < scores.length; i++) {
        $("#scoreBoard").append("<li>" + scores[i].name + ": " +
            scores[i].score + "</li>");
    }
});

/* The images and audio are loaded to Phaser in this function. */
function preload() {
    /* Images */
    game.load.image("playerImg","../assets/flappy.png");
    game.load.image("pipe","../assets/pipe2-body.png");
    game.load.image("pipe-border","../assets/pipe2-body2.png");
    game.load.image("pipe-end","../assets/pipe-end.png");
    game.load.image("balloons","../assets/balloons.png");
    game.load.image("weight","../assets/weight.png");
    /* Audio */
    game.load.audio("score", "../assets/point.ogg");
}

function create() {
    /* The background colour for the game window is set.
     * This could also be set to an image. */
    game.stage.setBackgroundColor("#F3D3A3");
    /* At the top and bottom of the screen, blocks are placed.
     * This prevents the user from scoring points by simply dropping under all of the columns of blocks.*/
    for (var count=0; count<16; count++) {
        addPipeBlock(50 * count, 0, false);
        addPipeBlock(50 * count, 395, false);
    }
    /* A pipe is generated from the same place with a psuedo-random arrangement every time the defined amount of time (pipeInterval) has elapsed. */
    game.time.events.loop(pipeInterval * Phaser.Timer.SECOND, generate);
    /* Two labels are created. The first is rather optional and simply shows a welcome message.
     * The other is the aforementioned label showing the score. */
    labelText = game.add.text(20, 20, "Welcome.",
        {font: "30px Gloucester MT Extra Condensed", fill: "#777777"});
    labelScore = game.add.text(20, 60, "0",
        {font: "30px Gloucester MT Extra Condensed", fill: "#777777"});
    /* A sprite is added and assigned to the player as an object. */
    player = game.add.sprite(80, 200, "playerImg");
    /* The player's sprite is assigned an anchor, from which it can appear to rotate according to its trajectory. */
    player.anchor.setTo(0.5, 0.5);
    /* Arcade Physics (alongside P2 physics, I think) are now-activated physics modules of the Phaser game engine. */
    game.physics.startSystem(Phaser.Physics.ARCADE);
    /* I think that the player is tied to the arcade physics modules.
     * This means that other sprites could be tied to more advanced physics modules, where necessary, such as P2.
     * This conserves processing power. */
    game.physics.arcade.enable(player);
    /* A given player sprite at a standstill is accelerated by a simulated gravitational force. */
    player.body.gravity.y = gameGravity;
    /* Pressing the spacebar will now cause the playerJump() function to run (causing the player to jump). */
    game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).onDown.add(playerJump);
}

function update() {
    /* This line checks if at any point during gameplay there is an overlap between any pipe and player sprites.
     * If this is the case, the game will end. */
    game.physics.arcade.overlap(player, pipes, gameOver);
    /* The people at CCA used the game's window's height and width here -
     * to determine if the player had passed the bounds of the window.
     * This was as follows:
     * if(0 > player.body.y || player.body.y > width){
     *     gameOver();
     * }*/

    /* Following this, rotation on the player sprite results by using the trigonometric functions in JS.*/
    /* I very subtly changed the parameter of the atan function to a negative, meaning that the bird will drop with a forwards, not backwards lean if it descends. */
    player.rotation = Math.atan(-player.body.velocity.y / gameVelocity);

    /* After every frame, if there is an intersection between a balloon or a weight, and the player sprite,
    * the gravity should change to replicate a net vertical force change. */
    checkBonus(balloons, -50);
    checkBonus(weights, 50);

    /* I have added this section, meaning that the label chases the player across the map. */
    labelScore.x = player.x + 50;
    labelScore.y = player.y;
}

function checkBonus(bonusArray, bonusEffect) {
    /* For each balloon item, if there is an intersection between a player sprite and the type of sprite in question, the player gets a bonus.
     * That sprite is then removed, along with its reference in one of the arrays. */
    // Step backwards in the array to avoid index errors from splice
    for(var i=bonusArray.length - 1; i>=0; i--){
        game.physics.arcade.overlap(player,bonusArray[i], function(){
            // destroy sprite
            bonusArray[i].destroy();
            // remove element from array
            bonusArray.splice(i,1);
            // apply the bonus effect
            changeGravity(bonusEffect);
        });
    }
}

function addPipeBlock(x, y, velocityOn) {
    if (velocityOn) {
        /* A single pipe block sprite is added at the coordinates obtained from the function generatePipe(). */
        var pipe = game.add.sprite(x,y,"pipe");
        /* This pipe has physics enabled and moves towards the player at a simulated constant velocity. */
        game.physics.arcade.enable(pipe);
        pipe.body.velocity.x = gameVelocity;
    } else {
        /* This pipe does have physics enabled.
         * The physics here is only for overlaps, not for velocities.*/
        var pipe = game.add.sprite(x,y,"pipe-border");
        game.physics.arcade.enable(pipe);
    }
    /* I think that this adds the newly-created pipe to the array of pipe sprites. */
    pipes.push(pipe);
}

/* The sprites for the ends of pipes are added here in a similar fashion. */
function addPipeEnd(x, y) {
    var pipe = game.add.sprite(x, y, "pipe-end");
    pipes.push(pipe);
    game.physics.arcade.enable(pipe);
    pipe.body.velocity.x = gameVelocity;
}

function generate(){
    var diceRoll = game.rnd.integerInRange(1, 10);
    if(diceRoll==1){
        generateBonus("balloons");
    } else if(diceRoll==2){
        generateBonus("weight");
    } else {
        generatePipe();
    }
}

function generatePipe() {
    /* A gap is needed in each column of pipes.
     * The place at which this starts is determined by a random number, and in CCA's example, this gap will be two blocks tall. */
    /* The definition of the start of the gap has now changed.
     * This means that all workings are now outlined in game coordinates from the ground up to streamline it.
     * pipeGap is integer that was set upon initialisation for the height of the gap between pipes. */
    var gapStart = game.rnd.integerInRange(50, height - 50 - pipeGap);
    /* For each of the eight places in a column available to put a block,
     * a block is placed at certain coordinates along the column if it is not earmarked for the gap. */
    /* This main section of code in this function has also now changed. */
    /* In this section, an end to the pipe is added where the actual beginning of the gap would have started.
     * This is replaced with a much stubbier starting pipe.
     * This means that it assumes the place where the old block would have been with adjustments for its different size.*/
    addPipeEnd(width-5,gapStart - 25);
    /* The main blocks are then added above this ending block in a for loop from the end block to the top of the screen.*/
    for(var y=gapStart - 75; y>-50; y -= 50){
        addPipeBlock(width, y, true);
    }
    /* Likewise, a similar story emerges for the pipe that extends from the bottom of the screen. */
    /* A cap is added, and then the pipe blocks are added to the bottom of the screen. */
    addPipeEnd(width-5,gapStart+pipeGap);
    for(var y=gapStart + pipeGap + 25; y<height; y += 50){
        addPipeBlock(width, y, true);
    }
    /* A column is created periodically, and likewise the score should be changed periodically.
     * As far as I know, this score change also just happens to occur as the player sprite goes through a gap - a new column must be being created at the same time. */
    changeScore();
}

/* This entire function is a new addition - adding the bonus sprites for the player. */
function generateBonus(bonusType){
    /* A bonus is added at the coordinates width and height.
     * At first, it seems unusual to deploy a sprite at the very top or bottom of the screen, but these sprites will float upwards or downwards from this position. */
    if (bonusType == "balloons") {
        var bonus = game.add.sprite(width, height, bonusType);
        balloons.push(bonus);
    } else if (bonusType == "weight") {
        var bonus = game.add.sprite(width, 0, bonusType);
        weights.push(bonus);
    }
    /* The sprite is added to the list of balloons; has physics enabled; is assigned the same velocity and gravity as the moving pipes...
    and is assigned to move upwards or downwards of the screen at a psuedorandom velocity. */
    game.physics.arcade.enable(bonus);
    bonus.body.velocity.x = gameVelocity;
    if (bonusType == "balloons") {
        bonus.body.velocity.y = -game.rnd.integerInRange(60,100);
    } else if (bonusType == "weight") {
        bonus.body.velocity.y = game.rnd.integerInRange(60,100);
    }
}

/* This function seems pretty self-explanatory. It is launched upon a collision with a bonus sprite. */
function changeGravity(g){
    gameGravity += g;
    player.body.gravity.y = gameGravity;
}

function playerJump() {
    /* The player sprite is given a negative velocity, meaning that it decelerates upwards under the influence of gravity in an arc. */
    player.body.velocity.y = jumpPower;
    /* A sound is played. */
    game.sound.play("score");
}

function changeScore() {
    /* The score is increased by one and set as the contents of the label's text property. */
    score++;
    /* For some reason, the stacks of pipes did not spawn early enough, meaning that the user had a score of about 2-4 before the game even started.
     * I have fixed this by setting the score in code to -3 (making it act more like a countdown), however this may need to be fixed in future.*/
    labelScore.setText(score.toString());
}

function gameOver() {
    /* The game ends upon a collision between pipe and player sprites.
     * This causes the game to stop functioning at in Phaser. */
    labelText.setText("Try again.");
    /* Functionality then begins involving JQuery, causing the form to become visible and interactive in HTML. */
    $("#score").val(score);
    $("#greeting").show();
    game.destroy();
}