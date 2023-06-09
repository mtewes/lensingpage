var imageDataDst, srcimageDataDst, imageDataAlphax, imageDataAlphay, black, srcimageDatahelp, imageDatahelp;

var img_alphax = new Image();
img_alphax.src = "alphax_gaussian_random_field_1.png";
var img_alphay = new Image();
img_alphay.src = "alphay_gaussian_random_field_1.png";
var img_kappa = new Image();
img_kappa.src = "kappa_gaussian_random_field_1.png";

var w,h,origin_x,origin_y;

window.onload = function() {
    w = img_kappa.width;
    h = img_kappa.height;
    origin_x=Math.round(w/2);
    origin_y=Math.round(h/2);

    canvas = document.querySelectorAll("canvas");
    canvas[0].width = w;
    canvas[0].height = h;
    var canvases = document.getElementsByTagName('canvas');
    dst = canvases[1].getContext('2d');
    dst.drawImage(img_alphax, 0, 0);
    imageDataAlphax = dst.getImageData(0,0,w,h);
    dst.drawImage(img_alphay, 0, 0);
    imageDataAlphay = dst.getImageData(0,0,w,h);
    dst.fillStyle = 'black';
    dst.fillRect(0,0,w,h);
    //dst.drawImage(img_kappa, 0, 0);
    src = canvases[0].getContext('2d');
    src.fillStyle = 'black';
    src.fillRect(0,0,w,h);

    imageDataDst = dst.getImageData(0, 0, w, h);
    black = src.getImageData(0, 0, w, h);
    srcimageDataDst = src.getImageData(0, 0, w, h);
    imageDatahelp = src.getImageData(0, 0, w, h);
    srcimageDatahelp = src.getImageData(0, 0, w, h);

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
    canvases[1].addEventListener("mousedown", () => pressed = true);
    canvases[1].addEventListener("mouseup", () => pressed = false);
    
    var N = document.getElementById('gal_num').value;
    document.getElementById('gal_num_out').value = N;

    drawcanvas(alpha_x, alpha_y, N);
    document.getElementById("generate").onclick = function(){
        N = document.getElementById('gal_num').value
        document.getElementById('gal_num_out').value = N;
        drawcanvas(alpha_x, alpha_y, N);
    };

    var scrollX = 0;
    var scrollY = 0;
    document.addEventListener("wheel", (e) =>{
        scrollX = e.deltaX;
        scrollY = e.deltaY;
    })

    document.addEventListener("mousemove", (e) => {
        var bounds = canvas[0].getBoundingClientRect();
        curX = (e.clientX - bounds.left - scrollX - (bounds.right - bounds.left)/2).toFixed(2);
        curY = (-(e.clientY - bounds.top - scrollY - (bounds.bottom - bounds.top)/2)).toFixed(2);
        if(Math.abs(curX) > w/2 || Math.abs(curY) > h/2){ //if mouse is not in first but in second canvas
            var bounds = canvas[1].getBoundingClientRect();
            curX = (e.clientX - bounds.left - scrollX - (bounds.right - bounds.left)/2).toFixed(2);
            curY = (-(e.clientY - bounds.top - scrollY - (bounds.bottom - bounds.top)/2)).toFixed(2);
            if(Math.abs(curX) > w/2 || Math.abs(curY) > h/2){ //if mouse is not in any canvas
                curX=null;
                curY=null;
            }
        }
        if(pressed==true){drawgalaxy(curX, curY, alpha_x, alpha_y);}
        document.getElementById("x_coord").value = curX;
        document.getElementById("y_coord").value = curY;
    });
};

function drawgalaxy(curX, curY, alpha_x, alpha_y){
    for(var i=0; i<h*w*4; i++){
        imageDataDst.data[i] = imageDatahelp.data[i];
        srcimageDataDst.data[i] = srcimageDatahelp.data[i];
    }
    r = 25;
    
    /*xmin = Math.round(origin_x + curX - r);
    xmax = Math.round(origin_x + curX + r);
    ymin = Math.round(origin_y - curY - r);
    ymax = Math.round(origin_y - curY + r);
    if (xmin < 0) {xmin = 0;}
    if (xmax > w) {xmax = w;}
    if (ymin < 0) {ymin = 0;}
    if (ymax > h) {ymax = h;}
    //source plane circle
    for(var y=ymin; y<ymax; y++){
        for(var x=xmin; x<xmax; x++){
            d = Math.sqrt(Math.pow(origin_x + curX - x, 2) + Math.pow(origin_y - curY - y, 2));
            if(d <= r){
                index = (x + y*w)*4;
                srcimageDataDst.data[index] = imageData_profile(d, r, 255);
                srcimageDataDst.data[index+1] = imageData_profile(d, r, 100);
                srcimageDataDst.data[index+2] = imageData_profile(d, r, 100);
                srcimageDataDst.data[index+3] = 255;
            }
        }
    }*/

    for(var y=0; y<h; y++){
        for(var x=0; x<w; x++){
            theta = Math.sqrt(Math.pow(x - origin_x, 2) + Math.pow(origin_y - y, 2));
            src_x = (x-origin_x) - alpha_x[x][y]; //arbitrary deflection angle from array alpha_x,y
            src_y = (origin_y-y) - alpha_y[x][y];
            d = Math.sqrt(Math.pow(curX - src_x, 2) + Math.pow(curY - src_y, 2));
            if(d <= r){
                index = (x + y*w)*4;
                imageDataDst.data[index] = imageData_profile(d, r, 255);
                imageDataDst.data[index+1] = imageData_profile(d, r, 100);
                imageDataDst.data[index+2] = imageData_profile(d, r, 100);
                imageDataDst.data[index+3] = 255;

                /*index2 = Math.round((origin_x+src_x +(origin_y-src_y)*w))*4;
                srcimageDataDst.data[index2] = imageData_profile(d, r, 255);
                srcimageDataDst.data[index2+1] = imageData_profile(d, r, 100);
                srcimageDataDst.data[index2+2] = imageData_profile(d, r, 100);
                srcimageDataDst.data[index2+3] = 255;*/
            }
        }
    }

    src.putImageData(srcimageDataDst, 0, 0);
    dst.putImageData(imageDataDst, 0, 0);
}

function drawcanvas(alpha_x, alpha_y, N) {
    for(var i=0; i<h*w*4; i++){
        imageDataDst.data[i] = black.data[i];
        srcimageDataDst.data[i] = black.data[i];
    }
    let r = new Array(N); //size
    let q = new Array(N); //axis ratio
    let or = new Array(N); //orientation
    for(var i=0; i<N; i++){
        r[i] = getRanNum(20,30);
        q[i] = getRanNum(0.5,1);
        or[i] = getRanNum(0,Math.PI)
    }
    let dist = new Array(N); //distance from center
    let az = new Array(N); //azimuthal angle
    for(var i=0; i<N; i++){
        dist[i] = getRanNum(0, 0.9*w/2);
        az[i] = getRanNum(0, 2*Math.PI);
        if(checkOverlap(i,dist,az,r) == true){i--;} //prevent galaxy overlap
    }
    let colour = new Array(N);
    for(var i=0; i<N; i++){
        colour[i] = new Array(3);
        colour[i][0] = Math.round(getRanNum(215, 255));
        colour[i][1] = Math.round(getRanNum(80, 120));
        colour[i][2] = Math.round(getRanNum(80, 120));
    }

    for(var i=0; i<N; i++){
        src_x = dist[i]*Math.cos(az[i]);
        src_y = dist[i]*Math.sin(az[i]);
        xmin = Math.round(-r[i]);
        xmax = Math.round(+r[i]);
        ymin = Math.round(-r[i]);
        ymax = Math.round(+r[i]);
        for(var x=xmin; x<=xmax; x+=0.5){ //0.5 step because of rotated reference frame of a galaxy
            for(var y=ymin; y<=ymax; y+=0.5){
                rho = Math.sqrt(Math.pow(x, 2)*q[i] + Math.pow(y, 2)/q[i]);
                if(rho <= r[i]*Math.sqrt(q[i])){
                    x_rot = Math.round(src_x + origin_x + x*Math.cos(or[i]) - y*Math.sin(or[i])) //rotate according to galaxy orientation
                    y_rot = Math.round(origin_y - src_y - (x*Math.sin(or[i]) + y*Math.cos(or[i])))
                    index = (x_rot + y_rot*w)*4;
                    srcimageDataDst.data[index] = imageData_profile(rho, r[i], colour[i][0]);
                    srcimageDataDst.data[index+1] = imageData_profile(rho, r[i], colour[i][1]);
                    srcimageDataDst.data[index+2] = imageData_profile(rho, r[i], colour[i][2]);
                    srcimageDataDst.data[index+3] = 255;
                }
            }
        }
    }

    for(var y=0; y<h; y++){
        for(var x=0; x<w; x++){
            src_x = (x-origin_x) - alpha_x[x][y]; //arbitrary deflection angle from array alpha_x,y
            src_y = (origin_y-y) - alpha_y[x][y];
            for(var i=0; i<N; i++){
                src_x_gal = src_x - dist[i]*Math.cos(az[i]);
                src_y_gal = src_y - dist[i]*Math.sin(az[i]);
                x_rot = src_x_gal*Math.cos(or[i]) + src_y_gal*Math.sin(or[i]); //inverse rotation
                y_rot = -src_x_gal*Math.sin(or[i]) + src_y_gal*Math.cos(or[i]);
                rho = Math.sqrt(Math.pow(x_rot, 2)*q[i] + Math.pow(y_rot, 2)/q[i]);
                if(rho <= r[i]*Math.sqrt(q[i])){
                    index = (x + y*w)*4;
                    imageDataDst.data[index] = imageData_profile(rho, r[i], colour[i][0]);
                    imageDataDst.data[index+1] = imageData_profile(rho, r[i], colour[i][1]);
                    imageDataDst.data[index+2] = imageData_profile(rho, r[i], colour[i][2]);
                    imageDataDst.data[index+3] = 255;
                }
            }
        }
    }

    for(var i=0; i<h*w*4; i++){
        imageDatahelp.data[i] = imageDataDst.data[i];
        srcimageDatahelp.data[i] = srcimageDataDst.data[i];
    }

    dst.putImageData(imageDataDst, 0, 0);
    src.putImageData(srcimageDataDst, 0, 0);
}

function getRanNum(min, max) {
    return Math.random() * (max - min) + min;
}

function checkOverlap(index,dist,az,r){
    for(var j=0; j<index; j++){
        d_x = dist[index]*Math.cos(az[index]) - dist[j]*Math.cos(az[j]);
        d_y = dist[index]*Math.sin(az[index]) - dist[j]*Math.sin(az[j]);
        d = Math.sqrt(Math.pow(d_x, 2) + Math.pow(d_y, 2));
        if(d < 2*(r[index] + r[j])){ //factor 2 accounts for stretching in lens plane
            return true;
        }
    }
    return false;
}

function imageData_profile(d, r, max){
    return max*Math.exp(-3.6713 * (Math.pow(d/(r/2.8), 1/2) - 1)); //Sersic profile with n=2
}
