var express = require('express');
var router = express.Router();
var handTrack = require('../handtrackjs/src/index.js');
var image = require('get-image-data')
const { Image, createCanvas } = require('canvas');
let model;
const SRC_URL = './img_src';
const DST_URL = './img_dst';
const SIZE = 200;

var fs = require('fs');

const modelParams = {
  flipHorizontal: false,   // flip e.g for video
  // imageScaleFactor: 0.7,  // reduce input image size for gains in speed.
  maxNumBoxes: 20,        // maximum number of boxes to detect
  // iouThreshold: 0.5,      // ioU threshold for non-max suppression
  scoreThreshold: 0.2,    // confidence threshold for predictions.
}

// Load the model.
handTrack.load(modelParams).then(m => {
  console.log("model loaded")
  model = m;
});

router.get('/test', (req, res, next) => {
  res.send('ayyy lmaoooo');
});

router.get('/generate_images', function(req, res, next) {
  let files = fs.readdirSync(SRC_URL);
  let numOfFiles = files.length;

  // for each images, convert it to grayscale
  for(let i = 0; i < numOfFiles; i++){
    let folder =  files[i];
    if (!fs.existsSync(DST_URL+'/'+folder)){
      fs.mkdirSync(DST_URL+'/'+folder);
    }
    let images = fs.readdirSync(SRC_URL + '/' + folder);
    for(let j = 0; j < images.length; j++){
      let img = images[j];
      center_image(SRC_URL + '/' + folder + '/'+ img, (buffer) => {
        fs.writeFileSync(DST_URL + '/' + folder + '/' + img, buffer);
      });
    }
  }
  res.send('Completed ' + numOfFiles + ' images');
});

/* GET home page. */
router.get('/gesture', function(req, res, next) {

  let test = SRC_URL + '/ram/ram3.jpg';
  center_image(test, (buffer) => {
    fs.writeFileSync(DST_URL + '/img.jpg', buffer)
  });

});

function center_image(url, callback){
  image(url, function (err, info) {
    if(err){
      console.log(err);
      return;
    }
    var data = info.data
    var height = info.height
    var width = info.width

    // Turn the image into a canvas
    const canvas = createCanvas(SIZE, SIZE);
    const ctx = canvas.getContext('2d');
    const img = new Image()
    img.onload = () => {
      console.log("image loaded.");

      ctx.scale(SIZE/width, SIZE/width);
      ctx.drawImage(img, 0, 0);

      model.detect(canvas).then(predictions => {
        console.log('Predictions: ', predictions);

        let maxX = 0, maxY=0, minX=canvas.width, minY=canvas.height;
        for(let i = 0; i < predictions.length; i++){
          let prediction = predictions[i]['bbox'];
          if(prediction[0] < minX)
            minX=prediction[0]
          if(prediction[1] < minY)
            minY=prediction[1]
          if(prediction[2] + prediction[0] > maxX)
            maxX=prediction[2] + prediction[0]
          if(prediction[3] + prediction[1] > maxY)
            maxY=prediction[3] + prediction[1]
        }

        let new_width = maxX - minX;
        let new_height = maxY - minY;
        let max_dim = Math.max(new_width, new_height) + 60;
        let offsetX = minX - (max_dim - new_width)/2;
        let offsetY = minY - (max_dim - new_height)/2;
        new_width = new_height = max_dim;

        // Convert into grayscale canvas
        var imgPixels = ctx.getImageData(offsetX, offsetY, new_width, new_height);
        for(var y = 0; y < canvas.height; y++){
          for(var x = 0; x < canvas.width; x++){
            var i = (y * 4) * canvas.width + x * 4;
            var avg = (0.3 * imgPixels.data[i]) + (0.59*imgPixels.data[i + 1]) + (0.11*imgPixels.data[i + 2]);
            imgPixels.data[i] = avg;
            imgPixels.data[i + 1] = avg;
            imgPixels.data[i + 2] = avg;
          }
        }

        // Create a new canvas
        let new_canvas = createCanvas(new_width, new_height);
        console.log(new_width, new_height);
        let new_ctx = new_canvas.getContext('2d');
        new_ctx.putImageData(imgPixels, 0, 0, 0, 0, new_width, new_height);

        console.log(new_canvas.width, new_canvas.height);


        // output photo for testing
        const buffer = new_canvas.toBuffer('image/png');
        callback(buffer);
      });

    }
    img.onerror = err => { throw err }
    img.src = url;
  })
}

module.exports = router;
