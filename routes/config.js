var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {

    if(!req.cookies["userName"]){
        res.redirect("/check");
    }else{
        if(req.query.action == "clear"){
            global.clearMemcached();
            res.send("<p>clear complete!do't tell this url to other.</p>");
            return;
        }

        res.render('config.ejs', { messageList: global.messagePendingCheckList,systemNums:global.getSystemNums()});
    }

});

router.post('/', function(request, response) {

});

module.exports = router;
