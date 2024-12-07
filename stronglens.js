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


window.onload = function() {
    //first
    dst1.fillStyle = 'black';
    dst1.fillRect(0,0,w,h);
    imageDataSrc1 = dst1.getImageData(0, 0, w, h);
    imageDataDst1 = dst1.getImageData(0, 0, w, h);

    var or=30*Math.PI/180; //orientation in rad
    var q=0.85; //axis ratio
    var a=100; //major semi-axis
    var thetaE=a*50;
    var thetaC=1.0*thetaE*0.0;
    drawlens1(or, q, a, thetaE, thetaC);

    let curX;
    let curY;
    /*let pressed1 = false;
    // update mouse pointer coordinates
    canvas1.addEventListener("mousedown", () => pressed1 = true);
    canvas1.addEventListener("mouseup", () => pressed1 = false);*/

    beta_x = -100;
    beta_y = 70;

    drawcanvas1(beta_x, beta_y, alpha_x1, alpha_y1);

    // var scrollX = 0;
    // var scrollY = 0;
    // document.addEventListener("wheel", (e) =>{
    //     scrollX = e.deltaX;
    //     scrollY = e.deltaY;
    //     console.log(scrollX, scrollY)
    // })
    canvas1.addEventListener("mousemove", draw_action);
    canvas1.addEventListener("touchmove", draw_action_touch);
        
};

var draw_action = function (e) {
    var bounds = canvas1.getBoundingClientRect();
    curX = e.clientX - bounds.left - (bounds.right - bounds.left)/2;
    curY = -(e.clientY - bounds.top - (bounds.bottom - bounds.top)/2);
    //if(pressed1==true){drawcanvas1(curX, curY, alpha_x1, alpha_y1);}
    if(Math.abs(curX)<=w && Math.abs(curY)<=h){
        drawcanvas1(curX, curY, alpha_x1, alpha_y1);
    }
};

var draw_action_touch = function (e) {
    e.preventDefault();
    e.stopPropagation();
    var touch = e.touches[0];
    var mouseEvent = new MouseEvent("mousemove", {
        clientX: touch.clientX,
        clientY: touch.clientY
  });
  canvas1.dispatchEvent(mouseEvent);
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
                var Y = Math.sqrt(Math.pow(rho,4)+Math.pow(thetaC,4));
                a_x = (1-Math.pow(eps,2))*thetaE/(2*Math.sqrt(eps))*Math.atanh(2*Math.sqrt(eps)*x_rot/((1-Math.pow(eps,2))*Y + Math.pow(1-eps,2)*thetaC));
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
    r = 25; // size of red galaxy?
    //var theta;
    for(var y=0; y<h; y++){
        for(var x=0; x<w; x++){
            //theta = Math.sqrt(Math.pow(x - origin_x, 2) + Math.pow(origin_y - y, 2));
            src_x = (x-origin_x) - alpha_x1[x][y]; //arbitrary deflection angle from array alpha_x,y
            src_y = (origin_y-y) - alpha_y1[x][y];
            d = Math.sqrt(Math.pow(beta_x - src_x, 2) + Math.pow(beta_y - src_y, 2));
            if(d <= r+10){
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



function imageData_profile(d, r_scale, max){
    return max*Math.exp(-3.6713 * (Math.pow(d/r_scale, 1/2) - 1)); //Sersic profile with n=2
}


// function checkOverlap(index,x,y,r){
//     for(var j=0; j<index; j++){
//         d_x = x[index] - x[j];
//         d_y = y[index] - y[j];
//         d = Math.sqrt(Math.pow(d_x, 2) + Math.pow(d_y, 2));
//         if(d < 1.5*(r[index] + r[j])){ //factor 2 tries to account for stretching in lens plane
//             return true;
//         }
//     }
//     return false;
// }