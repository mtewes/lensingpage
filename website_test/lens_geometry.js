var imageDataDst, imageDataSrc;

var canvas = document.getElementById('strong_lensing');
var dst = canvas.getContext('2d');

var w = canvas.width;
var h = canvas.height;
var lens_x=Math.round(w/2);
var lens_y=Math.round(h/2);

let alpha_x = new Array(w);
let alpha_y = new Array(w);
let detA = new Array(w);
for(var i=0; i<w; i++){
    alpha_x[i] = new Array(h);
    alpha_y[i] = new Array(h);
    detA[i] = new Array(h);
}

window.onload = function() {
    dst.fillStyle = 'black';
    dst.fillRect(0,0,w,h);
    imageDataSrc = dst.getImageData(0, 0, w, h);
    imageDataDst = dst.getImageData(0, 0, w, h);

    var or=30*Math.PI/180; //orientation in rad
    var q=0.7; //axis ratio
    var a=100; //major semi-axis
    var thetaE=a*1.;
    var thetaC=thetaE*0.1;
    drawlens(or, q, a, thetaE, thetaC);

    let curX;
    let curY;
    let pressed = false;
    // update mouse pointer coordinates
    canvas.addEventListener("mousedown", () => pressed = true);
    canvas.addEventListener("mouseup", () => pressed = false);

    beta_x = -100;
    beta_y = 70;

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

function drawlens(or, q, a, thetaE, thetaC){
    var rho;
    eps = (1-q)/(1+q);
    for(var x=0; x<w; x+=0.5){
        for(var y=0; y<h; y+=0.5){
            //rho = Math.sqrt(Math.pow(x-lens_x,2)*q + Math.pow(lens_y-y,2)/q);
            //x_rot = lens_x + Math.round((x-lens_x)*Math.cos(or) - (lens_y-y)*Math.sin(or));
            //y_rot = lens_y - Math.round((x-lens_x)*Math.sin(or) + (lens_y-y)*Math.cos(or));
            //index = (x_rot + y_rot*w)*4;
            x_rot = (x-lens_x)*Math.cos(or) + (lens_y-y)*Math.sin(or);
            y_rot = -(x-lens_x)*Math.sin(or) + (lens_y-y)*Math.cos(or);
            rho = Math.sqrt(Math.pow(x_rot,2)*q + Math.pow(y_rot,2)/q);
            index = (Math.round(x) + Math.round(y)*w)*4;
            imageDataSrc.data[index] = imageData_gauss(rho, a/2.8, 200);
            imageDataSrc.data[index+1] = imageData_gauss(rho, a/2.8, 200);
            imageDataSrc.data[index+2] = imageData_gauss(rho, a/2.8, 100);
            imageDataSrc.data[index+3] = 255;

            if(x<=w-0.9 && y<=h-0.9){
                var Y = Math.sqrt(Math.pow(rho,2)+Math.pow(thetaC,2));
                a_x = (1-Math.pow(eps,2))*thetaE/(2*Math.sqrt(eps))*Math.atan(2*Math.sqrt(eps)*x_rot/((1-Math.pow(eps,2))*Y + Math.pow(1-eps,2)*thetaC));
                a_y = (1-Math.pow(eps,2))*thetaE/(2*Math.sqrt(eps))*Math.atanh(2*Math.sqrt(eps)*y_rot/((1-Math.pow(eps,2))*Y + Math.pow(1-eps,2)*thetaC));
                alpha_x[Math.round(x)][Math.round(y)] = a_x/q*Math.cos(or) - a_y*q*Math.sin(or);
                alpha_y[Math.round(x)][Math.round(y)] = a_x/q*Math.sin(or) + a_y*q*Math.cos(or);
                //alpha_x[Math.round(x)][Math.round(y)] = (x-lens_x)*q*thetaE/Math.sqrt(Math.pow(rho,2) + Math.pow(thetaC,2));
                //alpha_y[Math.round(x)][Math.round(y)] = (lens_y-y)/q*thetaE/Math.sqrt(Math.pow(rho,2) + Math.pow(thetaC,2));
                //alpha_x[Math.round(x)][Math.round(y)] = (1-Math.pow(eps,2))*thetaE/(2*Math.sqrt(eps))*Math.atan(2*Math.sqrt(eps)*x_rot/((1-Math.pow(eps,2))*Math.sqrt(Math.pow(rho,2)+Math.pow(thetaC,2)) + Math.pow(1-eps,2)*thetaC));
                //alpha_x[Math.round(x)][Math.round(y)] = (1-Math.pow(eps,2))*thetaE/(2*Math.sqrt(eps))*Math.atanh(2*Math.sqrt(eps)*y_rot/((1-Math.pow(eps,2))*Math.sqrt(Math.pow(rho,2)+Math.pow(thetaC,2)) + Math.pow(1-eps,2)*thetaC));
                detA[Math.round(x)][Math.round(y)] = 1 - thetaE/Y + (1-Math.pow(eps,2))*thetaC*Math.pow(thetaE,2) / (Y*(2*(1+Math.pow(eps,2))*Math.pow(thetaC,2) + Math.pow(x_rot,2) + Math.pow(y_rot,2) + 2*(1-Math.pow(eps,2))*Y*thetaC));
                if(Math.abs(detA[Math.round(x)][Math.round(y)])<0.01){
                    imageDataSrc.data[index+1] = 255;
                }
            }
        }
    }
    dst.putImageData(imageDataSrc, 0, 0);
}

function drawcanvas(beta_x, beta_y, alpha_x, alpha_y) {
    for(var i=0; i<h*w*4; i++){
        imageDataDst.data[i] = imageDataSrc.data[i];
    }
    r = 25;
    var theta;
    for(var y=0; y<h; y++){
        for(var x=0; x<w; x++){
            theta = Math.sqrt(Math.pow(x - lens_x, 2) + Math.pow(lens_y - y, 2));
            src_x = (x-lens_x) - alpha_x[x][y]; //arbitrary deflection angle from array alpha_x,y
            src_y = (lens_y-y) - alpha_y[x][y];
            d = Math.sqrt(Math.pow(beta_x - src_x, 2) + Math.pow(beta_y - src_y, 2));
            if(d <= r){
                index = (x + y*w)*4;
                imageDataDst.data[index] += imageData_gauss(d, r/2.8, 255);
                imageDataDst.data[index+1] += imageData_gauss(d, r/2.8, 100);
                imageDataDst.data[index+2] += imageData_gauss(d, r/2.8, 100);
                imageDataDst.data[index+3] = 255;
            }
        }
    }

    dst.putImageData(imageDataDst, 0, 0);
}

function imageData_gauss(d, r_scale, max){
    return max*Math.exp(-3.6713 * (Math.pow(d/r_scale, 1/2) - 1)); //Sersic profile with n=2
}