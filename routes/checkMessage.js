var express = require('express');
var router = express.Router();
var request = require("request");

var loginError = "";
var loginInfo = {
    "jumei":"jumei2016",
    "feeyoung":"feeyoung2016",
}

function addMessageToSwfQueue(messages,userInfo){

    //console.log("addMessageToSwfQueue++"+JSON.stringify(messages)+"----");
    var perfectMessage = function(message){
        try{
            /*
            var messageInfo = {
                nickname:userInfo.nickname,
                headimgurl:userInfo.headimgurl,
                headimgurl_local:userInfo.headimgurl_local,
                msg:message.msg
            };
            */
            global.messageForSwf.push(message);
            global.messageForSwf2.push(message);

        }catch(e){}
    };
    if(messages instanceof Array){
        for(var key in messages){
            perfectMessage(messages[key]);
        }
    }else{
        perfectMessage(messages);
    }
}

/* GET home page. */
router.get('/', function(req, res) {
    //console.log(req.query);
    if(req.query.action=="loginout"){
        res.cookie("userName", "");
        res.redirect("/check");
        return;
    }
    //response.json(global.messageForSwf);

    /*if(request.cookies["userName"]){
     response.redirect("manager")
     }
     response.render('index.ejs', { title: 'Express' });*/
    //console.log(global.messagePendingCheckList)
    if(!req.cookies["userName"]){

        res.render('login.ejs',{"loginError":loginError});
        if(loginError){loginError = "";}

    }else{
        if(req.query.action == "clear"){
            console.log(req.query.field);
            global.clearMemcached(req.query.field);
            res.send("<p>clear complete!do't tell this url to other.</p>");
            return;
        }else if(req.query.action == "award"){
            console.log(global.luckyAwardUsers.weixinWheelAward);

            res.render('awardList.ejs', { weixinWheelAward:global.luckyAwardUsers.weixinWheelAward, ticketWheelAward: global.luckyAwardUsers.ticketWheelAward,allUserInfo:global.allUserInfo});
            return;
        }

        res.render('checkMessageList.ejs', { messageList: global.messagePendingCheckList,systemNums:global.getSystemNums(),severInfo:global.severInfo});
    }


});

router.get("/allUsers",function(req,res){
    res.render('allUsers.ejs', { allUserInfo: global.allUserInfo,messageCheckedList:global.messageCheckedList});
});
router.get("/deleted",function(req,res){
    res.render('deletedMessageList.ejs', { allUserInfo: global.allUserInfo,deletedMessageList:global.deletedMessageList});
});

router.post('/', function(req, res) {
    console.log(req.body.action);
    if(req.body.action=="login"){
        var username = req.body.username;
        var password = req.body.password;
        if(!username || !password){
            loginError = "请输入账号密码";
        }else if(loginInfo[username]!=password){
            loginError = "账号或者密码不正确";
        }else{
            res.cookie("userName", username,{ expires: new Date(Date.now() + 24*3600*1000)});
        }
        res.redirect("/check");
        return;
    }

    if(!req.cookies["userName"]){
        return;
    }
    var messageIDs = req.body["messageID[]"];
    if(req.body.action=="pass"){
        //console.log("messageid:"+req.body);
        if(messageIDs){

            if(typeof messageIDs=="string"){
                messageIDs = [messageIDs];
            }
            for(var i in messageIDs){
                var messageID = messageIDs[i];
                var message = global.messagePendingCheckList[messageID];

                //console.log(messageID);
                if(message){
                    delete global.messagePendingCheckList[messageID];  //从未审核的队列删除
                    //console.log(global.messagePendingCheckList[messageID]);
                    if(!global.messageCheckedList[message.openid]){
                        global.errorMessageCount++;
                        console.log("Error:no userinfo message in pendingCheckListQueue!!!==messigeid:"+message.openid);
                        global.memcached.set("errorMessageCount",global.errorMessageCount,0,function(err,data){});
                    }else{
                        global.messageCheckedList[message.openid].messageList.push(message);
                        addMessageToSwfQueue(message,global.messageCheckedList[message.openid]);
                    }
                }
            }
            global.memcached.set("messageForSwf",global.messageForSwf,0,function(err,data){
                //console.log(err,data);
            });
            global.memcached.set("messageCheckedList",global.messageCheckedList,0,function(err,data){
                //console.log(err,data);
            });
            global.memcached.set("messagePendingCheckList",global.messagePendingCheckList,0,function(err,data){});



            res.json({status:true});
        }

    }
    else if(req.body.action=="delete"){
        if(messageIDs){
            if(typeof messageIDs=="string"){
                messageIDs = [messageIDs];
            }
            for(var i in messageIDs){
                var messageID = messageIDs[i];
                var message = global.messagePendingCheckList[messageID];
                if(message){
                    global.deletedMessageList.push(message);
                    delete global.messagePendingCheckList[messageID];  //从未审核的队列删除
                }
            }
            global.memcached.set("messagePendingCheckList",global.messagePendingCheckList,0,function(err,data){
                //console.log(err,data);
            });
            global.memcached.set("deletedMessageList",global.deletedMessageList,0,function(err,data){
                //console.log(err,data);
            });

        }
        res.json({status:true});
    }
});

module.exports = router;
