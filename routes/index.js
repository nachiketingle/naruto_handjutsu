var express = require('express');
var router = express.Router();
var handTrack = require('handtrackjs');
var image = require('get-image-data')
const { Image, createCanvas } = require('canvas');
let model;

// Load the model.
handTrack.load().then(m => {
  console.log("model loaded")
  model = m;
});


/* GET home page. */
router.get('/gesture', function(req, res, next) {

  image('./public/images/hand.jpg', function (err, info) {
    if(err){
      console.log(err);
      return;
    }
    var data = info.data
    var height = info.height
    var width = info.width

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
    }
    img.onerror = err => { throw err }
    img.src = './public/images/hand.jpg';

  })
});

module.exports = router;
