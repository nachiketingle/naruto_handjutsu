var express = require('express');
var router = express.Router();
var handTrack = require('handtrackjs');

/* GET home page. */
router.put('/gesture', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
