var express = require('express');
var router = express.Router();
var fs = require('fs');
/* GET home page. */
router.get('/', function(res, req) {
    req.render('select-bless.ejs', {severInfo:global.severInfo});
});
router.get('/ticket/', function(res, req) {
    //req.render('select-all.ejs', { title: 'Express' });
    req.render('select-all.ejs', {severInfo:global.severInfo});
    req.end();
});


router.get('/lastYear/', function(res, req) {
    //req.render('select-all.ejs', { title: 'Express' });
    //var lastYearUsers = (eval('('+fs.readFileSync("./public/lastYearHeadImg/userheads.JSON","utf-8")+')'));
    var lastYearUsers = fs.readFileSync("./public/lastYearHeadImg/userheads.JSON","utf-8");
    req.render('lastYear.ejs', {severInfo:global.severInfo,lastYearUsers:lastYearUsers});
    req.end();
});

module.exports = router;
