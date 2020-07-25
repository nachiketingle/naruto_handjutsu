var express = require('express');
var router = express.Router();
var handTrack = require('handtrackjs');
var image = require('get-image-data')
const { Image, createCanvas } = require('canvas');
let model;

var fs = require('fs');

// Load the model.
handTrack.load().then(m => {
  console.log("model loaded")
  model = m;
});


/* GET home page. */
router.get('/gesture', function(req, res, next) {

  image('./public/images/hand1.jpg', function (err, info) {
    if(err){
      console.log(err);
      return;
    }
    var data = info.data
    var height = info.height
    var width = info.width

    for (var i = 0, l = data.length; i < l; i += 4) {
      var red = data[i];
      var green = data[i + 1];
      var blue = data[i + 2];
      var gray = (0.3 * red) + (0.59 * green) + (0.11 * blue);
      data[i] = data[i+1]= data[i+2]=gray;
    }
    console.log(info.data);

    // Turn the image into a canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const img = new Image()
    img.onload = () => {
      console.log("image loaded.");

      ctx.drawImage(img, 0, 0, width, height);

      model.detect(canvas).then(predictions => {
        console.log('Predictions: ', predictions);
      });

      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync('./image.png', buffer)
    }
    img.onerror = err => { throw err }
    img.src = './public/images/hand1.jpg';

  })
});

module.exports = router;
