var imageDataDst, imageDataSrc;

var img_alphax = new Image();
img_alphax.src = "alphax_gaussian_random_field_1.png";
var img_alphay = new Image();
img_alphay.src = "alphay_gaussian_random_field_1.png";
var img_kappa = new Image();
img_kappa.src = "kappa_gaussian_random_field_1.png";

var canvas = document.getElementById('wl_kappa_map');
var dst = canvas.getContext('2d');

var w = canvas.width;
var h = canvas.height;
var origin_x=Math.round(w/2);
var origin_y=Math.round(h/2);

window.onload = function() {
    dst.drawImage(img_alphax, 0, 0);
    imageDataAlphax = dst.getImageData(0,0,w,h);
    dst.drawImage(img_alphay, 0, 0);
    imageDataAlphay = dst.getImageData(0,0,w,h);
    dst.fillStyle = 'black';
    dst.fillRect(0,0,w,h);
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
            index = (x+y*w)*4;
            alpha_x[x][y] = imageDataAlphax.data[index] - imageDataAlphax.data[index+2]; //red are the positive, blue the negative angles
            alpha_y[x][y] = -imageDataAlphay.data[index] + imageDataAlphay.data[index+2]; //canvas y-coord is inverted
        }
    }
    var alphax_max_norm = 20;
    var alphay_max_norm = 20;
    for(var x=0; x<w; x++){
        for(var y=0; y<h; y++){
            alpha_x[x][y] *= alphax_max_norm/255;
            alpha_y[x][y] *= alphay_max_norm/255;
        }
    }
    
    let curX;
    let curY;
    let pressed = false;
    // update mouse pointer coordinates
    canvas.addEventListener("mousedown", () => pressed = true);
    canvas.addEventListener("mouseup", () => pressed = false);

    beta_x = 0;
    beta_y = 0;
    
    drawcanvas(beta_x, beta_y, alpha_x, alpha_y);

    var scrollX = 0;
    var scrollY = 0;
    document.addEventListener("wheel", (e) =>{
        scrollX = e.deltaX;
        scrollY = e.deltaY;
    })
    document.addEventListener("mousemove", (e) => {
        var bounds = canvas.getBoundingClientRect();
        curX = e.clientX - bounds.left - scrollX - (bounds.right - bounds.left)/2;
        curY = -(e.clientY - bounds.top - scrollY - (bounds.bottom - bounds.top)/2);
        if(pressed==true){drawcanvas(curX, curY, alpha_x, alpha_y);}
    });
};

function drawcanvas(beta_x, beta_y, alpha_x, alpha_y) {
    for(var i=0; i<h*w*4; i++){
        imageDataDst.data[i] = imageDataSrc.data[i];
    }
    r = 25;

    for(var y=0; y<h; y++){
        for(var x=0; x<w; x++){
            theta = Math.sqrt(Math.pow(x - origin_x, 2) + Math.pow(origin_y - y, 2));
            src_x = (x-origin_x) - alpha_x[x][y]; //arbitrary deflection angle from array alpha_x,y
            src_y = (origin_y-y) - alpha_y[x][y];
            d = Math.sqrt(Math.pow(beta_x - src_x, 2) + Math.pow(beta_y - src_y, 2));
            if(d <= r){
                index = (x + y*w)*4;
                imageDataDst.data[index] = imageData_gauss(d, r, 255);
                imageDataDst.data[index+1] = imageData_gauss(d, r, 100);
                imageDataDst.data[index+2] = imageData_gauss(d, r, 100);
                imageDataDst.data[index+3] = 255;
            }
        }
    }

    dst.putImageData(imageDataDst, 0, 0);
}

function imageData_gauss(d, r, max){
    return max*Math.exp(-3.6713 * (Math.pow(d/(r/2.8), 1/2) - 1)); //Sersic profile with n=2
}
