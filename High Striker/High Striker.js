//Project A - EECS 351
//Zachary Austin
//zra547
//Based off some of the starter code provided by Jack Tumblin via Blackboard

var VSHADER_SOURCE =
        'uniform mat4 u_ModelMatrix;\n' +
        'attribute vec4 a_Position;\n' +
        'attribute vec4 a_Color;\n' +
        'varying vec4 v_Color;\n' +
        'void main() {\n' +
        '  gl_Position = u_ModelMatrix * a_Position;\n' +
        '  gl_PointSize = 10.0;\n' +
        '  v_Color = a_Color;\n' +
        '}\n';

var FSHADER_SOURCE =
        '#ifdef GL_ES\n' +
        'precision mediump float;\n' +
        '#endif GL_ES\n' +
        'varying vec4 v_Color;\n' +
        'void main() {\n' +
        '  gl_FragColor = v_Color;\n' +
        '}\n';

var ANGLE_STEP = 45.0;
var BELL_STEP = 1.4;
var OLD_ANGLE = 45.0;
var OLD_BELL = 1.4;
var clicked = [];
var SPEED = 0;
var currentAngle;
var PAUSE = false;
var MAX_POS = 1.2;
var HELP = true;
var pos;
var oldpos;
var SCOREB = false;
var SCORE;
var COUNTEDCLICKS;
var CC = false;
var downX = 0;
var downY = 0;
var upX = 0;
var upY = 0;

function main() {

    var canvas = document.getElementById('webgl');
    var hud = document.getElementById('hud');
    hud.onmousedown = function(ev) {
        click(ev, hud);
    };
    hud.onmouseup = function(ev) {
        setUp(ev, hud);
    };

    $(function() {
        $(document).keydown(function(ev) {
            if (ev.keyCode === 32) {
                PAUSE = !PAUSE;
                if (!PAUSE)
                {
                    ANGLE_STEP = OLD_ANGLE;
                    BELL_STEP = OLD_BELL;
                }
                else
                {
                    OLD_ANGLE = ANGLE_STEP;
                    OLD_BELL = BELL_STEP;
                    ANGLE_STEP = 0.0;
                    BELL_STEP = 0.0;
                }
            }
            if (ev.keyCode === 82)
            {
                pos = 0;
                currentAngle = 0.0;
                ANGLE_STEP = 0.0;
                var hud = document.getElementById('hud');
                var ctx = hud.getContext('2d');
                ctx.clearRect(0, 0, 1200, 700);
                COUNTEDCLICKS = 0;
                //PAUSE = true;
            }
            if (ev.keyCode === 76)
            {
                PAUSE = true;
                ANGLE_STEP = 45.0;
                var test = Math.random();
                MAX_POS = test * 2.2;
                BELL_STEP = (MAX_POS / 2.2) * 1.4;
                SCORE = Math.round(MAX_POS * 1000);
                SCOREB = true;
                CC = true;
                PAUSE = false;
            }
            if (ev.keyCode === 112)
            {
                var hud2 = document.getElementById('hud');
                var ctx2 = hud2.getContext('2d');
                if (HELP)
                {

                    ctx2.font = '15px "Times New Roman"';
                    ctx2.fillStyle = 'rgba(255, 255, 255, 1)';
                    ctx2.fillText('Press Space Bar to pause.\n Press R/r to reset the simulation\n', 0, 15);
                    ctx2.fillText('Press L/l to launch again once you have reset!', 0, 30);
                    ctx2.fillText('You will be given a score for each attempt!', 0, 45);
                    ctx2.fillText('You can increase your score by clicking the C/c key.', 0, 60);
                    ctx2.fillText('Clicking will also increase your score.', 0, 75);
                    ctx2.fillText('Click and drag to change the background color!', 0, 90);
                    ctx2.fillText('Note: This only happens once you lift up the mouse button', 0, 105);
                    ctx2.fillText('Note2: Your clicks must be on the canvas to count!', 0, 120);
                }
                else
                {

                    ctx2.clearRect(0, 0, 400, 400);
                }
                HELP = !HELP;
            }
            if (ev.keyCode === 67)
            {
                if (CC)
                {
                    COUNTEDCLICKS++;
                }
            }
        });
    });

    pos = 0;
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    }

    var r = Math.abs(upX - downX);
    var g = Math.abs(upY - downY);
    var b;
    if (downY !== 0 && upY !== 0)
    {
        var up = Math.abs(upX) / Math.abs(upY);
        var down = Math.abs(downX) / Math.abs(downY);
        b = Math.abs(down / up);
    }
    else if (upX !== 0 && downX !== 0)
    {
        var up = Math.abs(upY) / Math.abs(upX);
        var down = Math.abs(downY) / Math.abs(downX);
        b = down / up;
    }
    else
    {
        b = 1;
    }


    gl.clearColor(r, g, b, 1);

    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }


    var currentAngle = 0.0;
    var modelMatrix = new Matrix4();

    canvas.onmousedown = function(ev) {
        click();
    };

    var tick = function() {
        animateBell();
        currentAngle = animate(currentAngle);  // Update the rotation angle
        draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix);   // Draw the triangle
        requestAnimationFrame(tick, canvas);   // Request that the browser ?calls tick
    };
    tick();
}

function click(ev, hud)
{
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - hud.width / 2) / (hud.width / 2);
    y = (hud.height / 2 - (y - rect.top)) / (hud.height / 2);

    downX = x;
    downY = y;

    if (CC)
    {
        COUNTEDCLICKS = COUNTEDCLICKS + 1;
    }
}

function setUp(ev, hud)
{
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - hud.width / 2) / (hud.width / 2);
    y = (hud.height / 2 - (y - rect.top)) / (hud.height / 2);

    upX = x;
    upY = y;
}

function initVertexBuffers(gl) {

    var vertices = new Float32Array([
        //arm base
        0.00, 0.00, 0.00, 1.00, 1.0, 0.0, 0.0,
        0.2, 0.00, 0.00, 1.00, 1.0, 0.0, 0.0,
        0.0, 0.49, 0.00, 1.00, 1.0, 0.0, 0.0,
        0.20, 0.00, 0.00, 1.00, 1.0, 0.0, 0.0,
        0.20, 0.49, 0.00, 1.00, 1.0, 0.0, 0.0,
        0.00, 0.49, 0.00, 1.00, 1.0, 0.0, 0.0,
        //hammer handle
        -0.025, 0.2, 0.0, 1.0, 1.0, 0.0, 0.0,
        0.025, 0.2, 0.0, 1.0, 1.0, 0.0, 0.0,
        -0.025, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0,
        .025, 0.2, 0.0, 1.0, 1.0, 0.0, 0.0,
        .025, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0,
        -0.025, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0,
        //hammer head
        -0.1, 0.21, 0.0, 1.0, 1.0, 0.0, 0.0,
        -0.1, 0.4, 0.0, 1.0, 1.0, 0.0, 0.0,
        .1, 0.4, 0.0, 1.0, 1.0, 0.0, 0.0,
        .1, 0.4, 0.0, 1.0, 1.0, 0.0, 0.0,
        .1, 0.21, 0.0, 1.0, 1.0, 0.0, 0.0,
        -0.1, 0.21, 0.0, 1.0, 1.0, 0.0, 0.0,
        //nail
        -0.05, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, //1
        -0.05, .1, 0.0, 1.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0,
        -0.05, .1, 0.0, 1.0, 0.0, 1.0, 0.0, //2
        0.0, .1, 0.0, 1.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0,
        -0.05, 0.11, 0.0, 1.0, 0.0, 1.0, 0.0, //3
        0.0, 0.11, 0.0, 1.0, 0.0, 1.0, 0.0,
        -0.05, 0.2, 0.0, 1.0, 0.0, 1.0, 0.0,
        0.0, 0.2, 0.0, 1.0, 0.0, 1.0, 0.0, //4
        -0.05, 0.2, 0.0, 1.0, 0.0, 1.0, 0.0,
        0.0, 0.11, 0.0, 1.0, 0.0, 1.0, 0.0,
        -0.05, 0.21, 0.0, 1.0, 0.0, 1.0, 0.0, //5
        0.0, 0.21, 0.0, 1.0, 0.0, 1.0, 0.0,
        -0.05, 0.3, 0.0, 1.0, 0.0, 1.0, 0.0,
        0.0, 0.3, 0.0, 1.0, 0.0, 1.0, 0.0, //6
        -0.05, 0.3, 0.0, 1.0, 0.0, 1.0, 0.0,
        0.0, 0.21, 0.0, 1.0, 0.0, 1.0, 0.0,
        -0.05, 0.31, 0.0, 1.0, 0.0, 1.0, 0.0, //7
        0.0, 0.31, 0.0, 1.0, 0.0, 1.0, 0.0,
        -0.05, 0.4, 0.0, 1.0, 0.0, 1.0, 0.0,
        0.0, 0.4, 0.0, 1.0, 0.0, 1.0, 0.0, //8
        -0.05, 0.4, 0.0, 1.0, 0.0, 1.0, 0.0,
        0.0, 0.31, 0.0, 1.0, 0.0, 1.0, 0.0,
        -0.05, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, //9
        0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0,
        -0.025, -.05, 0.0, 1.0, 0.0, 1.0, 0.0,
        -0.06, 0.4, 0.0, 1.0, 0.0, 1.0, 0.0, //10
        0.01, 0.4, 0.0, 1.0, 0.0, 1.0, 0.0,
        -0.06, 0.55, 0.0, 1.0, 0.0, 1.0, 0.0,
        -0.06, 0.55, 0.0, 1.0, 0.0, 1.0, 0.0, //11
        0.01, 0.4, 0.0, 1.0, 0.0, 1.0, 0.0,
        0.01, 0.55, 0.0, 1.0, 0.0, 1.0, 0.0,
        //distance indicator
        -.25, -.2, 0.0, 1.0, 0.0, 1.0, 1.0,
        0.25, -.2, 0.0, 1.0, 0.0, 1.0, 1.0,
        0.0, 0.2, 0.0, 1.0, 0.0, 1.0, 1.0,
        -.25, .1, 0.0, 1.0, 0.0, 1.0, 1.0,
        .25, .1, 0.0, 1.0, 0.0, 1.0, 1.0,
        0.0, -.1, 0.0, 1.0, 0.0, 1.0, 1.0
    ]);
    var n = 57;   // The number of vertices

    // Create a buffer object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    var FSIZE = vertices.BYTES_PER_ELEMENT;

    // Assign the buffer object to a_Position variable
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 4, gl.FLOAT, false, FSIZE * 7, 0);
    gl.enableVertexAttribArray(a_Position);

    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if (a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return -1;
    }

    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 7, FSIZE * 4);
    gl.enableVertexAttribArray(a_Color);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return n;
}

function draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix) {
//==============================================================================
    // Clear <canvas>
    if (!PAUSE)
    {
        var r = Math.abs(upX - downX);
        var g = Math.abs(upY - downY);
        var b;
        if (downY !== 0 && upY !== 0)
        {
            var up = Math.abs(upX) / Math.abs(upY);
            var down = Math.abs(downX) / Math.abs(downY);
            b = Math.abs(down / up);
        }
        else if (upX !== 0 && downX !== 0)
        {
            var up = Math.abs(upY) / Math.abs(upX);
            var down = Math.abs(downY) / Math.abs(downX);
            b = down / up;
        }
        else
        {
            b = 1;
        }

        gl.clearColor(r, g, b, 1);

        gl.clear(gl.COLOR_BUFFER_BIT);

        //scale
        modelMatrix.setTranslate(0.0, .7, 0.0);
        modelMatrix.scale(3.0, 3.0, 3.0);
        modelMatrix.rotate(180, 0.0, 0.0, 1.0);


        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
        gl.drawArrays(gl.TRIANGLES, 18, 33);

        //bell
        modelMatrix.setTranslate(0.07, -0.4, 0.0);
        modelMatrix.scale(.5, .5, .5);
        modelMatrix.translate(0.0, pos, 0.0);
        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
        gl.drawArrays(gl.TRIANGLES, 51, 6);

//rest
        modelMatrix.setTranslate(-0.7, -0.6, 1.0);
        modelMatrix.scale(.75, .75, .75);

        modelMatrix.rotate(currentAngle, 0, 0, 1);

        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        modelMatrix.translate(0.1, 0.5, 0);
        modelMatrix.scale(0.6, 0.6, 0.6);
        modelMatrix.rotate(currentAngle * 1.2, 0, 0, 1);
        modelMatrix.translate(-0.1, 0, 0);
        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
        gl.drawArrays(gl.TRIANGLES, 0, 6);


        modelMatrix.translate(0.1, 0.5, 0.0);
        pushMatrix(modelMatrix);
        modelMatrix.scale(1.5, 1.5, 1.5);
        gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
        gl.drawArrays(gl.TRIANGLES, 6, 12);

        modelMatrix = popMatrix();
    }
}

// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();
var ang;

function animate(angle) {
//==============================================================================
    // Calculate the elapsed time
    var now = Date.now();
    var elapsed = now - g_last;
    g_last = now;
    ang = angle;
    if (angle > 0.0 && pos !== 0.0)
    {
        return angle;
    }
    if (angle > 0.0 && ANGLE_STEP > 0)
        ANGLE_STEP = -ANGLE_STEP;
    if (angle < -44.0 && ANGLE_STEP < 0)
        ANGLE_STEP = -ANGLE_STEP;

    var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
    return newAngle %= 360;
}

var b_last = Date.now();
var use = false;
function animateBell()
{
    var now = Date.now();
    var elapsed = now - b_last;
    b_last = now;

    if (ang < -43)
    {
        use = true;
    }
    if (use)
    {
        if (pos >= MAX_POS && BELL_STEP > 0)
        {
            BELL_STEP = -BELL_STEP;
            if (SCOREB)
            {
                SCORE = SCORE + COUNTEDCLICKS * 10;
                var extra = COUNTEDCLICKS * 10;
                var hud = document.getElementById('hud');
                var ctx = hud.getContext('2d');
                ctx.font = '15px "Times New Roman"';
                ctx.fillStyle = 'rgba(255, 255, 255,1)';
                ctx.fillText("Your Score:" + SCORE, 0, 20);
                ctx.fillText("Your swinging effort (clicking) earned you an extra: " + extra + " points!", 0, 40);
                SCOREB = !SCOREB;
                COUNTEDCLICKS = 0;
                CC = false;
            }
        }
        if (pos <= 0 && BELL_STEP < 0)
        {
            BELL_STEP = -BELL_STEP;
        }
        if (pos <= 0 && ang >= -43)
        {
            pos = 0;
        }
        else
        {
            pos = pos + (BELL_STEP * elapsed) / 1000;
        }
    }

}