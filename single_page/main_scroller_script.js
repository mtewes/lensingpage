// detect language

let browser_language = navigator.language;
let selected_language = "en"; // default is english
console.log("browser_language: ", browser_language)
// and now we check what the browser_language contains:
if(browser_language.indexOf("de") >= 0) {
    selected_language = "de";
 }
 console.log("selected_language: ", selected_language)



 // language modes:
const en_matches = document.querySelectorAll("span[lang='en']");
const de_matches = document.querySelectorAll("span[lang='de']");

const titlestrings_container = document.querySelector("#titlestrings");
const struct_text_1_container = document.querySelector("#struct_text_1");
const struct_text_2_container = document.querySelector("#struct_text_2");
const struct_text_3_container = document.querySelector("#struct_text_3");

var struct_text_1;
var struct_text_2;
var struct_text_3;



function updateTitle(lang) {
    // We get the hidden title from the html, and write this to the page header title
    // can't be done directly as we don't want all languages in that title
    
    var title_match;

    if (lang === "en") {
        title_match = titlestrings_container.querySelectorAll("span[lang='en']")[0];
    }
    if (lang === "de") {
        title_match = titlestrings_container.querySelectorAll("span[lang='de']")[0];
    }
    
    title_match = title_match.innerText;
    console.log("title_match: ", title_match);
    document.title = title_match;

}

function changeLanguage(lang) {
    // this can be called immediately after the html is read,
    // no need for the canvas stuff
    // to be cleaned up -- this is just a demonstrator for now

    console.log("changeLanguage: ", lang);

    if (lang === "de") {
        de_matches.forEach((item) => {
            item.style.display ="inline";
          });
        en_matches.forEach((item) => {
            item.style.display ="none";
          });
    }
    if (lang === "en") {
        en_matches.forEach((item) => {
            //item.style.visibility = "hidden";
            item.style.display ="inline";
            //console.log(item);
          });
        de_matches.forEach((item) => {
            item.style.display ="none";
          });
    }
    
    updateTitle(lang);
    
    try { // this might fail if the canvases are not yet initialised
        drawArrowFull(lang);
    } 
    catch(err){
        // nothing
    }

}

changeLanguage(selected_language);


//initialize Strong Lensing canvas
var imageDataLensSL, imageDataSrcSL;

var canvasSL = document.getElementById('strong_lensing');
var lensSL = canvasSL.getContext('2d', { willReadFrequently: true });

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
//initialize Weak Lensing canvas with single galaxy
var imageDataLens_WLsg, imageDataSrc_WLsg, imageDataAlphax, imageDataAlphay;

var canvas_WLsg = document.getElementById('wl_kappa_map');
var lens_WLsg = canvas_WLsg.getContext('2d', { willReadFrequently: true });

//initialize images of deflection angle
var img_alphax = new Image();
img_alphax.src = "images/alphax_flagship_1.png";
var img_alphay = new Image();
img_alphay.src = "images/alphay_flagship_1.png";
var img_kappa = new Image();
img_kappa.src = "images/kappa_flagship_1.png";

//-----------------------------------------------------------------------------//
//initialize Weak Lensing canvas with many galaxies
//var imageDataLens_WLmg, imageDataSrc_WLmg, black;

var canvas_WLmg = document.getElementById('grid_lens');
var lens_WLmg = canvas_WLmg.getContext('2d', { willReadFrequently: true });

//Generate arrays of galaxy position, size, color
let N_gal = Number(document.getElementById('gal_num').max); //read the number of galaxies from html slider
let r_WLmg = new Array(N_gal); //size
let x_WLmg = new Array(N_gal);  //x,y coordinates
let y_WLmg = new Array(N_gal);
let red_WLmg = new Array(N_gal); //colors
let green_WLmg = new Array(N_gal);

//-----------------------------------------------------------------------------//
//initialize Structure canvas with Flagship image
var canvas_Str = document.getElementById('structure_map');
var structure_map = canvas_Str.getContext('2d', { willReadFrequently: true });
var imageDataStr, imageDataStrhelp;

//initialize images of flagship and small euclid satellite
var img_structure = new Image();
//img_structure.src = "images/Euclid_flagship_mock_galaxy_catalogue_cropped_small.jpg";
img_structure.src = "images/Euclid_flagship_mock_galaxy_catalogue_cropped_testblue_small.jpg";
var img_euclid = new Image();
img_euclid.src = "images/Euclid_spacecraft.jpg";

var lookbacktime = 0;

const h_stripe = 86; //height of whole flagship image stripe on the canvas
const h_space = 100; // space between stripe and image on the canvas
const euclid_offset = 1.0*h_stripe //*img_euclid.height/img_euclid.width; //offset off x-coord. due to the small eculid image
 

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
    //document.addEventListener("wheel", (e) =>{ //offset of mouse coordinates due to scrolling
    //    scrollX = e.deltaX;
    //    scrollY = e.deltaY;
    //})
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
    let alpha_max_norm = 50;
    //let alpha_max_norm = 0;
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
            clientY: touch.clientY-70 // some shift to get the galaxy above the finger... 
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

    //number of drawn galaxies defined by slider gal_num
    let gal_num_range = document.getElementById('gal_num');
    var N_gal_used = Number(gal_num_range.value);
    document.getElementById('gal_num_out').value = N_gal_used; //print number of drawn galaxies

    //Now assign random values for every galaxy
    //T Distribute galaxies via rejection sampling according to kappa map
    sample_galaxies();
    for(var i=0; i<N_gal; i++){
        //r_WLmg[i] = getRanNum(4,20);
        //x_WLmg[i] = getRanNum(-0.9*w/2, 0.9*w/2); //galaxies should not be partially outside the canvas
        //y_WLmg[i] = getRanNum(-0.9*w/2, 0.9*w/2);
        red_WLmg[i] = getRanNum(200,255);
        green_WLmg[i] = getRanNum(70,130);
        //prevent an overlap of two galaxies;
        //if there is overlap -> generate new x,y until there is no overlap anymore
        //if(checkOverlap(i,x_WLmg,y_WLmg,r_WLmg) == true){i--;}
    }

    //Create many images initially and store them, so we just need to load them when updating N_gal_used
    const slider_step = Number(gal_num_range.step);
    const N_imgs = Math.round(N_gal/slider_step);
    const imageDataArray = drawcanvas_WLmg(alpha_x_WL, alpha_y_WL, N_imgs, slider_step);
    const imageDataArray_dm = drawcanvas_WLmg(alpha_x_WL, alpha_y_WL, N_imgs, slider_step, dm=true);
    lens_WLmg.putImageData(imageDataArray[0], 0, 0);

    let pressed_WLmg=false;
    //event listener for slider movement
    gal_num_range.addEventListener('input', function(){
        N_gal_used = Number(gal_num_range.value);
        document.getElementById('gal_num_out').value = N_gal_used;
        let index = Math.round(N_gal_used/slider_step)-1;
        if(pressed_WLmg==false){
            lens_WLmg.putImageData(imageDataArray[index], 0, 0);
        } else{
            lens_WLmg.putImageData(imageDataArray_dm[index], 0, 0);
        }
    });

    //gal_num_range.addEventListener("touchmove", (e) => {
    //    e.preventDefault();
    //    e.stopPropagation();
    //    var touch = e.touches[0];
    //    var mouseEvent = new MouseEvent("change", {
    //        clientX: touch.clientX,
    //        clientY: touch.clientY
    //    });
    //    canvas_WLsg.dispatchEvent(mouseEvent);
    //});
    
    //toggle the visibility of dm mass distribution as above in WLsg
    document.getElementById("toggle_dm_gal_grid").onclick = function(){
        if(pressed_WLmg==false){
            N_gal_used = Number(gal_num_range.value);
            let index = Math.round(N_gal_used/slider_step)-1;
            lens_WLmg.putImageData(imageDataArray_dm[index], 0, 0);
            pressed_WLmg=true;
        } else{
            N_gal_used = Number(gal_num_range.value);
            let index = Math.round(N_gal_used/slider_step)-1;
            lens_WLmg.putImageData(imageDataArray[index], 0, 0);
            pressed_WLmg=false;
        }
    };

    //-----------------------------------------------------------------------------//
    //Structure canvas with Flagship dm distribution
    
    // THIS IS NOW DEFINED ON TOP
    //let h_stripe = 86; //height of whole flagship image stripe on the canvas
    //let h_space = 100; // space between stripe and image on the canvas
    //let euclid_offset = 1.0*h_stripe*img_euclid.height/img_euclid.width; //offset off x-coord. due to the small eculid image
    //let euclid_offset = 1.0*h_stripe
    
    
    //draw the small euclid image, centered in h_stripe
    structure_map.drawImage(img_euclid, 0, 0, img_euclid.width, img_euclid.height, 0, (h_stripe-euclid_offset*img_euclid.height/img_euclid.width)/2, euclid_offset, euclid_offset*img_euclid.height/img_euclid.width)

    let w_image = Math.round(canvas_Str.width/1); //width of flagship clipping on canvas
    let h_image = canvas_Str.height - (h_stripe+h_space); //height of flagship clipping on canvas
    let w_clip = h_stripe*(img_structure.width)/h_image; //width of flagship clipping in original flagship image (no, on canvas )
    let w_clip_stripe = w_clip*(canvas_Str.width-euclid_offset)/img_structure.width; //width of flagship clipping inside flagship stripe
    
    //draw flagship image stripe
    structure_map.drawImage(img_structure, 0, 0, img_structure.width, img_structure.height, euclid_offset, 0, canvas_Str.width-euclid_offset, h_stripe);
    
    //draw arrow for timeline
    //writeArrowText(structure_map, canvas_Str, struct_texts[selected_language], euclid_offset, h_stripe, h_space);
    //drawArrow(structure_map, euclid_offset, h_stripe+28, canvas_Str.width-8, h_stripe+28, 4, 'rgb(255, 255, 255)');
    
    drawArrowFull(selected_language);
    //writeArrowTextLang(language);
    
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
    structure_map.drawImage(img_structure, (curXs-euclid_offset)/(canvas_Str.width-euclid_offset)*img_structure.width - w_clip/2, 0, w_clip, img_structure.height, (canvas_Str.width-w_image)/2, h_stripe+h_space, w_image, h_image);
    
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
            structure_map.drawImage(img_structure, (curXs-euclid_offset)/(canvas_Str.width-euclid_offset)*img_structure.width - w_clip/2, 0, w_clip, img_structure.height, (canvas_Str.width-w_image)/2, h_stripe+h_space, w_image, h_image);
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

    
    //changeLanguage(language); // we update the language again as the canvas is now loaded.

    //console.log(window.performance.memory);
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
            rho_sq = x_rot*x_rot*q + y_rot*y_rot/q;
            //calculate index of pixel (x,y) for imageData arrays
            index = (Math.round(x) + Math.round(y)*w)*4;
            //fill imageData with lens galaxy of certain brightness profile,
            //rho defines the brightness in the current pixel
            gal_profile = imageData_profile(rho_sq, a*a/(2.8*2.8));
            imageDataSrcSL.data[index] = gal_profile*255;
            imageDataSrcSL.data[index+1] = gal_profile*200;
            imageDataSrcSL.data[index+2] = gal_profile*100;
            imageDataSrcSL.data[index+3] = 255;

            if(x<=w-0.9 && y<=h-0.9){
                //calculate deflection angles in the non-singular isothermal sphere model
                var Y = Math.sqrt(rho_sq+thetaC*thetaC);
                a_x = (1-eps*eps)*thetaE/(2*Math.sqrt(eps))*Math.atan(2*Math.sqrt(eps)*x_rot/((1-eps*eps)*Y + (1-eps)*(1-eps)*thetaC));
                a_y = (1-eps*eps)*thetaE/(2*Math.sqrt(eps))*Math.atanh(2*Math.sqrt(eps)*y_rot/((1-eps*eps)*Y + (1-eps)*(1-eps)*thetaC));
                alpha_xSL[Math.round(x)][Math.round(y)] = a_x*Math.cos(or) - a_y*Math.sin(or);
                alpha_ySL[Math.round(x)][Math.round(y)] = a_x*Math.sin(or) + a_y*Math.cos(or);
                //make sure the deflection drops to almost 0 towards canvas border
                //else the deflection angle would be constant which is not desired here
                alpha_xSL[Math.round(x)][Math.round(y)] *= Math.exp(-rho_sq/(2*Math.pow(0.28*canvasSL.width,2)));
                alpha_ySL[Math.round(x)][Math.round(y)] *= Math.exp(-rho_sq/(2*Math.pow(0.28*canvasSL.width,2)));
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
            d_sq = (beta_x - src_x)*(beta_x - src_x) + (beta_y - src_y)*(beta_y - src_y);
            //if that distance is inside the galaxy radius, fill the pixel
            if(d_sq <= r*r){
                index = (x + y*w)*4; //index of pixel in imageData
                gal_profile = imageData_profile(d_sq, r*r/(2.8*2.8));
                imageDataLensSL.data[index] += gal_profile*255; //fill galaxy pixel
                imageDataLensSL.data[index+1] += gal_profile*100;
                imageDataLensSL.data[index+2] += gal_profile*100;
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
            d_sq = (beta_x - src_x)*(beta_x - src_x) + (beta_y - src_y)*(beta_y - src_y);
            if(d_sq <= r*r){
                index = (x + y*w)*4;
                gal_profile = imageData_profile(d_sq, r*r/(2.8*2.8));
                imageDataLens_WLsg.data[index] += gal_profile*255;
                imageDataLens_WLsg.data[index+1] += gal_profile*100;
                imageDataLens_WLsg.data[index+2] += gal_profile*100;
                imageDataLens_WLsg.data[index+3] = 255;
            }
        }
    }

    lens_WLsg.putImageData(imageDataLens_WLsg, 0, 0);
}

//WL many galaxy canvas, same as for SL canvas above
function drawcanvas_WLmg(alpha_x_WL, alpha_y_WL, N_imgs, slider_step, dm=false) {
    var imageDataArray = new Array(N_imgs);
    var imageDataLens_WLmg = lens_WLmg.getImageData(0, 0, w, h);
    if(dm==true){
        lens_WLmg.drawImage(img_kappa, 0, 0);
        var helpimageData = lens_WLmg.getImageData(0, 0, w, h);
        for(var y=0; y<h; y++){
            for(var x=0; x<w; x++){
                helpimageData.data[(x + y*w)*4] = 0; //take out red, dm is shown in blue
                helpimageData.data[(x + y*w)*4+3] = 150;
            }
        }
        lens_WLmg.putImageData(helpimageData, 0, 0);
    }
    for(var i=0; i<N_imgs; i++){
        imageDataArray[i] = lens_WLmg.getImageData(0, 0, w, h);
        for(var y=0; y<h; y++){
            for(var x=0; x<w; x++){
                var src_x = (x-origin_x) - alpha_x_WL[x][y]; //arbitrary deflection angle from array alpha_x,y
                var src_y = (origin_y-y) - alpha_y_WL[x][y];
                var index = (x + y*w)*4;
                for(var j=0; j<slider_step; j++){
                    var ind_gal = i*slider_step+j;
                    var d_sq = (x_WLmg[ind_gal]-src_x)*(x_WLmg[ind_gal]-src_x) + (y_WLmg[ind_gal]-src_y)*(y_WLmg[ind_gal]-src_y);
                    if(d_sq<=r_WLmg[ind_gal]*r_WLmg[ind_gal]){
                        var gal_profile = imageData_profile(d_sq, r_WLmg[ind_gal]*r_WLmg[ind_gal]/(2.8*2.8));
                        imageDataLens_WLmg.data[index] += gal_profile*red_WLmg[ind_gal];
                        imageDataLens_WLmg.data[index+1] += gal_profile*green_WLmg[ind_gal];
                        imageDataLens_WLmg.data[index+2] += gal_profile*100;
                    }
                }
                imageDataArray[i].data[index] += imageDataLens_WLmg.data[index];
                imageDataArray[i].data[index+1] += imageDataLens_WLmg.data[index+1];
                imageDataArray[i].data[index+2] += imageDataLens_WLmg.data[index+2];
                imageDataArray[i].data[index+3] = 255;
            }
        }
    }
    return imageDataArray;
}

function sample_galaxies(){
    // Rejection sampling of galaxy positions
    lens_WLmg.drawImage(img_kappa, 0, 0);
    var helpimageData = lens_WLmg.getImageData(0, 0, w, h);
    var len = w*h;
    var sample_dist = new Array(len);
    for(var y=0; y<h; y++){
        for(var x=0; x<w; x++){
            var index = x + y*w;
            // Use blue entries to sample the galaxies
            sample_dist[index] = helpimageData.data[index*4 + 2];
        }
    }
    //var Q = 1./(w*h);
    var c = getMax(sample_dist);
    for(var i=0; i<N_gal; i++){
        var xind = Math.round(getRanNum(0, w));
        var yind = Math.round(getRanNum(0, h));
        var like = sample_dist[xind+(h-yind)*w]/c; // Replaced yind by (h-yind) here...quick and dirty fix
        var u = getRanNum(0.,1.);
        if(u<Math.pow(like,0.8)){ // The higher this power, the stronger galaxy positions are biased to dense regions
            x_WLmg[i] = xind - 0.5*w;
            y_WLmg[i] = yind - 0.5*h;
            r_WLmg[i] = getRanNum(5,12)*(1.5-like); // Fit galaxy size artificially to inverse density
            if(checkOverlap(i,x_WLmg,y_WLmg,r_WLmg) == true){i--;}
        } else{
            i--;
        }
    }
    lens_WLmg.fillRect(0,0,w,h);
}
function getMax(arr) {
    let len = arr.length;
    let max = -Infinity;

    while (len--) {
        max = arr[len] > max ? arr[len] : max;
    }
    return max;
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
    structure_map.putImageData(imageDataStr, 0, 0, 0, 0, canvas_Str.width, h_stripe);

    // update lookbacktime value
    //lookbacktime = 10.8 * (curXs - w_clip_stripe/2 - euclid_offset)/(canvas_Str.width - w_clip_stripe - euclid_offset);
    lookbacktime = 10.8 * (curXs - euclid_offset)/(canvas_Str.width - w_clip_stripe/2 - euclid_offset);
    
    //console.log("lookbacktime: ", lookbacktime)
    writeLookbacktime(structure_map, canvas_Str, selected_language, euclid_offset, h_stripe, h_space);
}

function writeLookbacktime(ctx, canvas, lang, euclid_offset, h_stripe, h_space){
    ctx.fillStyle = "black";
    ctx.fillRect(0, h_stripe, canvas.width-50, 23);
    ctx.font = "18px Arial, sans-serif";
    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.textAlign = "center";
    ctx.fillText(struct_text_1.replace("XXX", lookbacktime.toFixed(1)), euclid_offset+(canvas.width-euclid_offset)/2, h_stripe+18);

}

function writeArrowText(ctx, canvas, lang, euclid_offset, h_stripe, h_space){
    // ctx is the context to draw on
    // get the strings from the html document:
    
    if (lang === "en") {
        struct_text_1 = struct_text_1_container.querySelectorAll("span[lang='en']")[0].innerText;
        struct_text_2 = struct_text_2_container.querySelectorAll("span[lang='en']")[0].innerText;
        struct_text_3 = struct_text_3_container.querySelectorAll("span[lang='en']")[0].innerText;
    }
    if (lang === "de") {
        struct_text_1 = struct_text_1_container.querySelectorAll("span[lang='de']")[0].innerText;
        struct_text_2 = struct_text_2_container.querySelectorAll("span[lang='de']")[0].innerText;
        struct_text_3 = struct_text_3_container.querySelectorAll("span[lang='de']")[0].innerText;
    }
    // and write them to the canvas, after filling the area with black:
    // the rest are some geometric offsets
    ctx.fillStyle = "black";
    ctx.fillRect(0, h_stripe, canvas.width, h_space);
    ctx.font = "18px Arial, sans-serif";
    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.textAlign = "center";
    ctx.fillText(struct_text_1.replace("XXX", lookbacktime.toFixed(1)), euclid_offset+(canvas.width-euclid_offset)/2, h_stripe+18);
    ctx.textAlign = "left";
    ctx.fillText(struct_text_2, euclid_offset, h_stripe+50);
    ctx.textAlign = "right";
    ctx.fillText(struct_text_3, canvas.width, h_stripe+50);
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

function drawArrowFull(lang) {
    // top-level wrapper to write arrow and the text in language lang
    writeArrowText(structure_map, canvas_Str, lang, euclid_offset, h_stripe, h_space);
    drawArrow(structure_map, euclid_offset, h_stripe+28, canvas_Str.width-8, h_stripe+28, 4, 'rgb(255, 255, 255)');
    
    //imageDataStr = structure_map.getImageData(0,0,canvas_Str.width,canvas_Str.height);
    //imageDataStrhelp = structure_map.getImageData(0,0,canvas_Str.width,canvas_Str.height);

}

//Give brightness of galaxy pixel according to its distance d from the galaxy center,
//the galaxy scale radius r_scale
//d and r_scale are given squared -> avoid taking multiple sqrt
function imageData_profile(d_sq, r_scale_sq){
    return Math.exp(-3.6713 * (Math.pow(d_sq/r_scale_sq, 0.25) - 1)); //Sersic profile with n=2
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
        d = Math.sqrt(d_x*d_x + d_y*d_y);
        //if that distance is smaller than sum of both galaxy radii -> overlap,
        //the factor 1.15 tries to account for stretching of the galaxies due to lensing
        if(d < 0.7*(r[index] + r[j])){
            return true;
        }
    }
    return false;
}