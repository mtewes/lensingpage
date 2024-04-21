//initialize Strong Lensing canvas
var imageDataLensSL, imageDataSrcSL;

var canvasSL = document.getElementById('strong_lensing');
var lensSL = canvasSL.getContext('2d');

var w = canvasSL.width;
var h = canvasSL.height;
var origin_x=Math.round(w/2); //coordinates of origin
var origin_y=Math.round(h/2);

//initialize deflection angles, 2d-array
let alpha_xSL = new Array(w);
let alpha_ySL = new Array(w);
//let detA = new Array(w);
for(var i=0; i<w; i++){
    alpha_xSL[i] = new Array(h);
    alpha_ySL[i] = new Array(h);
    //detA[i] = new Array(h);
}

//-----------------------------------------------------------------------------//
//initialize Weak Lenisng canvas with single galaxy
var imageDataLens_WLsg, imageDataSrc_WLsg, imageDataAlphax, imageDataAlphay;

var canvas_WLsg = document.getElementById('wl_kappa_map');
var lens_WLsg = canvas_WLsg.getContext('2d');

//initialize deflection angles, 2d-array
let alpha_x_WLsg = new Array(w);
let alpha_y_WLsg = new Array(w);
    for(var i=0; i<w; i++){
        alpha_x_WLsg[i] = new Array(h);
        alpha_y_WLsg[i] = new Array(h);
    }

//initialize images of deflection angle
var img_alphax = new Image();
img_alphax.src = "alphax_flagship_1.png";
var img_alphay = new Image();
img_alphay.src = "alphay_flagship_1.png";
var img_kappa = new Image();
img_kappa.src = "kappa_flagship_1.png";

//-----------------------------------------------------------------------------//
//initialize Weak Lenisng canvas with many galaxies
var imageDataLens_WLmg, imageDataSrc_WLmg, black;

var canvas_WLmg = document.getElementById('grid_lens');
var lens_WLmg = canvas_WLmg.getContext('2d');

//initialize deflection angles, 2d-array
let alpha_x_WLmg = new Array(w);
let alpha_y_WLmg = new Array(w);
    for(var i=0; i<w; i++){
        alpha_x_WLmg[i] = new Array(h);
        alpha_y_WLmg[i] = new Array(h);
    }

//Generate arrays of galaxy position, size, color
let N_gal = document.getElementById('gal_num').max; //read the number of galaxies from html slider
let r_WLmg = new Array(N_gal); //size
let x_WLmg = new Array(N_gal);  //x,y coordinates
let y_WLmg = new Array(N_gal);
let red_WLmg = new Array(N_gal); //colors
let green_WLmg = new Array(N_gal);

//Now assign random values for every galaxy
for(var i=0; i<N_gal; i++){
    r_WLmg[i] = getRanNum(20,30);
    x_WLmg[i] = getRanNum(-0.9*w/2, 0.9*w/2); //galaxies should not be partially outside the canvas
    y_WLmg[i] = getRanNum(-0.9*w/2, 0.9*w/2);
    red_WLmg[i] = getRanNum(200,255);
    green_WLmg[i] = getRanNum(70,130);
    //prevent an overlap of two galaxies;
    //if there is overlap -> generate new x,y until there is no overlap anymore
    if(checkOverlap(i,x_WLmg,y_WLmg,r_WLmg) == true){i--;}
}

//-----------------------------------------------------------------------------//
//initialize Structure canvas with Flagship image
var canvas_Str = document.getElementById('structure_map');
var structure_map = canvas_Str.getContext('2d');
var imageDataStr, imageDataStrhelp;

//initialize images of flagship and small euclid satellite
var img_structure = new Image();
img_structure.src = "Euclid_flagship_mock_galaxy_catalogue_cropped.jpg";
var img_euclid = new Image();
img_euclid.src = "Euclid_telescope_small.png";

//-----------------------------------------------------------------------------//
//Now load all canvases
window.onload = function() {

    //SL canvas
    lensSL.fillStyle = 'black'; //Fill the canvas black
    lensSL.fillRect(0,0,w,h);
    imageDataSrcSL = lensSL.getImageData(0, 0, w, h); //and assign the image data to that canvas
    imageDataLensSL = lensSL.getImageData(0, 0, w, h);

    //define lens galaxy properties
    var or=30*Math.PI/180; //orientation in radian
    var q=0.7; //axis ratio
    var a=100; //major semi-axis
    var thetaE=a*1.2; //The model's Einstein radius
    var thetaC=thetaE*0.1; //and core radius
    drawlensSL(or, q, a, thetaE, thetaC); //draw lens galaxy and calculate deflection angles

    beta_x = -100; //initial source galaxy position
    beta_y = 70;
    drawcanvasSL(beta_x, beta_y, alpha_xSL, alpha_ySL); //draw initial lens system

    var scrollX = 0;
    var scrollY = 0;
    document.addEventListener("wheel", (e) =>{ //offset of mouse coordinates due to scrolling
        scrollX = e.deltaX;
        scrollY = e.deltaY;
    })
    let curX;
    let curY;
    //if mouse is moved inside canvas -> update source galaxy on canvas
    canvasSL.addEventListener("mousemove", (e) => {
        //get mouse coordinates inside canvas
        var bounds = canvasSL.getBoundingClientRect();
        curX = e.clientX - bounds.left - scrollX - (bounds.right - bounds.left)/2;
        curY = -(e.clientY - bounds.top - scrollY - (bounds.bottom - bounds.top)/2);
        //account for canvas stretching/contracting due to variable window size
        curX*=canvasSL.width/bounds.width;
        curY*=canvasSL.width/bounds.width;
        //and draw updated source galaxy
        drawcanvasSL(curX, curY, alpha_xSL, alpha_ySL);
    });
    //for touchpad users prevent side scrolling
    canvasSL.addEventListener("touchmove", (e) => {
        e.preventDefault();
        e.stopPropagation();
        var touch = e.touches[0];
        var mouseEvent = new MouseEvent("mousemove", {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvasSL.dispatchEvent(mouseEvent);
    });

    //-----------------------------------------------------------------------------//
    //WL canvas with single galaxy
    lens_WLsg.drawImage(img_alphax, 0, 0); //load deflection angle image
    imageDataAlphax = lens_WLsg.getImageData(0,0,w,h); //and put the pixels in imageData array
    lens_WLsg.drawImage(img_alphay, 0, 0);
    imageDataAlphay = lens_WLsg.getImageData(0,0,w,h);
    lens_WLsg.fillStyle = 'black'; //then fill canavas black
    lens_WLsg.fillRect(0,0,w,h);
    imageDataSrc_WLsg = lens_WLsg.getImageData(0, 0, w, h);
    imageDataLens_WLsg = lens_WLsg.getImageData(0, 0, w, h);

    //initialize 2d deflection angle array
    let alpha_x_WL = new Array(w);
    let alpha_y_WL = new Array(w);
    for(var i=0; i<w; i++){
        alpha_x_WL[i] = new Array(h);
        alpha_y_WL[i] = new Array(h);
    }
    //calculate deflection angles from imageDataAlpha
    for(var x=0; x<w; x++){
        for(var y=0; y<h; y++){
            index = (x+y*w)*4;
            //the deflection angle images only have red and blue pixels:
            //red are the positive, blue the negative deflection angle values
            alpha_x_WL[x][y] = imageDataAlphax.data[index] - imageDataAlphax.data[index+2]; //deflection angle = red - blue
            alpha_y_WL[x][y] = -imageDataAlphay.data[index] + imageDataAlphay.data[index+2]; //canvas y-coord is inverted
        }
    }
    //normalize deflection angles to a reasonable WL value
    let alpha_max_norm = 25;
    for(var x=0; x<w; x++){
        for(var y=0; y<h; y++){
            alpha_x_WL[x][y] *= alpha_max_norm/255;
            alpha_y_WL[x][y] *= alpha_max_norm/255;
        }
    }

    //draw initial canvas
    drawcanvas_WLsg(0, 0, alpha_x_WL, alpha_y_WL);
    //mousemove same as for SL canvas above
    var curX_WLsg, curY_WLsg;
    canvas_WLsg.addEventListener("mousemove", (e) => {
        var bounds = canvas_WLsg.getBoundingClientRect();
        curX_WLsg = e.clientX - bounds.left - scrollX - (bounds.right - bounds.left)/2;
        curY_WLsg = -(e.clientY - bounds.top - scrollY - (bounds.bottom - bounds.top)/2);
        curX_WLsg*=canvas_WLsg.width/bounds.width;
        curY_WLsg*=canvas_WLsg.width/bounds.width;
        drawcanvas_WLsg(curX_WLsg, curY_WLsg, alpha_x_WL, alpha_y_WL);
    });
    canvas_WLsg.addEventListener("touchmove", (e) => {
        e.preventDefault();
        e.stopPropagation();
        var touch = e.touches[0];
        var mouseEvent = new MouseEvent("mousemove", {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas_WLsg.dispatchEvent(mouseEvent);
    });

    let pressed_WLsg=false; //state of button "toggle_dm_wl"
    //toggle the visibility of dm mass distribution
    document.getElementById("toggle_dm_wl").onclick = function(){
        //if button was not pressed before, draw dm kappa map
        if(pressed_WLsg==false){
            lens_WLsg.drawImage(img_kappa, 0, 0);
            imageDataSrc_WLsg = lens_WLsg.getImageData(0,0,w,h);
            for(var i=0; i<w*h*4; i++){
                imageDataSrc_WLsg.data[i*4]=0; //take out all red
            }
            pressed_WLsg=true;
        } else{ //if button was pressed before, fill canvas black again
            lens_WLsg.fillRect(0,0,w,h);
            imageDataSrc_WLsg = lens_WLsg.getImageData(0,0,w,h);
            pressed_WLsg=false;
        }
        //update canvas
        drawcanvas_WLsg(curX_WLsg, curY_WLsg, alpha_x_WL, alpha_y_WL);
    };

    //-----------------------------------------------------------------------------//
    //WL canvas with many galaxies
    lens_WLmg.fillStyle = 'black'; //fill canvas black
    lens_WLmg.fillRect(0,0,w,h);
    imageDataLens_WLmg = lens_WLmg.getImageData(0, 0, w, h);
    black = lens_WLmg.getImageData(0, 0, w, h);

    //number of drawn galaxies defined by slider gal_num
    let gal_num_range = document.getElementById('gal_num');
    var N_gal_used = gal_num_range.value;
    document.getElementById('gal_num_out').value = N_gal_used; //print number of drawn galaxies
    drawcanvas_WLmg(alpha_x_WL, alpha_y_WL, N_gal_used); //update canvas

    //event listener for slider movement
    gal_num_range.addEventListener('mouseup', function(){
        N_gal_used = gal_num_range.value;
        document.getElementById('gal_num_out').value = N_gal_used;
        drawcanvas_WLmg(alpha_x_WL,alpha_y_WL,N_gal_used); //update canvas
    })
    
    let pressed_WLmg=false;
    //toggle the visibility of dm mass distribution as above in WLsg
    document.getElementById("toggle_dm_gal_grid").onclick = function(){
        if(pressed_WLmg==false){
            lens_WLmg.drawImage(img_kappa, 0, 0);
            black = lens_WLmg.getImageData(0,0,w,h);
            for(var i=0; i<w*h*4; i++){
                black.data[i*4]=0; //take out all red
            }
            pressed_WLmg=true;
        } else{
            lens_WLmg.fillRect(0,0,w,h);
            black = lens_WLmg.getImageData(0,0,w,h);
            pressed_WLmg=false;
        }
        drawcanvas_WLmg(alpha_x_WL, alpha_y_WL, N_gal_used);
    };

    //-----------------------------------------------------------------------------//
    //Structure canvas with Flagship dm distribution
    let h_stripe = 200; //height of whole flagship image stripe on the canvas
    let euclid_offset = 0.4*h_stripe*img_euclid.height/img_euclid.width; //offset off x-coord. due to the small eculid image
    //draw the small euclid image, centered in h_stripe
    structure_map.drawImage(img_euclid, 0, 0, img_euclid.width, img_euclid.height, 0, (h_stripe-euclid_offset*img_euclid.height/img_euclid.width)/2, euclid_offset, euclid_offset*img_euclid.height/img_euclid.width)

    let w_image = Math.round(canvas_Str.width/2); //width of flagship clipping on canvas
    let h_image = canvas_Str.height - (h_stripe+60); //height of flagship clipping on canvas
    let w_clip = h_image*(canvas_Str.width-euclid_offset)/h_stripe; //width of flagship clipping in original flagship image
    let w_clip_stripe = w_clip*(canvas_Str.width-euclid_offset)/img_structure.width; //width of flagship clipping inside flagship stripe
    
    //draw flagship image stripe
    structure_map.drawImage(img_structure, 0, 0, img_structure.width, img_structure.height, euclid_offset, 0, canvas_Str.width-euclid_offset, h_stripe);
    //description above arrow
    structure_map.font = "bold 20px Bahnschrift";
    structure_map.fillStyle = 'rgb(38, 32, 91)';
    structure_map.textAlign = "center";
    structure_map.fillText("Euclid blickt in die Vergangenheit", euclid_offset+(canvas_Str.width-euclid_offset)/2, h_stripe+18);
    //draw arrow for timeline
    drawArrow(structure_map, euclid_offset, h_stripe+28, canvas_Str.width-8, h_stripe+28, 8, 'rgb(38, 32, 91)');
    //timeline description
    structure_map.textAlign = "left";
    structure_map.fillText("Heutiges Universum", euclid_offset, h_stripe+50);
    structure_map.textAlign = "right";
    structure_map.fillText("Universum vor 11 Milliarden Jahren", canvas_Str.width, h_stripe+50);
    
    imageDataStr = structure_map.getImageData(0,0,canvas_Str.width,canvas_Str.height);
    imageDataStrhelp = structure_map.getImageData(0,0,canvas_Str.width,canvas_Str.height);
    //make flagship stripe transparent
    for(var i=0; i<h_stripe; i++){
        for(var j=Math.round(euclid_offset); j<canvas_Str.width; j++){
            index = (j + i*canvas_Str.width)*4
            imageDataStr.data[index+3]=80;
            imageDataStrhelp.data[index+3]=80;
        }
    }
    structure_map.putImageData(imageDataStr, 0, 0);

    //initial cursor position at z=0
    var curXs = (w_clip_stripe/2 + euclid_offset)
    var curYs = 0;
    var curXsold = curXs;
    //draw initial cursor and initial clipped image on canvas
    drawcursor(curXs, h_stripe, curXsold, w_clip_stripe);
    structure_map.drawImage(img_structure, (curXs-euclid_offset)/(canvas_Str.width-euclid_offset)*img_structure.width - w_clip/2, 0, w_clip, img_structure.height, (canvas_Str.width-w_image)/2, h_stripe+60, w_image, h_image);
    
    //update canvas on mousemove inside flagship image
    canvas_Str.addEventListener("mousemove", (e) => {
        var bounds = canvas_Str.getBoundingClientRect();
        curXs = e.clientX - bounds.left - scrollX;
        curYs = -(e.clientY - bounds.top - scrollY);
        curXs*=canvas_Str.width/bounds.width;
        curYs*=canvas_Str.width/bounds.width;
        //check if cursor is inside flagship image on the canvas
        if(curXs <= canvas_Str.width - w_clip_stripe/2 && curXs >= w_clip_stripe/2 + euclid_offset && curYs <= 0 && curYs >= -h_stripe){
            //draw new cursor and delete old one
            drawcursor(curXs, h_stripe, curXsold, w_clip_stripe);
            //save old cursor coordinate
            curXsold = curXs;
            //draw new clipped image
            structure_map.drawImage(img_structure, (curXs-euclid_offset)/(canvas_Str.width-euclid_offset)*img_structure.width - w_clip/2, 0, w_clip, img_structure.height, (canvas_Str.width-w_image)/2, h_stripe+60, w_image, h_image);
        }
    });
    canvas_Str.addEventListener("touchmove", (e) => {
        e.preventDefault();
        e.stopPropagation();
        var touch = e.touches[0];
        var mouseEvent = new MouseEvent("mousemove", {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas_Str.dispatchEvent(mouseEvent);
    });
};

//SL canvas: draw lens galaxy and calculate deflection angles
function drawlensSL(or, q, a, thetaE, thetaC){
    var rho;
    eps = (1-q)/(1+q); //ellipticity
    //iterate over canvas pixels
    for(var x=0; x<w; x+=0.5){
        for(var y=0; y<h; y+=0.5){
            //calculate coordinates in the rotated frame of the lens galaxy
            x_rot = (x-origin_x)*Math.cos(or) + (origin_y-y)*Math.sin(or);
            y_rot = -(x-origin_x)*Math.sin(or) + (origin_y-y)*Math.cos(or);
            //calculate rho which is constant on an ellipse of axis ratio q
            rho = Math.sqrt(Math.pow(x_rot,2)*q + Math.pow(y_rot,2)/q);
            //calculate index of pixel (x,y) for imageData arrays
            index = (Math.round(x) + Math.round(y)*w)*4;
            //fill imageData with lens galaxy of certain brightness profile,
            //rho defines the brightness in the current pixel
            imageDataSrcSL.data[index] = imageData_profile(rho, a/2.8, 255);
            imageDataSrcSL.data[index+1] = imageData_profile(rho, a/2.8, 200);
            imageDataSrcSL.data[index+2] = imageData_profile(rho, a/2.8, 100);
            imageDataSrcSL.data[index+3] = 255;

            if(x<=w-0.9 && y<=h-0.9){
                //calculate deflection angles in the non-singular isothermal sphere model
                var Y = Math.sqrt(Math.pow(rho,2)+Math.pow(thetaC,2));
                a_x = (1-Math.pow(eps,2))*thetaE/(2*Math.sqrt(eps))*Math.atan(2*Math.sqrt(eps)*x_rot/((1-Math.pow(eps,2))*Y + Math.pow(1-eps,2)*thetaC));
                a_y = (1-Math.pow(eps,2))*thetaE/(2*Math.sqrt(eps))*Math.atanh(2*Math.sqrt(eps)*y_rot/((1-Math.pow(eps,2))*Y + Math.pow(1-eps,2)*thetaC));
                alpha_xSL[Math.round(x)][Math.round(y)] = a_x*Math.cos(or) - a_y*Math.sin(or);
                alpha_ySL[Math.round(x)][Math.round(y)] = a_x*Math.sin(or) + a_y*Math.cos(or);
                //make sure the deflection drops to almost 0 towards canvas border
                //else the deflection angle would be constant which is not desired here
                alpha_xSL[Math.round(x)][Math.round(y)] *= Math.exp(-Math.pow(rho,2)/(2*Math.pow(0.28*canvasSL.width,2)));
                alpha_ySL[Math.round(x)][Math.round(y)] *= Math.exp(-Math.pow(rho,2)/(2*Math.pow(0.28*canvasSL.width,2)));
                /*detA[Math.round(x)][Math.round(y)] = 1 - thetaE/Y + (1-Math.pow(eps,2))*thetaC*Math.pow(thetaE,2) / (Y*(2*(1+Math.pow(eps,2))*Math.pow(thetaC,2) + Math.pow(x_rot,2) + Math.pow(y_rot,2) + 2*(1-Math.pow(eps,2))*Y*thetaC));
                if(Math.abs(detA[Math.round(x)][Math.round(y)])<0.01){ //draw critical curve
                    imageDataSrc1.data[index+1] = 255;
                }*/
            }
        }
    }
    //load imageData into canvas
    lensSL.putImageData(imageDataSrcSL, 0, 0);
}

//SL canvas: draw source galaxy dependent on the mouse position in the canvas
function drawcanvasSL(beta_x, beta_y, alpha_xSL, alpha_ySL) {
    //update imageData
    for(var i=0; i<h*w*4; i++){
        imageDataLensSL.data[i] = imageDataSrcSL.data[i];
    }
    r = 25; //size of source galaxy
    var theta;
    //iterate over canvas pixels in the lens plane
    for(var y=0; y<h; y++){
        for(var x=0; x<w; x++){
            //get the cooresponding source plane coordinates of the current pixel from the lens equation
            src_x = (x-origin_x) - alpha_xSL[x][y];
            src_y = (origin_y-y) - alpha_ySL[x][y];
            //calculate distance to center of source galaxy (beta)
            d = Math.sqrt(Math.pow(beta_x - src_x, 2) + Math.pow(beta_y - src_y, 2));
            //if that distance is inside the galaxy radius, fill the pixel
            if(d <= r){
                index = (x + y*w)*4; //index of pixel in imageData
                imageDataLensSL.data[index] += imageData_profile(d, r/2.8, 255); //fill galaxy pixel
                imageDataLensSL.data[index+1] += imageData_profile(d, r/2.8, 100);
                imageDataLensSL.data[index+2] += imageData_profile(d, r/2.8, 100);
                imageDataLensSL.data[index+3] = 255;
            }
        }
    }
    //load imageData into canvas
    lensSL.putImageData(imageDataLensSL, 0, 0);
}

//WL single galaxy canvas, same as for SL canvas above
function drawcanvas_WLsg(beta_x, beta_y, alpha_x_WL, alpha_y_WL) {
    for(var i=0; i<h*w*4; i++){
        imageDataLens_WLsg.data[i] = imageDataSrc_WLsg.data[i];
    }
    r = 25;
    for(var y=0; y<h; y++){
        for(var x=0; x<w; x++){
            src_x = (x-origin_x) - alpha_x_WL[x][y];
            src_y = (origin_y-y) - alpha_y_WL[x][y];
            d = Math.sqrt(Math.pow(beta_x - src_x, 2) + Math.pow(beta_y - src_y, 2));
            if(d <= r){
                index = (x + y*w)*4;
                imageDataLens_WLsg.data[index] += imageData_profile(d, r/2.8, 255);
                imageDataLens_WLsg.data[index+1] += imageData_profile(d, r/2.8, 100);
                imageDataLens_WLsg.data[index+2] += imageData_profile(d, r/2.8, 100);
                imageDataLens_WLsg.data[index+3] = 255;
            }
        }
    }

    lens_WLsg.putImageData(imageDataLens_WLsg, 0, 0);
}

//WL many galaxy canvas, same as for SL canvas above
function drawcanvas_WLmg(alpha_x_WL, alpha_y_WL, N_gal_used) {
    for(var i=0; i<h*w*4; i++){
        imageDataLens_WLmg.data[i] = black.data[i];
    }
    r=25;
    for(var y=0; y<h; y++){
        for(var x=0; x<w; x++){
            src_x = (x-origin_x) - alpha_x_WL[x][y]; //arbitrary deflection angle from array alpha_x,y
            src_y = (origin_y-y) - alpha_y_WL[x][y];
            for(var i=0; i<N_gal_used; i++){
                d = Math.sqrt(Math.pow(x_WLmg[i]-src_x, 2) + Math.pow(y_WLmg[i]-src_y, 2));
                if(d<=r_WLmg[i]){
                    index = (x + y*w)*4;
                    imageDataLens_WLmg.data[index] += imageData_profile(d, r_WLmg[i]/2.8, red_WLmg[i]);
                    imageDataLens_WLmg.data[index+1] += imageData_profile(d, r_WLmg[i]/2.8, green_WLmg[i]);
                    imageDataLens_WLmg.data[index+2] += imageData_profile(d, r_WLmg[i]/2.8, 100);
                    imageDataLens_WLmg.data[index+3] = 255;
                }
            }
        }
    }

    lens_WLmg.putImageData(imageDataLens_WLmg, 0, 0);
}

//Structure map cursor
function drawcursor(curXs, h_stripe, curXsold, w_clip_stripe){
    //iterate over length and width of cursor
    var index, indexold;
    for(var i=0; i<h_stripe; i++){
        for(var k=-w_clip_stripe/2; k<=w_clip_stripe/2; k++){
            indexold = Math.round((curXsold+k + i*canvas_Str.width))*4;
            //make transparent
            imageDataStr.data[indexold+3]=80;
            //fill old cursor position with flagship image again
            for(var j=0; j<4; j++){
                imageDataStr.data[indexold+j] = imageDataStrhelp.data[indexold+j];
            }
        }
        for(var k=-w_clip_stripe/2; k<=w_clip_stripe/2; k++){
            index = Math.round((curXs+k + i*canvas_Str.width))*4;
            //make area around cursor non-transparent (corresponds to flagship clipping)
            imageDataStr.data[index+3]=255;
            //fill new cursor position
            if(k>=-2 && k<=2){
                for(var j=0; j<4; j++){
                    imageDataStr.data[index+j] = 255;
                }
            }
        }
    }
    //load imageData into canvas
    structure_map.putImageData(imageDataStr, 0, 0);
}

function drawArrow(ctx, fromx, fromy, tox, toy, arrowWidth, color){
    //taken from https://codepen.io/chanthy/pen/WxQoVG
    //variables to be used when creating the arrow
    var headlen = 10;
    var angle = Math.atan2(toy-fromy,tox-fromx);
 
    ctx.save();
    ctx.strokeStyle = color;
 
    //starting path of the arrow from the start square to the end square
    //and drawing the stroke
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.lineWidth = arrowWidth;
    ctx.stroke();
 
    //starting a new path from the head of the arrow to one of the sides of the point
    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox-headlen*Math.cos(angle-Math.PI/7), toy-headlen*Math.sin(angle-Math.PI/7));
 
    //path from the side point of the arrow, to the other side point
    ctx.lineTo(tox-headlen*Math.cos(angle+Math.PI/7), toy-headlen*Math.sin(angle+Math.PI/7));
 
    //path from the side point back to the tip of the arrow, and then
    //again to the opposite side point
    ctx.lineTo(tox, toy);
    ctx.lineTo(tox-headlen*Math.cos(angle-Math.PI/7), toy-headlen*Math.sin(angle-Math.PI/7));
 
    //draws the paths created above
    ctx.stroke();
    ctx.restore();
}

//Give brightness of galaxy pixel according to its distance d from the galaxy center,
//the galaxy scale radius r_scale and the color value max
function imageData_profile(d, r_scale, max){
    return max*Math.exp(-3.6713 * (Math.pow(d/r_scale, 1/2) - 1)); //Sersic profile with n=2
}

//random number generator in a given interval with uniform probability distribution
function getRanNum(min, max) {
    return Math.random() * (max - min) + min;
}

//Check overlap of two random generated galaxies in the WL canvas
function checkOverlap(index,x,y,r){
    //iterate over all previously generated galaxies
    for(var j=0; j<index; j++){
        d_x = x[index] - x[j];
        d_y = y[index] - y[j];
        //calculate distance between galaxy centers
        d = Math.sqrt(Math.pow(d_x, 2) + Math.pow(d_y, 2));
        //if that distance is smaller than sum of both galaxy radii -> overlap,
        //the factor 1.5 tries to account for stretching of the galaxies due to lensing
        if(d < 1.5*(r[index] + r[j])){
            return true;
        }
    }
    return false;
}