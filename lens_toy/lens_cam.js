var imageDataLens, imageDataSrc, imageDataAlphax, imageDataAlphay, black;

var img_alphax = new Image();
img_alphax.src = "alphax_gaussian_random_field_1.png";
var img_alphay = new Image();
img_alphay.src = "alphay_gaussian_random_field_1.png";
var img_kappa = new Image();
img_kappa.src = "kappa_gaussian_random_field_1.png";

var constraints = {video: {mandatory: {minWidth: 1280, minHeight: 720}}};
var video = document.getElementById('vid');

if (navigator.mediaDevices.getUserMedia) {
    var successCallback = function(stream) {
      video.srcObject = stream;
    };
    var errorCallback = function(error) {
      console.log(error);
    };
    navigator.mediaDevices.getUserMedia(constraints).then(successCallback, errorCallback);
  }

var canvas = document.getElementById('lens');
var context = canvas.getContext('2d');

var w = canvas.width;
var h = canvas.height;
var origin_x=Math.round(w/2);
var origin_y=Math.round(h/2);

let alpha_x = new Array(w);
let alpha_y = new Array(w);
for(var i=0; i<w; i++){
    alpha_x[i] = new Array(h);
    alpha_y[i] = new Array(h);
}

window.onload = function() {
    context.drawImage(img_alphax, 0, 0);
    imageDataAlphax = context.getImageData(0,0,w,h);
    context.drawImage(img_alphay, 0, 0);
    imageDataAlphay = context.getImageData(0,0,w,h);
    
    for(var x=0; x<w; x++){
        for(var y=0; y<h; y++){
            index = (x+y*w)*4;
            alpha_x[x][y] = imageDataAlphax.data[index] - imageDataAlphax.data[index+2]; //red are the positive, blue the negative angles
            alpha_y[x][y] = -imageDataAlphay.data[index] + imageDataAlphay.data[index+2]; //canvas y-coord is inverted
        }
    }
    var alpha_max_norm = 25;
    for(var x=0; x<w; x++){
        for(var y=0; y<h; y++){
            alpha_x[x][y] *= alpha_max_norm/255;
            alpha_y[x][y] *= alpha_max_norm/255;
        }
    }
    renderFrame();
};

function renderFrame() {
  // re-register callback
  requestAnimationFrame(renderFrame);
  // set internal canvas size to match HTML element size
  canvas.width = canvas.scrollWidth;
  canvas.height = canvas.scrollHeight;
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    // scale and horizontally center the camera image
    /*var videoSize = { width: video.videoWidth, height: video.videoHeight };
    var canvasSize = { width: canvas.width, height: canvas.height };
    var renderSize = calculateSize(videoSize, canvasSize);
    var xOffset = (canvasSize.width - renderSize.width) / 2;
    var yOffset = (canvasSize.height - renderSize.height) / 2;
    context.drawImage(video, xOffset, yOffset, renderSize.width, renderSize.height);*/
    if(video.videoWidth>video.videoHeight){
        var xOffset = (video.width - canvas.width)/2;
        var yOffset = 0;
    } else{
        var yOffset = (video.height - canvas.height)/2;
        var xOffset = 0;
    }
    context.drawImage(video, -xOffset, -yOffset, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
    imageDataLens = context.getImageData(0,0,w,h);
    imageDataSrc = context.getImageData(0,0,w,h);
    drawcanvas(alpha_x,alpha_y);
  }
}

function drawcanvas(alpha_x, alpha_y) {
    for(var y=0; y<h; y++){
        for(var x=0; x<w; x++){
            src_x = (x-origin_x) - alpha_x[x][y]; //arbitrary deflection angle from array alpha_x,y
            src_y = (origin_y-y) - alpha_y[x][y];
            src_x = origin_x + src_x;
            src_y = origin_y - src_y;
            index_lens = (x + y*w)*4;
            index_src = (Math.round(src_x) + Math.round(src_y)*w)*4;
            for(var k=0; k<4; k++){
                imageDataLens.data[index_lens+k] = imageDataSrc.data[index_src+k];
            }
        }
    }
    context.putImageData(imageDataLens, 0, 0);
}

/*function calculateSize(srcSize, dstSize) {
    var srcRatio = srcSize.width / srcSize.height;
    var dstRatio = dstSize.width / dstSize.height;
    if (dstRatio > srcRatio) {
      return {
        width:  dstSize.height * srcRatio,
        height: dstSize.height
      };
    } else {
      return {
        width:  dstSize.width,
        height: dstSize.width / srcRatio
      };
    }
}*/
