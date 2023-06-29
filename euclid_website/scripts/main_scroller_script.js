//first canvas
var imageDataDst1, imageDataSrc1;

var canvas1 = document.getElementById('strong_lensing');
var dst1 = canvas1.getContext('2d');

var w = canvas1.width;
var h = canvas1.height;
var origin_x=Math.round(w/2);
var origin_y=Math.round(h/2);

let alpha_x1 = new Array(w);
let alpha_y1 = new Array(w);
let detA = new Array(w);
for(var i=0; i<w; i++){
    alpha_x1[i] = new Array(h);
    alpha_y1[i] = new Array(h);
    detA[i] = new Array(h);
}

//second canvas
var imageDataDst2, imageDataSrc2, imageDataAlphax, imageDataAlphay;

var img_alphax = new Image();
img_alphax.src = "../images/scrollpage/alphax_gaussian_random_field_1.png"; //path w.r.t. html page
var img_alphay = new Image();
img_alphay.src = "../images/scrollpage/alphay_gaussian_random_field_1.png";
var img_kappa = new Image();
img_kappa.src = "../images/scrollpage/kappa_gaussian_random_field_1.png";

var canvas2 = document.getElementById('wl_kappa_map');
var dst2 = canvas2.getContext('2d');

let alpha_x2 = new Array(w);
let alpha_y2 = new Array(w);
    for(var i=0; i<w; i++){
        alpha_x2[i] = new Array(h);
        alpha_y2[i] = new Array(h);
    }

//third canvas
var imageDataLens, imageDataSrc3, black;

var canvas3 = document.getElementById('grid_lens');
var lens = canvas3.getContext('2d');

let alpha_x3 = new Array(w);
let alpha_y3 = new Array(w);
    for(var i=0; i<w; i++){
        alpha_x3[i] = new Array(h);
        alpha_y3[i] = new Array(h);
    }

//structure
var canvas4 = document.getElementById('structure_map');
var structure_map = canvas4.getContext('2d');

var img_structure = new Image();
img_structure.src = "../images/scrollpage/Euclid_flagship_mock_galaxy_catalogue_cropped.png";

window.onload = function() {
    //first
    dst1.fillStyle = 'black';
    dst1.fillRect(0,0,w,h);
    imageDataSrc1 = dst1.getImageData(0, 0, w, h);
    imageDataDst1 = dst1.getImageData(0, 0, w, h);

    var or=30*Math.PI/180; //orientation in rad
    var q=0.7; //axis ratio
    var a=100; //major semi-axis
    var thetaE=a*1.;
    var thetaC=thetaE*0.1;
    drawlens1(or, q, a, thetaE, thetaC);

    let curX;
    let curY;
    let pressed1 = false;
    // update mouse pointer coordinates
    canvas1.addEventListener("mousedown", () => pressed1 = true);
    canvas1.addEventListener("mouseup", () => pressed1 = false);

    beta_x = -100;
    beta_y = 70;

    drawcanvas1(beta_x, beta_y, alpha_x1, alpha_y1);

    var scrollX = 0;
    var scrollY = 0;
    document.addEventListener("wheel", (e) =>{
        scrollX = e.deltaX;
        scrollY = e.deltaY;
    })
    document.addEventListener("mousemove", (e) => {
        var bounds = canvas1.getBoundingClientRect();
        curX = e.clientX - bounds.left - scrollX - (bounds.right - bounds.left)/2;
        curY = -(e.clientY - bounds.top - scrollY - (bounds.bottom - bounds.top)/2);
        if(pressed1==true){drawcanvas1(curX, curY, alpha_x1, alpha_y1);}
    });

    //second
    dst2.drawImage(img_alphax, 0, 0);
    imageDataAlphax = dst2.getImageData(0,0,w,h);
    dst2.drawImage(img_alphay, 0, 0);
    imageDataAlphay = dst2.getImageData(0,0,w,h);
    dst2.fillStyle = 'black';
    dst2.fillRect(0,0,w,h);
    imageDataSrc2 = dst2.getImageData(0, 0, w, h);
    imageDataDst2 = dst2.getImageData(0, 0, w, h);

    let alpha_x2 = new Array(w);
    let alpha_y2 = new Array(w);
    for(var i=0; i<w; i++){
        alpha_x2[i] = new Array(h);
        alpha_y2[i] = new Array(h);
    }
    for(var x=0; x<w; x++){
        for(var y=0; y<h; y++){
            index = (x+y*w)*4;
            alpha_x2[x][y] = imageDataAlphax.data[index] - imageDataAlphax.data[index+2]; //red are the positive, blue the negative angles
            alpha_y2[x][y] = -imageDataAlphay.data[index] + imageDataAlphay.data[index+2]; //canvas y-coord is inverted
        }
    }
    var alphax_max_norm = 20;
    var alphay_max_norm = 20;
    for(var x=0; x<w; x++){
        for(var y=0; y<h; y++){
            alpha_x2[x][y] *= alphax_max_norm/255;
            alpha_y2[x][y] *= alphay_max_norm/255;
        }
    }
    
    let pressed2 = false;
    // update mouse pointer coordinates
    canvas2.addEventListener("mousedown", () => pressed2 = true);
    canvas2.addEventListener("mouseup", () => pressed2 = false);

    drawcanvas2(0, 0, alpha_x2, alpha_y2);
    document.addEventListener("mousemove", (e) => {
        var bounds = canvas2.getBoundingClientRect();
        curX = e.clientX - bounds.left - scrollX - (bounds.right - bounds.left)/2;
        curY = -(e.clientY - bounds.top - scrollY - (bounds.bottom - bounds.top)/2);
        //if(pressed2==true){drawcanvas2(curX, curY, alpha_x2, alpha_y2);}
        drawcanvas2(curX, curY, alpha_x2, alpha_y2);
    });

    //third
    lens.drawImage(img_alphax, 0, 0);
    imageDataAlphax = lens.getImageData(0,0,w,h);
    lens.drawImage(img_alphay, 0, 0);
    imageDataAlphay = lens.getImageData(0,0,w,h);
    lens.fillStyle = 'black';
    lens.fillRect(0,0,w,h);

    imageDataLens = lens.getImageData(0, 0, w, h);
    black = lens.getImageData(0, 0, w, h);

    let alpha_x3 = new Array(w);
    let alpha_y3 = new Array(w);
    for(var i=0; i<w; i++){
        alpha_x3[i] = new Array(h);
        alpha_y3[i] = new Array(h);
    }
    for(var x=0; x<w; x++){
        for(var y=0; y<h; y++){
            index = (x+y*w)*4;
            alpha_x3[x][y] = imageDataAlphax.data[index] - imageDataAlphax.data[index+2]; //red are the positive, blue the negative angles
            alpha_y3[x][y] = -imageDataAlphay.data[index] + imageDataAlphay.data[index+2]; //canvas y-coord is inverted
        }
    }
    var alpha_max_norm3 = document.getElementById('alpha_scale').value;
    var alpha_max_norm_help = alpha_max_norm3;
    document.getElementById('alpha_scale_out').value = alpha_max_norm3;
    for(var x=0; x<w; x++){
        for(var y=0; y<h; y++){
            alpha_x3[x][y] *= alpha_max_norm3/255;
            alpha_y3[x][y] *= alpha_max_norm3/255;
        }
    }
    d_gal = w/10
    document.getElementById("alpha_scale").onclick = function(){
        alpha_max_norm3 = document.getElementById('alpha_scale').value;
        document.getElementById('alpha_scale_out').value = alpha_max_norm3;
        for(var x=0; x<w; x++){
            for(var y=0; y<h; y++){
                alpha_x3[x][y] *= alpha_max_norm3/alpha_max_norm_help;
                alpha_y3[x][y] *= alpha_max_norm3/alpha_max_norm_help;
            }
        }
        alpha_max_norm_help = alpha_max_norm3;
        drawcanvas3(alpha_x3, alpha_y3, d_gal);
    };
    let pressed3=false;
    document.getElementById("toggle_dm_gal_grid").onclick = function(){
        if(pressed3==false){
            lens.drawImage(img_kappa, 0, 0);
            black = lens.getImageData(0,0,w,h);
            for(var i=0; i<w*h*4; i++){
                black.data[i*4]=0; //take out all red
            }
            pressed3=true;
        } else{
            lens.fillRect(0,0,w,h);
            black = lens.getImageData(0,0,w,h);
            pressed3=false;
        }
        drawcanvas3(alpha_x3, alpha_y3, d_gal);
    };
    
    drawcanvas3(alpha_x3, alpha_y3, d_gal);

    //structure_map
    var age;
    let max_age = 13.76;
    let min_age = 2.86;
    min_age += canvas4.width / img_structure.width * (max_age - min_age); //age at left border of canvas
    let range = document.getElementById('universe_age');
    var xOffset = 0;
    var yOffset = 0;
    document.getElementById('universe_age_out').value = max_age.toFixed(1) + ' Mrd. Jahre';
    structure_map.drawImage(img_structure, xOffset, yOffset, canvas4.width, canvas4.height, 0, 0, canvas4.width, canvas4.width);
    range.addEventListener('mousemove', function(){
        age = (range.max - range.value) * (max_age - min_age) / range.max + min_age;
        document.getElementById('universe_age_out').value = age.toFixed(1) + ' Mrd. Jahre';
        xOffset = (img_structure.width - canvas4.width) * range.value / range.max;
        structure_map.drawImage(img_structure, xOffset, yOffset, canvas4.width, canvas4.height, 0, 0, canvas4.width, canvas4.width);
      })
};

function drawlens1(or, q, a, thetaE, thetaC){
    var rho;
    eps = (1-q)/(1+q);
    for(var x=0; x<w; x+=0.5){
        for(var y=0; y<h; y+=0.5){
            x_rot = (x-origin_x)*Math.cos(or) + (origin_y-y)*Math.sin(or);
            y_rot = -(x-origin_x)*Math.sin(or) + (origin_y-y)*Math.cos(or);
            rho = Math.sqrt(Math.pow(x_rot,2)*q + Math.pow(y_rot,2)/q);
            index = (Math.round(x) + Math.round(y)*w)*4;
            imageDataSrc1.data[index] = imageData_profile(rho, a/2.8, 255);
            imageDataSrc1.data[index+1] = imageData_profile(rho, a/2.8, 200);
            imageDataSrc1.data[index+2] = imageData_profile(rho, a/2.8, 100);
            imageDataSrc1.data[index+3] = 255;

            if(x<=w-0.9 && y<=h-0.9){
                var Y = Math.sqrt(Math.pow(rho,2)+Math.pow(thetaC,2));
                a_x = (1-Math.pow(eps,2))*thetaE/(2*Math.sqrt(eps))*Math.atan(2*Math.sqrt(eps)*x_rot/((1-Math.pow(eps,2))*Y + Math.pow(1-eps,2)*thetaC));
                a_y = (1-Math.pow(eps,2))*thetaE/(2*Math.sqrt(eps))*Math.atanh(2*Math.sqrt(eps)*y_rot/((1-Math.pow(eps,2))*Y + Math.pow(1-eps,2)*thetaC));
                alpha_x1[Math.round(x)][Math.round(y)] = a_x/q*Math.cos(or) - a_y*q*Math.sin(or);
                alpha_y1[Math.round(x)][Math.round(y)] = a_x/q*Math.sin(or) + a_y*q*Math.cos(or);
                /*detA[Math.round(x)][Math.round(y)] = 1 - thetaE/Y + (1-Math.pow(eps,2))*thetaC*Math.pow(thetaE,2) / (Y*(2*(1+Math.pow(eps,2))*Math.pow(thetaC,2) + Math.pow(x_rot,2) + Math.pow(y_rot,2) + 2*(1-Math.pow(eps,2))*Y*thetaC));
                if(Math.abs(detA[Math.round(x)][Math.round(y)])<0.01){ //draw critical curve
                    imageDataSrc1.data[index+1] = 255;
                }*/
            }
        }
    }
    dst1.putImageData(imageDataSrc1, 0, 0);
}

function drawcanvas1(beta_x, beta_y, alpha_x1, alpha_y1) {
    for(var i=0; i<h*w*4; i++){
        imageDataDst1.data[i] = imageDataSrc1.data[i];
    }
    r = 25;
    var theta;
    for(var y=0; y<h; y++){
        for(var x=0; x<w; x++){
            theta = Math.sqrt(Math.pow(x - origin_x, 2) + Math.pow(origin_y - y, 2));
            src_x = (x-origin_x) - alpha_x1[x][y]; //arbitrary deflection angle from array alpha_x,y
            src_y = (origin_y-y) - alpha_y1[x][y];
            d = Math.sqrt(Math.pow(beta_x - src_x, 2) + Math.pow(beta_y - src_y, 2));
            if(d <= r){
                index = (x + y*w)*4;
                imageDataDst1.data[index] += imageData_profile(d, r/2.8, 255);
                imageDataDst1.data[index+1] += imageData_profile(d, r/2.8, 100);
                imageDataDst1.data[index+2] += imageData_profile(d, r/2.8, 100);
                imageDataDst1.data[index+3] = 255;
            }
        }
    }

    dst1.putImageData(imageDataDst1, 0, 0);
}

function drawcanvas2(beta_x, beta_y, alpha_x2, alpha_y2) {
    for(var i=0; i<h*w*4; i++){
        imageDataDst2.data[i] = imageDataSrc2.data[i];
    }
    r = 25;

    for(var y=0; y<h; y++){
        for(var x=0; x<w; x++){
            theta = Math.sqrt(Math.pow(x - origin_x, 2) + Math.pow(origin_y - y, 2));
            src_x = (x-origin_x) - alpha_x2[x][y]; //arbitrary deflection angle from array alpha_x,y
            src_y = (origin_y-y) - alpha_y2[x][y];
            d = Math.sqrt(Math.pow(beta_x - src_x, 2) + Math.pow(beta_y - src_y, 2));
            if(d <= r){
                index = (x + y*w)*4;
                imageDataDst2.data[index] = imageData_profile(d, r/2.8, 255);
                imageDataDst2.data[index+1] = imageData_profile(d, r/2.8, 100);
                imageDataDst2.data[index+2] = imageData_profile(d, r/2.8, 100);
                imageDataDst2.data[index+3] = 255;
            }
        }
    }

    dst2.putImageData(imageDataDst2, 0, 0);
}

function drawcanvas3(alpha_x3, alpha_y3, d_gal) {
    for(var i=0; i<h*w*4; i++){
        imageDataLens.data[i] = black.data[i];
    }
    r=25;

    for(var y=0; y<h; y++){
        for(var x=0; x<w; x++){
            src_x = (x-origin_x) - alpha_x3[x][y]; //arbitrary deflection angle from array alpha_x,y
            src_y = (origin_y-y) - alpha_y3[x][y];
            src_x = origin_x + src_x;
            src_y = origin_y - src_y;
            for(var px=d_gal; px<w-r; px+=d_gal){
                for(var py=d_gal; py<h-r; py+=d_gal){
                    d = Math.sqrt(Math.pow(px-src_x, 2) + Math.pow(py-src_y, 2));
                    if(d<=r){
                        index = (x + y*w)*4;
                        imageDataLens.data[index] += imageData_profile(d, r/2.8, 200);
                        imageDataLens.data[index+1] += imageData_profile(d, r/2.8, 100);
                        imageDataLens.data[index+2] += imageData_profile(d, r/2.8, 100);
                        imageDataLens.data[index+3] = 255;
                    }
                }
            }
            /*tol = 0.5;
            for(var i=d_gal; i<w; i+=d_gal){ //draw grid
                if(Math.round(src_x) <= Math.round(i)+tol && Math.round(src_x) >= Math.round(i)-tol){
                    index = (x + y*w)*4;
                    imageDataLens.data[index+1] = 200;
                } else if(Math.round(src_y) <= Math.round(i)+tol && Math.round(src_y) >= Math.round(i)-tol){
                    index = (x + y*w)*4;
                    imageDataLens.data[index+1] = 200;
                }
            }*/
        }
    }

    lens.putImageData(imageDataLens, 0, 0);
}

function imageData_profile(d, r_scale, max){
    return max*Math.exp(-3.6713 * (Math.pow(d/r_scale, 1/2) - 1)); //Sersic profile with n=2
}