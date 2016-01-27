var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(request, response) {
    if(global.pausePushToView){
        response.json({messageList:[],pauseView:global.pausePushToView,boom:global.boom});
    }else if(request.query.swf == "2"){
        //console.log("swf  222222")
        response.json({messageList:global.messageForSwf2,pauseView:global.pausePushToView,boom:global.boom});
        global.messageForSwf2 = [];//清空
        //global.memcached.set("messageForSwf",global.messageForSwf,0,function(err,data){});
    }else{
        response.json({messageList:global.messageForSwf,pauseView:global.pausePushToView,boom:global.boom});
        global.messageForSwf = [];//清空
        global.memcached.set("messageForSwf",global.messageForSwf,0,function(err,data){
            //console.log(err,data);
        });
    }

    /*if(request.cookies["userName"]){
     response.redirect("manager")
     }
     response.render('index.ejs', { title: 'Express' });*/

});

router.post('/', function(request, response) {
    if(request.body.passtxt && request.body.passtxt=="feeyoung"){
        response.cookie("userName", "feeyoung",{ expires: new Date(Date.now() + 900000)});
        response.redirect("manager")
    }
    else{
        response.redirect("/")
    }
});

module.exports = router;
