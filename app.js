/*
* Auth deyongz@jumei.com 2015-2016
* */
//系统需要安装 memcached imageMagick nodejs  flash-air
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var Memcached = require("memcached");
var fs = require('fs');
var http = require("http");

//图像缩放
var gm = require("gm");
var imageMagick = gm.subClass({ imageMagick: true });

var each = function(array,callback){
    for(var key in array){
        callback(key,array[key]);
    }
};

//服务器信息，用于抽奖页面请求地址的配置
global.serverInfo = {serverUrl : "http://127.0.0.1",serverHttpPort:"8080",socketPort:"8081"};


var initComplete = 0;
var dbugUserCountStatic = 0;  //自动随机添加测试人数
var dbugUserCount =  dbugUserCountStatic;


var memcached = new Memcached([ '127.0.0.1:11211']);
memcached.on('failure', function( details ){
    console.log( "Server " + details.server + "went down due to: " + details.messages.join( '' ) ) }
);
memcached.on('reconnecting', function( details ){
    console.log( "Total downtime caused by server " + details.server + " :" + details.totalDownTime + "ms")
});



var index = require('./routes/index');
var getMessageForSwf = require("./routes/getMessageForSwf");
var getUserInfoForWeb = require("./routes/getUserInfoForWeb");
var checkMessage = require("./routes/checkMessage");
var testData = require("./testData");

var app = express();
var request = require("request");
global.messageForSwf = []; //swf显示队列
global.messageForSwf2 = []; //swf显示队列
global.messagePendingCheckList = []; //待审核队列
global.messageCheckedList = {}; //审核后所有消息 按照人划分
global.deletedMessageList = []; //被删除的消息
global.userInfoForWeb = [];
global.allUserInfo = {};





global.luckyAwardUsers = {};  //记录中奖人数  //{weixinWheelAward:[[userid,userid],[userid,userid],[userid,userid]],ticketWheelAward:[[[userid],[userid]],[userid],[[userid],[userid]],[userid]]}
global.config = {
    weixinWheelAward : [10,10,10],//2015-[5,5], //length 是抽奖轮数  value 每轮中奖人数
    ticketWheelAward : [[2,2],[4,4,4],[5,5,5,5]],//2015-[[2,2],[8,8],[8,8,8]], //普通1 2 3等奖，每等奖 key轮数 value 中奖人数
    ticketNum:"1-540",//540
    ticketRuleOut : [537,538,539,540],
    ticketWeighted :"541",
    ticketWeightedProportion :0
};
var illegalReg = /欧|戴雨|雨森|惠普|刘辉|刘晖|老大|陈大|陈总|戴总|刘总|罗总|江总|老板|滚蛋|混蛋|老公|老婆|工资|加班|德永|ceo|CEO|CTO|cto|公平|抽奖|黑幕|内幕|加薪|绩效|加钱/;
global.ticketUserMap = [];
global.ticketWeightedMap = [];


global.pausePushToView = false;//暂停显示
global.boom = false;//爆炸文字
global.memcached = memcached;
global.errorMessageCount = 0;
allMessageLength = 0;


//从文件读取缓存数据
//*
if(1){
try{
global.messagePendingCheckList = (eval('('+fs.readFileSync("./jsonFile/messagePendingCheckList.JSON","utf-8")+')'));
global.messageCheckedList = (eval('('+fs.readFileSync("./jsonFile/messageCheckedList.JSON","utf-8")+')'));
global.deletedMessageList = (eval('('+fs.readFileSync("./jsonFile/deletedMessageList.JSON","utf-8")+')'));
global.allUserInfo = (eval('('+fs.readFileSync("./jsonFile/allUserInfo.JSON","utf-8")+')'));
global.luckyAwardUsers = (eval('('+fs.readFileSync("./jsonFile/luckyAwardUsers.JSON","utf-8")+')'));
}catch(e){}
}
//*/


//从memcached读取缓存，当memcached没有缓存，就从文件读取
memcached.getMulti(['messageForSwf', 'messagePendingCheckList', 'messageCheckedList', 'deletedMessageList',
    'pausePushToView', 'userInfoForWeb', 'allUserInfo',"luckyAwardUsers","errorMessageCount","dbugUserCount"], function (err, data) {
    if(data.messageForSwf)                  {global.messageForSwf = data.messageForSwf;                         console.log("messageForSwf.length:"+messageForSwf.length);}
    if(data.messagePendingCheckList)        {global.messagePendingCheckList = data.messagePendingCheckList;     console.log("messagePendingCheckList.length:"+messagePendingCheckList.length);}
    if(data.messageCheckedList)             {global.messageCheckedList = data.messageCheckedList;               console.log("messageCheckedList.length(userLength):"+Object.keys(messageCheckedList).length);}
    if(data.deletedMessageList)             {global.deletedMessageList = data.deletedMessageList;               console.log("deletedMessageList.length:"+deletedMessageList.length);}

    if(data.userInfoForWeb)                 {global.userInfoForWeb = data.userInfoForWeb;                       console.log("userInfoForWeb.length:"+userInfoForWeb.length);}
    if(data.allUserInfo)                    {global.allUserInfo = data.allUserInfo;                             console.log("allUserInfo.length:"+Object.keys(allUserInfo).length);}
    if(data.luckyAwardUsers)                    {global.luckyAwardUsers = data.luckyAwardUsers;                 console.log("lucky user get from memcached");}
    if(data.errorMessageCount)                    {global.errorMessageCount = Number(data.errorMessageCount);                 console.log("errorMessageCount from memcached");}

    if(data.dbugUserCount)                    {dbugUserCount = Number(data.dbugUserCount);                 console.log("dbugUserCount from memcached");}


    console.log("memcached");
    allMessageLength = global.messagePendingCheckList.length;
    initComplete  = 1;
    //global.luckyAwardUsers = {};
});
//每隔一段时间把缓存数据储存到文件，避免memcached无数据无法恢复
var canWriteCacheFile = false;
setInterval(function(){
//    global.messageForSwf = []; //swf显示队列
//    global.messagePendingCheckList = []; //待审核队列
//    global.messageCheckedList = {}; //审核后所有消息 按照人划分
//    global.deletedMessageList = []; //被删除的消息
//    global.errorMessageCount = 0; //被删除的消息
//    global.userInfoForWeb = [];
//    global.allUserInfo = {};
//    global.luckyAwardUsers = {};
    if(!canWriteCacheFile){return;}
    fs.writeFile("./jsonFile/messagePendingCheckList.JSON",JSON.stringify(global.messagePendingCheckList),function(error){console.log("messagePendingCheckList write file"+error)});
    fs.writeFile("./jsonFile/messageCheckedList.JSON",JSON.stringify(global.messageCheckedList),function(error){console.log("messageCheckedList write file"+error)});
    fs.writeFile("./jsonFile/deletedMessageList.JSON",JSON.stringify(global.deletedMessageList),function(error){console.log("deletedMessageList write file"+error)});
    fs.writeFile("./jsonFile/allUserInfo.JSON",JSON.stringify(global.allUserInfo),function(error){console.log("allUserInfo write file"+error)});
    fs.writeFile("./jsonFile/luckyAwardUsers.JSON",JSON.stringify(global.luckyAwardUsers),function(error){console.log("messagePendingCheckList write file"+error)});
    fs.writeFile("./jsonFile/errorMessageCount.JSON",global.errorMessageCount,function(error){console.log("messagePendingCheckList write file"+error)});
    //JSON.stringify(global.messagePendingCheckList)
},30000);

console.log("global.messagePendingCheckList.length:"+global.messagePendingCheckList.length)


//把已经检查过的数据作为没有检查的数据，用于测试
//把所有用户的头像和昵称提取出来
~function(){
    return;
    var users = [];
    var a = 0;
    var keys = Object.keys(global.allUserInfo);
    var wheel = function(){
        setTimeout(function(){
            var index = a,
                key = keys[a++],
                user = global.allUserInfo[key];
            if(a>keys.length){
                console.log("get userinfo head img complate!!!!!!!!!");
                fs.writeFile("./public/lastYearHeadImg/userheads.JSON",JSON.stringify(users),function(error){console.log("userheads write file"+error)});
                return;
            }
            if(!user || !user.headimgurl){wheel();return;}
            console.log("headimg:"+user.headimgurl);
            http.get(user.headimgurl, function(res){
                var imgData = "";
                res.setEncoding("binary"); //一定要设置response的编码为binary否则会下载下来的图片打不开
                res.on("data", function(chunk){
                    imgData+=chunk;
                });
                res.on("end", function(){
                    var writeUrl = "./public/lastYearHeadImg/"+index+".jpg";
                    fs.writeFile(writeUrl, imgData, "binary", function(err){
                        if(err){
                            wheel();
                        }else{
                            imageMagick(writeUrl).size(function(err, value){
                                // note : value may be undefined
                                if(!err && value.width>200){
                                    var getUser = {
                                        headimg:"lastYearHeadImg/"+index+".jpg",
                                        nickname:user.nickname
                                    }
                                    users.push(getUser);
                                }else{
                                    console.log("remove headimg file");
                                    fs.unlink(writeUrl);
                                }
                                wheel();
                            })

                        }
                    });
                });
            });
        },20);
    };
    wheel();
}();

/*
var msgList = [];
for(var openid in global.messageCheckedList){

    var userObj = global.messageCheckedList[openid];
    //console.log(userObj.messageList);
    if(userObj && userObj.messageList){
        for(var i in userObj.messageList){
            var msg = userObj.messageList[i];
            msg.openid = openid;
            msgList.push(msg);
        }
    }
}
if(msgList.length){
    //清空
    global.messageForSwf = []; //swf显示队列
    global.messageForSwf2 = []; //swf显示队列
    global.messagePendingCheckList = []; //待审核队列
    global.messageCheckedList = {}; //审核后所有消息 按照人划分
    global.deletedMessageList = []; //被删除的消息
    global.userInfoForWeb = [];
    global.allUserInfo = {};

    msgList.sort(function(x,y){return x.key> y.key});
    //每次送100条数据
    var timer = setInterval(function(){
        console.log("push test message --------");
        var len = Math.min(20,msgList.length);
        var pushMessage = msgList.splice(0,len);
        addWeixinLish(pushMessage);
        if(!msgList.length){
            clearInterval(timer);
        }
    },5000);
}
//console.log("global.messagePendingCheckList.length:"+global.messagePendingCheckList.length)
//*/

//清空缓存数据
global.clearMemcached = function(Field){
    if(Field){
        global.memcached.del(Field,function(err,data){});
        if(!global[Field]){return;}
        if(global[Field] instanceof Array){
            global[Field] = [];
        }else{
            global[Field] = {};
        }

    }else{
        global.memcached.del("messageForSwf",function(err,data){});
        global.memcached.del("messagePendingCheckList",function(err,data){});
        global.memcached.del("messageCheckedList",function(err,data){});
        global.memcached.del("deletedMessageList",function(err,data){});
        global.memcached.del("userInfoForWeb",function(err,data){});
        global.memcached.del("allUserInfo",function(err,data){});
        global.memcached.del("luckyAwardUsers",function(err,data){});
        global.memcached.del("errorMessageCount",function(err,data){});
        global.memcached.del("dbugUserCount",function(err,data){});

        global.messageForSwf = []; //swf显示队列
        global.messagePendingCheckList = []; //待审核队列
        global.messageCheckedList = {}; //审核后所有消息 按照人划分
        global.deletedMessageList = []; //被删除的消息
        global.errorMessageCount = 0; //被删除的消息
        global.userInfoForWeb = [];
        global.allUserInfo = {};
        global.luckyAwardUsers = {};

        dbugUserCount = dbugUserCountStatic;
        allMessageLength = 0;
    }

}

//获取系统的数据条数据 用于推送到检查页面显示状态
global.getSystemNums = function(){
    var checkedLength = 0,pendingLength = 0,userLength,toSwfLength,canAwardUserCount = 0;
    for(var key in global.messageCheckedList){
        var userGroupMessage = global.messageCheckedList[key];
        var messageCount = userGroupMessage.messageList.length;
        checkedLength += messageCount;
        if(messageCount){
            canAwardUserCount++;
        }
    }
    for(var key in global.messagePendingCheckList){
        if(global.messagePendingCheckList[key]){
            pendingLength++;
        }
    }
    userLength = Object.keys(global.allUserInfo).length;
    toSwfLength = global.messageForSwf.length;
    return {checkedLength:checkedLength,pendingLength:pendingLength,userLength:userLength,
        toSwfLength:toSwfLength,errorMessageCount:global.errorMessageCount,canAwardUserCount:canAwardUserCount,deletedCount:global.deletedMessageList.length};
}



var server = require('http').Server(app);
var io = require('socket.io')(server);
server.listen(8081);
global.webSocket = {emit:function(){},on:function(){}};

//var expressWebSocket = require('express-ws')(app);
//var io = require('socket.io')(app);
io.on('connection', function (socket) {
    global.webSocket = socket;

    socket.on('cleanToSwfMessage', function (data) {
        global.messageForSwf = [];
        socket.emit('cleanToSwfMessage',true);
        memcached.set("messageForSwf","",0,function(err,data){});
    });
    socket.on('pausePushToView', function (data) {
        global.pausePushToView = !global.pausePushToView;
        socket.emit("pausePushToView",global.pausePushToView);
        console.log("pausePushToView::"+global.pausePushToView);
    });
    socket.on('boomView', function (data) {
        global.boom = !global.boom;
        socket.emit("boomView",global.boom);
        console.log("boomView::"+global.boom);
    });

    //把所有已经发送过的消息回顾显示  用于年会结束时爆炸播放
    socket.on('viewAllMessageCheckedList', function (data) {
        console.log("viewAllMessageCheckedList");
        var allMessage = [];
        for(var key in global.messageCheckedList){
            var userinfo = global.messageCheckedList[key];
            if(userinfo &&  userinfo.messageList && userinfo.messageList.length){
                allMessage = allMessage.concat(userinfo.messageList);
            }
        }
        if(allMessage.length){
            canWriteCacheFile = true;
            allMessage.sort(function(x,y){
                return x.key > y.key;
            });
            console.log("会场结束，所有消息回滚显示条数："+allMessage.length);
            global.boom = false;
            global.messageForSwf = [];
            //每次送100条数据
            var timer = setInterval(function(){
                global.boom = true;
                var len = Math.min(100,allMessage.length);
                var pushMessage = allMessage.splice(0,len);
                global.messageForSwf = global.messageForSwf.concat(pushMessage);
                memcached.set("messageForSwf","",0,function(err,data){});
                if(!allMessage.length){
                    clearInterval(timer);
                }
            },2000);
            memcached.set("messageForSwf","",0,function(err,data){});
        }
        socket.emit("viewAllMessageCheckedList",global.boom);
    });
});

setInterval(function(){
    global.webSocket.emit('systemNums',global.getSystemNums());
},3000);

var addMessageToPendingQueue = function(message,userInfo){
    //console.log("addMessageToPendingQueue"+JSON.stringify(userInfo));
    message.nickname = userInfo.nickname;
    message.headimgurl = userInfo.headimgurl;
    message.headimgurl_local = userInfo.headimgurl_local;
    global.messagePendingCheckList[message.key] = message;
    global.webSocket.emit('pendingMessage', message);

    memcached.set("messagePendingCheckList",global.messagePendingCheckList,0,function(err,data){
        //console.log(err,data);
    });
};
//过滤的消息不满足条件，放到删除队列中
var deleteFilterMessage = function(message,userInfo,cause){
    message.nickname = userInfo.nickname;
    message.headimgurl = userInfo.headimgurl;
    message.key = message.key+"-"+cause; //临时储存删除原因
    global.deletedMessageList.push(message);
    global.memcached.set("deletedMessageList",global.deletedMessageList,0,function(err,data){});
}



//轮询服务器消息列表
var needGetUserIDs = {};//统计没获取用户信息的消息按用户分组
//添加新用户
var sureUserInfo = function(userInfo,userKey,localHeadImg){
    global.allUserInfo[userKey] = userInfo;
    userInfo.key = userKey;
    userInfo.headimgurl_local = localHeadImg;
    userInfo.headimgurl_localbig = localHeadImg+".jpg";
    global.userInfoForWeb.push(userInfo);
    memcached.set("userInfoForWeb",global.userInfoForWeb,0,function(err,data){});
    memcached.set("allUserInfo",global.allUserInfo,0,function(err,data){});

    //console.log(JSON.stringify(userInfo));
    global.messageCheckedList[userKey] = userInfo;//{nickname:userInfo.nickname,headimgurl:userInfo.headimgurl};
    global.messageCheckedList[userKey].messageList = [];
    var messageList = needGetUserIDs[userKey];
    for(var i in messageList){
        var message = messageList[i];
        addMessageToPendingQueue(message,userInfo);
    }
    delete needGetUserIDs[userKey];
}

function addWeixinLish(weixinList){
    var userIdArray = [];
    var userTestIdArray = [];
    if(weixinList.length){
        for(var i = 0 in weixinList){
            var message = weixinList[i];

            if(!message.msg){break;}
            message.msg = message.msg.replace(/[<>\/]/g,"");//去除html标签


            message.key = allMessageLength;//消息添加KEY
            allMessageLength++;

            var userInfo = global.messageCheckedList[message.openid];
            //过滤敏感词
            if(message.msg.match(illegalReg)){
                console.log("敏感词");
                deleteFilterMessage(message,userInfo ? userInfo : {},"敏感词");
                break;
            }//有敏感词；
            var nowTime = new Date().getTime(),
                beforeTime = nowTime - 2*60000;
            message.time = nowTime;

            //过滤是否重复消息 已经发送过的目录
            if(userInfo && userInfo.messageList.length){
                var re = false;
                for(var key in userInfo.messageList){
                    var msg = userInfo.messageList[key];
                    //console.log(msg);
                    if(msg.time>beforeTime && msg.msg==message.msg){ //在2分钟之内的消息才检查是否重复
                        console.log("重复");
                        deleteFilterMessage(message,userInfo ? userInfo : {},"重复");
                        re = true;
                        break;
                    }
                }
                if(re){
                    break;
                }
            }
            //过滤是否重复消息 待审核目录
            if(userInfo){
                var re = false;
                for(var key in global.messagePendingCheckList){
                    var msg = global.messagePendingCheckList[key];
                    if(msg && msg.time>beforeTime && msg.openid == message.openid && msg.msg==message.msg){
                        console.log("审查队列中重复");
                        deleteFilterMessage(message,userInfo ? userInfo : {},"审查队列中重复");
                        re = true;
                        break;
                    }
                }
                if(re){
                    break;
                }
            }

            //console.log(global.messageCheckedList[message.openid])
            if(!userInfo){ //如果没有获取用户信息
                if(needGetUserIDs[message.openid]){   //如果一个人未审核的消息有多条
                    needGetUserIDs[message.openid].push(message);
                    //console.log(needGetUserIDs[message.openid]);
                }else{
                    needGetUserIDs[message.openid] = [message];

                    if(message.test){
                        userTestIdArray.push(message.openid);
                    }else{
                        userIdArray.push(message.openid);
                    }
                }
            }else{ //获取了用户信息插入待审核队列
                addMessageToPendingQueue(message,userInfo);
            }
        }


        if(userIdArray.length || userTestIdArray.length){ //如果有新的用户 获取用户信息
            console.log(userIdArray);
            var testUser = {};
            if(userTestIdArray.length){
                testUser = testData.getTestUser(userTestIdArray);
                dbugUserCount-=Object.keys(testUser).length;
            }
            var p = "[\""+userIdArray.join('","')+"\"]";
            request.post('http://webservice.url.com?callback=myFunction',{form:{content:p}}, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    body +="inserttxt;";
                    body = body.replace("myFunction","").replace("inserttxt;","");
                    var userList;
                    try{
                        userList = eval(body);
                        if(!userList){
                            userList = {};
                        }
                    }catch(e){
                        return;
                        /*userList = {

                         "omdoyuBwlzyT5_m0wVzaN_JdHWvA":
                         {
                         "nickname":"聚美",
                         "headimgurl":"http:\/\/wx.qlogo.cn\/mmopen\/et9q9FvjBBr811mAEaNg1nXTjD3PI9ibdpduHYiahZ0r7dBwNhs6WqDqThvyHgugWpVBLVhbTLUa6qnhbg93xqPQ\/0"
                         }
                         }*/
                    }
                    //console.log(userList);
                    each(needGetUserIDs,function(key,messageList){
                        //console.log(key+"---------------------");
                        var userInfo = userList[key];
                        if(!userInfo){
                            userInfo = testUser[key];
                        }
                        if(userInfo){
                            if(!userInfo.headimgurl){ //如果头像是空的，去http请求会直接crach
                                userInfo.headimgurl = "/images/noHeadimg.jpg";
                                sureUserInfo(userInfo,key,"images/noHeadimg.jpg");

                            }else{
                                http.get(userInfo.headimgurl, function(res){
                                    var imgData = "";
                                    res.setEncoding("binary"); //一定要设置response的编码为binary否则会下载下来的图片打不开

                                    res.on("data", function(chunk){
                                        imgData+=chunk;
                                    });

                                    res.on("end", function(){
                                        var headImg,writeUrl = "./public/headimgurl/"+key+".jpg";
                                        fs.writeFile(writeUrl+".jpg", imgData, "binary", function(err){
                                            if(err){
                                                headImg = userInfo.headimgurl;
                                            }else{
                                                headImg = "headimgurl/"+key+".jpg";
                                                try{
                                                    imageMagick(writeUrl+".jpg").resize(60, 60, '!') //加('!')强行把图片缩放成对应尺寸150*150！
                                                        .autoOrient().write(writeUrl, function(err){
                                                            console.log("resize`````");
                                                            if (err) {
                                                                console.log(err);
                                                            }
                                                        });
                                                }catch(e){}
                                            }

                                            sureUserInfo(userInfo,key,headImg);
                                        });
                                    });
                                });
                            }
                        }
                    });

                    memcached.set("messageCheckedList",global.messageCheckedList,0,function(err,data){});
                }
            });
        }
    }
};
setInterval(function(){
    //if(global.messagePendingCheckList.length>=6){return;}
    if(!initComplete){return;}
    request('http://wx.jumei.com/Activity/Jumei2015_RawList?limit=100&callback=myFunction', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            body +="inserttxt;";

            body = body.replace("myFunction(","").replace(")inserttxt;","");
            var weixinList;

            try{
                weixinList = eval(body);
                if(!weixinList){
                    weixinList = [];
                }
                if(weixinList.length){
                    console.log(weixinList)
                }
            }catch(e){
                return;

            }
            if(dbugUserCount>0){
                console.log("dbugUserCount---"+dbugUserCount);
                var testMessage = testData.getTestMessage();
                weixinList = weixinList.concat(testMessage);
            }
            addWeixinLish(weixinList);
        }
    })
},2000);



/*app.ws('/', function(ws, req) {
    ws.on('connect', function(msg) {
        console.log("connect----"+msg);
    });
    ws.on('say', function(msg) {
        console.log("say----"+msg);
    });
    ws.on('message', function(msg) {
        console.log("message----"+msg);
    });
    console.log('socket', req.testing);
});*/

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', index);
app.use("/check",checkMessage);
app.use("/getMessageForSwf",getMessageForSwf);
app.use("/getUserInfoForWeb",getUserInfoForWeb);
app.use(function(req, res, next) {
    if(req.cookies.userName){
        next();
    }
});


/*app.use('/addSell', addSell);
app.use('/check', checkPrice);
app.use('/purchase', purchase);
app.use('/statistics', statisticsMoney);
app.use('/takeOut', takeOut);*/

/*app.use({"get":'/jsonp',function(req,res,next){  //返回jsonp
    res.jsonp({status:'jsonp'});
    res.end();
}});
app.get('/json',function(req,res,next){   #返回json
    res.send({status:'json'});
});*/

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
