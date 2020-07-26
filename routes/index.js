var express = require('express');
var router = express.Router();
var handTrack = require('../handtrackjs/src/index.js');
var image = require('get-image-data')
const { Image, createCanvas } = require('canvas');
let model;

var fs = require('fs');

const modelParams = {
  flipHorizontal: false,   // flip e.g for video
  // imageScaleFactor: 0.7,  // reduce input image size for gains in speed.
  maxNumBoxes: 20,        // maximum number of boxes to detect
  // iouThreshold: 0.5,      // ioU threshold for non-max suppression
  scoreThreshold: 0.5,    // confidence threshold for predictions.
}

// Load the model.
handTrack.load(modelParams).then(m => {
  console.log("model loaded")
  model = m;
});


/* GET home page. */
router.get('/gesture', function(req, res, next) {

  let test = './public/images/dog0.jpg';

  image(test, function (err, info) {
    if(err){
      console.log(err);
      return;
    }
    var data = info.data
    var height = info.height
    var width = info.width
    let padding_w = width/10;
    let padding_h = height/10;

    // Turn the image into a canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const img = new Image()
    img.onload = () => {
      console.log("image loaded.");

      ctx.drawImage(img, 0, 0, width, height);

      model.detect(canvas).then(predictions => {
        console.log('Predictions: ', predictions);

        let maxX = 0, maxY=0, minX=width, minY=height;
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

        let coords = predictions[0]['bbox']; // this is an array in format [minx, miny, maxx-minx, maxy-miny]
        let new_width = maxX - minX + padding_w * 2;
        let new_height = maxY - minY + padding_h * 2;
        let max_dim = Math.max(new_width, new_height);
        let offsetX = minX - padding_w - (max_dim - new_width)/2;
        let offsetY = minY - padding_h - (max_dim - new_height)/2;
        new_width = new_height = max_dim;

        // Convert into grayscale canvas
        var imgPixels = ctx.getImageData(offsetX, offsetY, new_width, new_height);
        for(var y = 0; y < new_height; y++){
          for(var x = 0; x < new_width; x++){
            var i = (y * 4) * new_width + x * 4;
            var avg = (0.3 * imgPixels.data[i]) + (0.59*imgPixels.data[i + 1]) + (0.11*imgPixels.data[i + 2]);
            imgPixels.data[i] = avg;
            imgPixels.data[i + 1] = avg;
            imgPixels.data[i + 2] = avg;
          }
        }

        // Create a new canvas
        const new_canvas = createCanvas(new_width, new_height);
        const new_ctx = new_canvas.getContext('2d');
        new_ctx.putImageData(imgPixels, 0, 0, 0, 0, new_width, new_height);

        // output photo for testing
        const buffer = new_canvas.toBuffer('image/png');
        fs.writeFileSync('./image.png', buffer)
      });

    }
    img.onerror = err => { throw err }
    img.src = test;

  })
});

module.exports = router;
