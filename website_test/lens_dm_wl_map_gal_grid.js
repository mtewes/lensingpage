var imageDataLens, imageDataSrc, imageDataAlphax, imageDataAlphay, black;

var img_alphax = new Image();
img_alphax.src = "alphax_gaussian_random_field_1.png";
var img_alphay = new Image();
img_alphay.src = "alphay_gaussian_random_field_1.png";
var img_kappa = new Image();
img_kappa.src = "kappa_gaussian_random_field_1.png";

var canvas = document.getElementById('grid_lens');
var lens = canvas.getContext('2d');

var w = canvas.width;
var h = canvas.height;
var origin_x=Math.round(w/2);
var origin_y=Math.round(h/2);

window.onload = function() {
    lens.drawImage(img_alphax, 0, 0);
    imageDataAlphax = lens.getImageData(0,0,w,h);
    lens.drawImage(img_alphay, 0, 0);
    imageDataAlphay = lens.getImageData(0,0,w,h);
    lens.fillStyle = 'black';
    lens.fillRect(0,0,w,h);

    imageDataLens = lens.getImageData(0, 0, w, h);
    black = lens.getImageData(0, 0, w, h);

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
    var alpha_max_norm = document.getElementById('alpha_scale').value;
    var alpha_max_norm_help = alpha_max_norm;
    document.getElementById('alpha_scale_out').value = alpha_max_norm;
    //var alphax_max_norm = 25;
    //var alphay_max_norm = 25;
    for(var x=0; x<w; x++){
        for(var y=0; y<h; y++){
            alpha_x[x][y] *= alpha_max_norm/255;
            alpha_y[x][y] *= alpha_max_norm/255;
        }
    }
    document.getElementById("alpha_scale").onclick = function(){
        alpha_max_norm = document.getElementById('alpha_scale').value;
        document.getElementById('alpha_scale_out').value = alpha_max_norm;
        for(var x=0; x<w; x++){
            for(var y=0; y<h; y++){
                alpha_x[x][y] *= alpha_max_norm/alpha_max_norm_help;
                alpha_y[x][y] *= alpha_max_norm/alpha_max_norm_help;
            }
        }
        alpha_max_norm_help = alpha_max_norm;
        drawcanvas(alpha_x, alpha_y, d_gal);
    };
    let pressed=false;
    document.getElementById("toggle_dm_gal_grid").onclick = function(){
        if(pressed==false){
            lens.drawImage(img_kappa, 0, 0);
            black = lens.getImageData(0,0,w,h);
            for(var i=0; i<w*h*4; i++){
                black.data[i*4]=0; //take out all red
            }
            pressed=true;
        } else{
            lens.fillRect(0,0,w,h);
            black = lens.getImageData(0,0,w,h);
            pressed=false;
        }
        drawcanvas(alpha_x, alpha_y, d_gal);
    };
    
    //var N = document.getElementById('gal_num').value;
    //document.getElementById('gal_num_out').value = N;
    d_gal = w/10
    drawcanvas(alpha_x, alpha_y, d_gal);
};

function drawcanvas(alpha_x, alpha_y, d_gal) {
    for(var i=0; i<h*w*4; i++){
        imageDataLens.data[i] = black.data[i];
    }
    r=25;

    for(var y=0; y<h; y++){
        for(var x=0; x<w; x++){
            src_x = (x-origin_x) - alpha_x[x][y]; //arbitrary deflection angle from array alpha_x,y
            src_y = (origin_y-y) - alpha_y[x][y];
            src_x = origin_x + src_x;
            src_y = origin_y - src_y;
            for(var px=d_gal; px<w-r; px+=d_gal){
                for(var py=d_gal; py<h-r; py+=d_gal){
                    d = Math.sqrt(Math.pow(px-src_x, 2) + Math.pow(py-src_y, 2));
                    if(d<=r){
                        index = (x + y*w)*4;
                        imageDataLens.data[index] += imageData_profile(d, r, 200);
                        imageDataLens.data[index+1] += imageData_profile(d, r, 100);
                        imageDataLens.data[index+2] += imageData_profile(d, r, 100);
                        imageDataLens.data[index+3] = 255;
                    }
                }
            }
            tol = 0.5;
            for(var i=d_gal; i<w; i+=d_gal){
                if(Math.round(src_x) <= Math.round(i)+tol && Math.round(src_x) >= Math.round(i)-tol){
                    index = (x + y*w)*4;
                    imageDataLens.data[index+1] = 200;
                } else if(Math.round(src_y) <= Math.round(i)+tol && Math.round(src_y) >= Math.round(i)-tol){
                    index = (x + y*w)*4;
                    imageDataLens.data[index+1] = 200;
                }
            }
        }
    }

    lens.putImageData(imageDataLens, 0, 0);
}

function imageData_profile(d, r, max){
    return max*Math.exp(-3.6713 * (Math.pow(d/(r/2.8), 1/2) - 1)); //Sersic profile with n=2
}
