// JavaScript source code

// create global variable to store the random colors
var colfunc;

// function to call the JSON file
window.onload = function () {
    reset();
};

reset = function () {
    // calling the canvas element
    var c = document.getElementById("canvas");

    // setting the width and height to the screen
    document.getElementById("container").height = window.innerWidth;
    document.getElementById("container").width = window.innerHeight;
    //document.getElementById("content").height = window.innerWidth;
    c.width = window.innerWidth;
    c.height = window.innerHeight;

    // getting the context
    var ctx = c.getContext("2d");

    // creating a horizontal gradient according to device height
    var my_gradient = ctx.createLinearGradient(0, 0, 0, c.height);

    // jQuery call for JSON file
    $.getJSON('media/gradients.json', function (json) {
        // setting color variable to random color generator
        colors = (json[Math.floor((Math.random() * json.length))].colors);
        // adds the colors to the gradient on the canvas
        my_gradient.addColorStop(0, colors[0]);
        my_gradient.addColorStop(1, colors[1]);
        // fills the gradient
        ctx.fillStyle = my_gradient;
        ctx.fillRect(0, 0, c.width, c.height);
    });
};

on = function () {
    document.getElementById("overlay").style.display = "block";
    document.getElementById("content").style.display = "none";
};

off = function () {
    document.getElementById("overlay").style.display = "none";
    document.getElementById("content").style.display = "block";
    document.getElementById("overlayAbout").style.display = "none";
}

onAbout = function () {
    document.getElementById("overlayAbout").style.display = "block";
    document.getElementById("content").style.display = "none";
};