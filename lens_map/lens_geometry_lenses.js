var imageDataDst, imageDataSrc, srcimageDataSrc, srcimageDataDst;

w = 701;
h = 701;

origin_x=Math.round(w/2);
origin_y=Math.round(h/2);

window.onload = function() {
    w = img.width;
    h = img.height;

    canvas = document.querySelectorAll("canvas");
    canvas[0].width = w;
    canvas[0].height = h;
    
    var canvases = document.getElementsByTagName('canvas');
    dst = canvases[1].getContext('2d');
    src = canvases[0].getContext('2d');
    dst.fillStyle='black';
    dst.fillRect(0,0,w,h);
    src.fillStyle='black';
    src.fillRect(0,0,w,h);

    imageDataSrc = dst.getImageData(0, 0, w, h);
    imageDataDst = dst.getImageData(0, 0, w, h);
    srcimageDataSrc = src.getImageData(0, 0, w, h);
    srcimageDataDst = src.getImageData(0, 0, w, h);

    let alpha_x = new Array(w);
    let alpha_y = new Array(w);
    for(var i=0; i<w; i++){
        alpha_x[i] = new Array(h);
        alpha_y[i] = new Array(h);
    }
    for(var x=0; x<w; x++){
        for(var y=0; y<h; y++){
            theta = Math.sqrt(Math.pow(x - origin_x, 2) + Math.pow(origin_y - y, 2));
            alpha_x[x][y] = (x - origin_x)/Math.pow(theta, 1); //SIS profile, point mass: Math.pow(theta, 2)
            alpha_y[x][y] = (origin_y - y)/Math.pow(theta, 1);
        }
    }
    
    var thetaE = document.getElementById('einst_rad').value;
    var N_gal = document.getElementById('gal_num').value;
    document.getElementById('einst_rad_out').value = thetaE;
    document.getElementById('gal_num_out').value = N_gal;

    N_lens = 3;
    N_gal = 5;

    drawcanvas(N_gal, N_lens);

    document.getElementById("generate").onclick = function(){
        thetaE = document.getElementById('einst_rad').value;
        document.getElementById('einst_rad_out').value = thetaE;
        N_gal = document.getElementById('gal_num').value
        document.getElementById('gal_num_out').value = N_gal;
        drawcanvas(N_gal, N_lens);
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
        document.getElementById("x_coord").value = curX;
        document.getElementById("y_coord").value = curY;

        kappa = thetaE/(2*Math.sqrt(Math.pow(curX, 2) + Math.pow(curY, 2))); //kappa for SIS profile
        wl_threshold = 0.1;
        if(curX==null){
            document.getElementById("kappa").value = null;
        } else if(kappa >= wl_threshold){
            document.getElementById("kappa").value = "Strong Lensing";
        } else if(kappa < wl_threshold){
            document.getElementById("kappa").value = "Weak Lensing";
        }
    });
};

function drawcanvas(N_gal, N_lens) {
    for(var i=0; i<h*w*4; i++){
        imageDataDst.data[i] = imageDataSrc.data[i];
        srcimageDataDst.data[i] = srcimageDataSrc.data[i];
    }

    let thetaE = new Array(N_gal);
    let lens_r = new Array(N_gal);
    for(var i=0; i<N_gal; i++){
        thetaE[i] = getRanNum(20,30);
        lens_r[i] = getRanNum(3*thetaE[i]/4,5*thetaE[i]/6);
    }

    let lens_dist = new Array(N_lens);
    let lens_az = new Array(N_lens);
    for(var i=0; i<N_lens; i++){
        lens_dist[i] = getRanNum(0, 2*w/5);
        lens_az[i] = getRanNum(0, 2*Math.PI);
        if(checkOverlap(i,lens_dist,lens_az,lens_r) == true){i--;} //prevent galaxy overlap
    }

    let alpha_x = new Array(w);
    let alpha_y = new Array(w);
    for(var i=0; i<w; i++){
        alpha_x[i] = new Array(h);
        alpha_y[i] = new Array(h);
    }

    var defl_x, defl_y;
    for(var x=0; x<w; x++){
        for(var y=0; y<h; y++){
            defl_x = 0;
            defl_y = 0;
            for(var i=0; i<N_lens; i++){
                theta = Math.sqrt(Math.pow(x - origin_x - lens_dist[i]*Math.cos(lens_az[i]), 2) + Math.pow(origin_y - y  - lens_dist[i]*Math.sin(lens_az[i]), 2));
                defl_x += (x - origin_x - lens_dist[i]*Math.cos(lens_az[i])) * thetaE[i] / Math.pow(theta, 1); //SIS profile, point mass: Math.pow(theta, 2)
                defl_y += (origin_y - y - lens_dist[i]*Math.sin(lens_az[i])) * thetaE[i] / Math.pow(theta, 1);
            }
            alpha_x[x][y] = defl_x;
            alpha_y[x][y] = defl_y;
        }
    }

    let r = new Array(N_gal); //size
    for(var i=0; i<N_gal; i++){
        r[i] = getRanNum(15,25);
    }
    let dist = new Array(N_gal); //distance from center
    let az = new Array(N_gal); //azimuthal angle
    for(var i=0; i<N_gal; i++){
        dist[i] = getRanNum(0, w/3);
        az[i] = getRanNum(0, 2*Math.PI);
        if(checkOverlap(i,dist,az,r) == true){i--;} //prevent galaxy overlap
        if(checkSrcLensOverlap(dist[i],az[i],r[i],lens_dist,lens_az,lens_r) == true){i--;} //prevent overlap with lenses
    }
    let colour = new Array(N_gal);
    for(var i=0; i<N_gal; i++){
        colour[i] = new Array(3);
        colour[i][0] = Math.round(getRanNum(215, 255));
        colour[i][1] = Math.round(getRanNum(70, 130));
        colour[i][2] = Math.round(getRanNum(70, 130));
    }

    for(var i=0; i<N_gal; i++){
        src_x = dist[i]*Math.cos(az[i]);
        src_y = dist[i]*Math.sin(az[i]);
        xmin = Math.round(origin_x+src_x-r[i]);
        xmax = Math.round(origin_x+src_x+r[i]);
        ymin = Math.round(origin_y-src_y-r[i]);
        ymax = Math.round(origin_y-src_y+r[i]);
        for(var x=xmin; x<=xmax; x++){
            for(var y=ymin; y<=ymax; y++){
                d = Math.sqrt(Math.pow(x - origin_x - src_x, 2) + Math.pow(origin_y - y - src_y, 2));
                if(d<=r[i]){
                    index = (x + y*w)*4;
                    srcimageDataDst.data[index] = imageData_profile(d, r[i], colour[i][0], srcimageDataSrc.data[index]);
                    srcimageDataDst.data[index+1] = imageData_profile(d, r[i], colour[i][1], srcimageDataSrc.data[index+1]);
                    srcimageDataDst.data[index+2] = imageData_profile(d, r[i], colour[i][2], srcimageDataSrc.data[index+2]);
                    srcimageDataDst.data[index+3] = 255;
                }
            }
        }
    }
    for(var i=0; i<N_lens; i++){
        src_x = lens_dist[i]*Math.cos(lens_az[i]);
        src_y = lens_dist[i]*Math.sin(lens_az[i]);
        xmin = Math.round(origin_x+src_x-lens_r[i]);
        xmax = Math.round(origin_x+src_x+lens_r[i]);
        ymin = Math.round(origin_y-src_y-lens_r[i]);
        ymax = Math.round(origin_y-src_y+lens_r[i]);
        for(var x=xmin; x<=xmax; x++){
            for(var y=ymin; y<=ymax; y++){
                d = Math.sqrt(Math.pow(x - origin_x - src_x, 2) + Math.pow(origin_y - y - src_y, 2));
                if(d<=r[i]){
                    index = (x + y*w)*4;
                    srcimageDataDst.data[index] = imageData_profile(d, lens_r[i], 100, srcimageDataSrc.data[index]);
                    srcimageDataDst.data[index+1] = imageData_profile(d, lens_r[i], 100, srcimageDataSrc.data[index+1]);
                    srcimageDataDst.data[index+2] = imageData_profile(d, lens_r[i], 200, srcimageDataSrc.data[index+2]);
                    srcimageDataDst.data[index+3] = 255;
                    imageDataDst.data[index] = imageData_profile(d, lens_r[i], 100, srcimageDataSrc.data[index]);
                    imageDataDst.data[index+1] = imageData_profile(d, lens_r[i], 100, srcimageDataSrc.data[index+1]);
                    imageDataDst.data[index+2] = imageData_profile(d, lens_r[i], 200, srcimageDataSrc.data[index+2]);
                    imageDataDst.data[index+3] = 255;
                }
            }
        }
    }

    for(var y=0; y<h; y++){
        for(var x=0; x<w; x++){
            theta = Math.sqrt(Math.pow(x - origin_x, 2) + Math.pow(origin_y - y, 2));
            src_x = (x-origin_x) - alpha_x[x][y]; //arbitrary deflection angle from array alpha_x,y
            src_y = (origin_y-y) - alpha_y[x][y]; //SIS profile, point mass: Math.pow(thetaE, 2)
            for(var i=0; i<N_gal; i++){
                d = Math.sqrt(Math.pow(dist[i]*Math.cos(az[i]) - src_x, 2) + Math.pow(dist[i]*Math.sin(az[i]) - src_y, 2));
                if(d <= r[i]){
                    index = (x + y*w)*4;
                    imageDataDst.data[index] = imageData_profile(d, r[i], colour[i][0], imageDataSrc.data[index]);
                    imageDataDst.data[index+1] = imageData_profile(d, r[i], colour[i][1], imageDataSrc.data[index+1]);
                    imageDataDst.data[index+2] = imageData_profile(d, r[i], colour[i][2], imageDataSrc.data[index+2]);
                    imageDataDst.data[index+3] = 255;
                }
            }
        }
    }

    var kappa=0;
    var thr = 0.01;
    for(var x=0; x<w; x++){
        for(var y=0; y<h; y++){
            index = (x + y*w)*4;
            for(var k=0; k<N_lens; k++){
                src_x = lens_dist[i]*Math.cos(lens_az[i]);
                src_y = lens_dist[i]*Math.sin(lens_az[i]);
                theta = Math.sqrt(Math.pow(x - origin_x - src_x, 2) + Math.pow(origin_y - y - src_y, 2));
                kappa += thetaE[k]/(2*theta);
            }
            if(kappa < 1 + thr && kappa > 1 - thr){
                imageDataDst.data[index] = 255;
                console.log(kappa);
            }
            kappa = 0;
        }
    }

    /*for(var x=0; x<w; x++){
        for(var y=0; y<h; y++){
            index = (x + y*w)*4;
            val = convolve_psf(x,y);
            for(var k=0; k<3; k++){
                imageDataDst.data[index+k] = val[k];
            }
        }
    }*/

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

function checkSrcLensOverlap(dist,az,r,lens_dist,lens_az,lens_r){
    for(var j=0; j<lens_dist.length; j++){
        d_x = dist*Math.cos(az) - lens_dist[j]*Math.cos(lens_az[j]);
        d_y = dist*Math.sin(az) - lens_dist[j]*Math.sin(lens_az[j]);
        d = Math.sqrt(Math.pow(d_x, 2) + Math.pow(d_y, 2));
        if(d < 2*(r + lens_r[j])){ //factor 2 accounts for stretching in lens plane
            return true;
        }
    }
    return false;
}

function imageData_profile(d, r, max, offset){
    //return offset + (max - offset) * Math.exp( -Math.pow(d/(r/2.3), 2)/2 ); //Gaussian profile
    return max*Math.exp(-3.6713 * (Math.pow(d/(r/2.8), 1/2) - 1)); //Sersic profile with n=2
}

function convolve_psf(x,y){
    r_conv = 10;
    sigma_sq = Math.pow(5, 2);
    xmin = x-r_conv;
    if(xmin<0){xmin=0;}
    xmax = x+r_conv;
    if(xmax>w){xmax=w;}
    ymin = x-r_conv;
    if(ymin<0){ymin=0;}
    ymax = x+r_conv;
    if(ymax>h){ymax=h;}
    let val = new Array(3);
    val[0]=0;
    val[1]=0;
    val[2]=0;
    for(var i=xmin; i<xmax; i++){
        for(var j=ymin; j<ymax; j++){
            d_sq = Math.pow(x-i, 2) + Math.pow(y-j, 2);
            index = (i + j*w)*4;
            conv_factor = Math.exp(-d_sq/(2*sigma_sq))/Math.sqrt(2*Math.PI*sigma_sq);
            for(var k=0; k<3; k++){
                val[k] += imageDataDst.data[index+k]*conv_factor;
            }
        }
    }
    return val;
}

var img = new Image();

img.src = "test_img.png";
