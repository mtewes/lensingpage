var oldx = 0;
var oldy = 0;

var imageDataDst, imageDataSrc;

w = 701;
h = 701;

lens_x=Math.round(w/2);
lens_y=Math.round(h/2);

var lerp = function(a, b, t) {
    return (b - a) * (1-Math.exp(-t)) + a;
}

window.onload = function() {
    w = img.width;
    h = img.height;

    canvas = document.querySelector("canvas");
    canvas.width = w;
    canvas.height = h;

    dst = canvas.getContext("2d");

    dst.drawImage(img, 0, 0, w, h);
    imageDataSrc = dst.getImageData(0, 0, w, h);
    imageDataDst = dst.getImageData(0, 0, w, h);

    let alpha_x = new Array(w);
    let alpha_y = new Array(w);
    for(var i=0; i<w; i++){
        alpha_x[i] = new Array(h);
        alpha_y[i] = new Array(h);
    }
    for(var x=0; x<w; x++){
        for(var y=0; y<h; y++){
            theta = Math.sqrt(Math.pow(x - lens_x, 2) + Math.pow(lens_y - y, 2));
            alpha_x[x][y] = (x - lens_x)/Math.pow(theta, 2);
            alpha_y[x][y] = (lens_y - y)/Math.pow(theta, 2);
        }
    }

    let curX;
    let curY;
    let pressed = false;
    // update mouse pointer coordinates
    canvas.addEventListener("mousedown", () => pressed = true);
    canvas.addEventListener("mouseup", () => pressed = false);

    //beta_x = -50;
    //beta_y = 70;
    var thetaE = document.getElementById('einst_rad').value;
    var beta_x = document.getElementById('srcx').value;
    var beta_y = document.getElementById('srcy').value;
    
    drawcanvas(canvas, beta_x, beta_y, thetaE, alpha_x, alpha_y);
    document.addEventListener('input', function(){
        thetaE = document.getElementById('einst_rad').value;
        beta_x = document.getElementById('srcx').value;
        beta_y = document.getElementById('srcy').value;
        drawcanvas(canvas, beta_X, beta_Y, thetaE, alpha_x, alpha_y);
        /*canvas.addEventListener('mousemove', function(evt) {
            var mousePos = getMousePos(canvas, evt);
            drawcanvas(canvas, mousePos.x, mousePos.y, thetaE);
        }, false);*/
    })

    var scrollX = 0;
    var scrollY = 0;
    document.addEventListener("wheel", (e) =>{
        scrollX = e.deltaX;
        scrollY = e.deltaY;
    })
    document.addEventListener("mousemove", (e) => {
        //curX = e.clientX;
        //curY = e.clientY;
        var bounds = canvas.getBoundingClientRect();
        curX = e.clientX - bounds.left - scrollX - (bounds.right - bounds.left)/2;
        curY = -(e.clientY - bounds.top - scrollY - (bounds.bottom - bounds.top)/2);
        if(pressed==true){drawcanvas(canvas, curX, curY, thetaE, alpha_x, alpha_y);}
    });
};

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        //x: evt.clientX - rect.left,
        //y: evt.clientY - rect.top
        x: evt.clientX,
        y: evt.clientY
    };
}

function drawcanvas(canvas, beta_x, beta_y, thetaE, alpha_x, alpha_y) {
    var context = canvas.getContext('2d');
    for(var i=0; i<h*w*4; i++){
        imageDataDst.data[i] = imageDataSrc.data[i];
    }
    r = 25;
    //thetaE = 60;
    px = lens_x + beta_x;
    py = lens_y - beta_y;
    xmin = px - r;
    xmax = px + r;
    ymin = py - r;
    ymax = py + r;
    if (xmin < 0) {
        xmin = 0;}
    if (xmax > w) {
        xmax = w;}
    if (ymin < 0) {
        ymin = 0;}
    if (ymax > h) {
        ymax = h;}
    
    //source plane circle
    for(var y=ymin; y<ymax; y++){
        for(var x=xmin; x<xmax; x++){
            d = Math.sqrt(Math.pow(px - x, 2) + Math.pow(py - y, 2));
            if(d <= r){
                index = (x + y*w)*4;
                //for(var k=0; k<4; k++){
                //    imageDataDst.data[index+k] = 255; //data: red, green, blue, alpha for every element
                //}
                imageDataDst.data[index] = imageData_gauss(d, r, 255, imageDataSrc.data[index]);
                imageDataDst.data[index+1] = imageData_gauss(d, r, 100, imageDataSrc.data[index+1]);
                imageDataDst.data[index+2] = imageData_gauss(d, r, 100, imageDataSrc.data[index+2]);
                imageDataDst.data[index+3] = 255;
            }
        }
    }

    for(var y=0; y<h; y++){
        for(var x=0; x<w; x++){
            theta = Math.sqrt(Math.pow(x - lens_x, 2) + Math.pow(lens_y - y, 2));
            //src_x = (x-lens_x)*(1 - Math.pow(thetaE/theta, 2)); //angular source coordinates (point mass lens)
            //src_y = (lens_y-y)*(1 - Math.pow(thetaE/theta, 2));
            src_x = (x-lens_x) - Math.pow(thetaE, 2)*alpha_x[x][y]; //arbitrary deflection angle from array alpha_x,y
            src_y = (lens_y-y) - Math.pow(thetaE, 2)*alpha_y[x][y];
            d = Math.sqrt(Math.pow(beta_x - src_x, 2) + Math.pow(beta_y - src_y, 2));
            if(d <= r){
                index = (x + y*w)*4;
                //for(var k=0; k<4; k++){
                //    imageDataDst.data[index+k] = 255; //data: red, green, blue, alpha for every element
                //}
                imageDataDst.data[index] = imageData_gauss(d, r, 255, imageDataSrc.data[index]);
                imageDataDst.data[index+1] = imageData_gauss(d, r, 100, imageDataSrc.data[index+1]);
                imageDataDst.data[index+2] = imageData_gauss(d, r, 100, imageDataSrc.data[index+2]);
                imageDataDst.data[index+3] = 255;
            }
        }
    }

    dst.putImageData(imageDataDst, 0, 0);
}

function imageData_gauss(d, r, max, offset){
    //return offset + (max - offset) * Math.exp( -Math.pow(d/(2*r/3), 2)/2 );
    return max*Math.exp(-3.6713 * (Math.pow(d/(r/2.8), 1/2) - 1)); //Sersic profile with n=2
}

var img = new Image();
//img.crossOrigin="anonymous";

img.src = "test_img.png";
