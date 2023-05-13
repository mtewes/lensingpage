var oldx = 0;
var oldy = 0;

var imageDataDst, imageDataSrc;

w = 701;
h = 701;

/*arr = new Array();
const logFileText = async file => {
    const response = await fetch(file);
    const text = await response.text();
    var line = text.split(' ');
    //document.write(line[120]);
    //for (let i=0; i<5; i++){
    //    arr.push(line[i])
    //}
    //document.write('\n--------------------\n');
    //document.write(line[10].length);
    //document.write(text);
}
arr=logFileText('test_alphax_map.txt')
document.write(arr)*/

//var arr;
/*async function loadText(url) {
    text = await fetch(url);
    readText(await text.text());
}
function readText(text){
    var line = text.split(' ');
    arr=line[0];
    //document.write(line);
}
loadText('test_alphax_map.txt');
document.write(arr);
*/
var lerp = function(a, b, t) {
    return (b - a) * (1-Math.exp(-t)) + a;
}

window.onload = function() {
    w = img.width;
    h = img.height;
    lens_x=Math.round(w/2)
    lens_y=Math.round(h/2)

    canvas = document.querySelector("canvas");
    canvas.width = w;
    canvas.height = h;

    dst = canvas.getContext("2d");

    dst.drawImage(img, 0, 0, w, h);
    i = 0;
    imageDataSrc = dst.getImageData(0, 0, w, h);
    imageDataDst = dst.getImageData(0, 0, w, h);

    //document.write(imageDataDst.data.length/(4*w))

    /*var alpha = new Array(h);

    for (var i=0; i<alpha.length; i++) {
        var alpha[i] = new Array(w);
    }
    for(var i=0; i<h; i++){
        for(var j=0; j<w; j++){
            d = Math.sqrt(Math.pow(lens_x-j, 2) + Math.pow(lens_y-i, 2))
            if(d!=0){
            alpha[i][j] = 1/d
            } else{
                alpha[i][j] = 2*alpha[i][j-1]
            }
        }
    }*/
    //console.log(alpha);
    //document.write(alpha[lens_x-5][lens_y-5])

    px = 0;
    py = 0;

    ti = 0;
    var timer = setInterval(function() {
        if (ti++ > 100)
            clearInterval(timer);

        //updatecanvas(canvas, lerp(0,900 , ti / 20), py);


    }, 16);

    canvas.addEventListener('mousemove', function(evt) {
        var mousePos = getMousePos(canvas, evt);
        updatecanvas(canvas, mousePos.x, mousePos.y);
    }, false);

};



var smootherstep = function(t) {
    //return 1/(Math.exp(-5*t+Math.E)) - Math.exp(-Math.E);
    return 1 / (Math.exp(-6 * t + 3)) - Math.exp(-3);
};


function getMousePos(canvas, evt) {
    /*var rect = canvas.getBoundingClientRect();
    return {
        //x: evt.clientX - rect.left,
        //y: evt.clientY - rect.top
        x: evt.clientX,
        y: evt.clientY
    };*/
    var rect = canvas.getBoundingClientRect(), // abs. size of element
    scaleX = canvas.width / rect.width,    // relationship bitmap vs. element for x
    scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for y
    return {
        x: (evt.clientX - rect.left) * scaleX,   // scale mouse coordinates after they have
        y: (evt.clientY - rect.top) * scaleY     // been adjusted to be relative to element
    }
}

function updatecanvas(canvas, px, py) {
    var context = canvas.getContext('2d');
    r=5;
    thetaE = 30;
    x_offset=380;
    xmin = oldx - r;
    xmax = oldx + r;
    if (xmin < 0) {
        xmin = 0;}
    if (xmax > w) {
        xmax = w;}
    ymin = oldy - r;
    ymax = oldy + r;
    if (ymin < 0) {
        ymin = 0;}
    if (ymax > h) {
        ymax = h;}
    for(var y=ymin; y<ymax; y++){
        for(var x=xmin; x<xmax; x++){
            d = Math.sqrt(Math.pow(oldx-x, 2) + Math.pow(oldy-y, 2));
            if(d<=r){
                beta_x = x-lens_x;
                beta_y = lens_y-y;
                beta = Math.sqrt(Math.pow(beta_x, 2) + Math.pow(beta_y, 2));
                theta = 0.5*(beta + Math.sqrt(Math.pow(beta, 2) + 4*Math.pow(thetaE, 2)));
                theta_x = theta*beta_x/beta; //using symmetry of point lens
                theta_y = theta*beta_y/beta;
                //theta_x = beta_x/2*(1+Math.sqrt(1+4*Math.pow(thetaE, 2)/(Math.pow(beta_x, 2) + Math.pow(beta_y, 2))));
                //theta_y = beta_y/2*(1+Math.sqrt(1+4*Math.pow(thetaE, 2)/(Math.pow(beta_x, 2) + Math.pow(beta_y, 2))));
                x_ind = lens_x + theta_x;
                y_ind = lens_y - theta_y;
                index_lens = Math.round((x_offset+x_ind + y_ind*w)*4); //(x + y * w) * 2**2
                index_src = Math.round((x_offset + x + y*w)*4);
                for(var k=0; k<4; k++){
                    imageDataDst.data[index_src+k] = imageDataSrc.data[index_src+k];
                    imageDataDst.data[index_lens+k] = imageDataSrc.data[index_lens+k];
                }
            }
        }
    }

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
    
    for(var y=ymin; y<ymax; y++){
        for(var x=xmin; x<xmax; x++){
            d = Math.sqrt(Math.pow(px-x, 2) + Math.pow(py-y, 2));
            if(d<=r){
                beta_x = x-lens_x;
                beta_y = lens_y-y;
                beta = Math.sqrt(Math.pow(beta_x, 2) + Math.pow(beta_y, 2));
                theta = 0.5*(beta + Math.sqrt(Math.pow(beta, 2) + 4*Math.pow(thetaE, 2)));
                theta_x = theta*beta_x/beta; //using symmetry of point lens
                theta_y = theta*beta_y/beta;
                //theta_x = beta_x/2*(1+Math.sqrt(1+4*Math.pow(thetaE, 2)/beta));
                //theta_y = beta_y/2*(1+Math.sqrt(1+4*Math.pow(thetaE, 2)/beta));
                x_ind = lens_x + theta_x;
                y_ind = lens_y - theta_y;
                index_lens = Math.round((x_offset+x_ind + y_ind*w)*4); //(x + y * w) * 2**2
                index_src = Math.round((x_offset+x + y*w)*4);
                console.log(x,y,index_src);
                for(var k=0; k<4; k++){
                    imageDataDst.data[index_src+k] = 255;
                    imageDataDst.data[index_lens+k] = 255;
                }
                //console.log(theta_x, theta_y, x_ind, y_ind);
                //if(d==0){console.log(x,y,beta_x, beta_y, theta_x, theta_y, x_ind, y_ind, index_src, index_lens);}
            }
        }
    }
    //imageDataDst.data[(px+(5+py)*w)<<2]=255;
    //imageDataDst.data[(700+1*w)*4]=255;
    //data_size=w*h*4;
    /*for(var y=0; y<1; y++){
        for(var x=0; x<1; x++){
            index=(x+y*w)*4;
            imageDataDst.data[index]=255;
        }
    }
    for(var y=0; y<1; y++){
        for(var x=0; x<10; x++){
            index=(x+y*w)*4;
            for(var k=0; k<4; k++){
                imageDataDst.data[index+k]=255;
            }
        }
    }*/


    /*r=100;
    xmin = oldx - r;
    xmax = oldx + r;
    ymin = oldy - r;
    ymax = oldy + r;
    if (xmin < 0) {
        xmin = 0;}
    if (xmax > w) {
        xmax = w;}
    if (ymin < 0) {
        ymin = 0;}
    if (ymax > h) {
        ymax = h;}
    for(var y=0; y<h; y++){
        for(var x=0; x<w; x++){
            alpha = 1/Math.sqrt(Math.pow(lens_x-x, 2) + Math.pow(lens_y-y, 2));
            beta_x = x - alpha;
            beta_y = y - alpha;
            d = Math.sqrt(Math.pow(oldx-beta_x, 2) + Math.pow(oldy-beta_y, 2));
            if(d<=r){
                index_lens = (x + y*w) << 2; //(x + y * w) * 2**2
                index_src = (beta_x + beta_y*w) << 2;
                for(var k=0; k<4; k++){
                    //imageDataDst.data[index_lens+k] = imageDataSrc.data[index_lens+k];
                    imageDataDst.data[index_src+k] = imageDataSrc.data[index_src+k];
                    //console.log(x);
                }
            }
        }
    }
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
    for(var y=0; y<h; y++){
        for(var x=0; x<w; x++){
            alpha = 1/Math.sqrt(Math.pow(lens_x-x, 2) + Math.pow(lens_y-y, 2));
            beta_x = x - alpha;
            beta_y = y - alpha;
            d = Math.sqrt(Math.pow(px-beta_x, 2) + Math.pow(py-beta_y, 2));
            if(d<=r){
                index_lens = (x + y*w) << 2; //(x + y * w) * 2**2
                index_src = (beta_x + beta_y*w) << 2;
                for(var k=0; k<4; k++){
                    //imageDataDst.data[index_lens+k] = 255;
                    imageDataDst.data[index_src+k] = 255;
                    //console.log(x);
                }
            }
        }
    }*/

    oldx=px;
    oldy=py;

    dst.putImageData(imageDataDst, 0, 0);
}


var img = new Image();
//img.crossOrigin="anonymous";

img.src = "test_img.png";

