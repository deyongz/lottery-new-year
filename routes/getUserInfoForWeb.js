var express = require('express');
var router = express.Router();



function ticketChoose(allNumber,listAddWeight,percentage) {
    var all = [];
    var commonList = [];
    var weightList = [];
    var times = Math.pow(10, (percentage + '').length - 2);

    weightList = listAddWeight;
    for(var k in allNumber){
        var num = allNumber[k]+0;
        if(weightList.indexOf(num) == -1) {
            commonList.push(num);
        }
    }


    var notPercentage = (times - percentage * times) / times;
    var crossTimes = commonList.length * weightList.length;

    //加权了的映射关系
    for (var i = 0; i < times * crossTimes * percentage; i++) {
        var index1 = i % weightList.length;
        all[i] = weightList[index1];
    }

    //为加权的映射关系
    for (var j = 0; j < times * crossTimes * notPercentage; j++) {
        var index2 = j % commonList.length;
        all[i + j] = commonList[index2];
    }

    //在平均分布的一组数上随机取值让加权起作用
    var random = Math.floor(Math.random() * crossTimes * times);
    return all[random];

}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex ;

    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}


var loopCheck = function(arrayValue,luckyNum){
    if(arrayValue instanceof Array){
        for(var key in arrayValue){
            var arrayValue2 = arrayValue[key];
            if(arrayValue2){
                //console.log(luckyNum);
                if(arrayValue2 instanceof Array){
                    if(loopCheck(arrayValue2,luckyNum)){
                        return true;
                    }
                }else if(arrayValue2 == luckyNum){
                    return true;
                }
            }
        }
        return false;
    }
    return false;
}
var checkWeixinLuckyUserRepeat = function(luckWeixinID){//检查中奖微型是否重复
    return loopCheck(global.luckyAwardUsers.weixinWheelAward,luckWeixinID);
}
var checkTicketRepeat = function(luckyNum){ //检查中间号是否重复
    //console.log(global.luckyAwardUsers.ticketWheelAward);
    if(global.config.ticketRuleOut.indexOf(luckyNum)>=0){
        return true;
    }
    return loopCheck(global.luckyAwardUsers.ticketWheelAward,luckyNum);
}

var strNumIntervalToIntArray = function(strNumInterval){
    var numSplit = strNumInterval.split(",");
    var intArray = [];
    for(var key in numSplit){
        var rNum = numSplit[key].split("-");

        if(rNum.length>1){
            var rNumL,rNumR;
            rNum[0] = Number(rNum[0]);
            rNum[1] = Number(rNum[1]);
            if(rNum[0]<rNum[1]){
                rNumL = rNum[0];
                rNumR = rNum[1];
            }else{
                rNumL = rNum[1];
                rNumR = rNum[0];
            }
            //console.log(rNumL+"--"+rNumR);
            for(var i=rNum[0];i<rNumR+1;i++){
                intArray.push(i);
            }
        }else{
            rNum = Number(rNum[0]);
            if(!isNaN(rNum))
                intArray.push(rNum);
        }
    }
    return intArray;
};

/* GET home page. */
router.get('/', function(req, res) {
    if(req.query.action=="all"){  //获取所有用户
        res.jsonp(global.allUserInfo);
    }else if(req.query.action == "getAwardUserForWeixin"){ //获取微信中奖用户  wheelNum:第几轮抽奖
        var wheelNum = req.query.wheelNum;
        if(global.config.weixinWheelAward.length<req.query.wheelNum){
            res.jsonp({});
            return;
        }
        var luckyUserIds = [];
        var luckyUserOpenIDs = {};
        //console.log(checkWeixinLuckyUserRepeat("user351"));
        if(global.luckyAwardUsers.weixinWheelAward && global.luckyAwardUsers.weixinWheelAward[wheelNum-1]){
            luckyUserIds = global.luckyAwardUsers.weixinWheelAward[wheelNum-1];
        }else{
            if(!global.luckyAwardUsers.weixinWheelAward){global.luckyAwardUsers.weixinWheelAward = [];}
            global.luckyAwardUsers.weixinWheelAward[wheelNum-1] = [];
            for(var i=0;i<global.config.weixinWheelAward[wheelNum-1];i++){
                var userOpenIDs = Object.keys(global.allUserInfo);
                console.log(userOpenIDs)
                var luckyUserOpenID = Math.ceil(Math.random()*(userOpenIDs.length-1)-1);
                luckyUserOpenID = userOpenIDs[luckyUserOpenID];
                //如果这个用户一条消息也没用通过审核 或者和之前中奖重复
                if(luckyUserOpenIDs[luckyUserOpenID] || !global.messageCheckedList[luckyUserOpenID] ||  !global.messageCheckedList[luckyUserOpenID].messageList.length || checkWeixinLuckyUserRepeat(luckyUserOpenID)){
                    i--;
                }else{
                    luckyUserIds.push(luckyUserOpenID);
                    global.luckyAwardUsers.weixinWheelAward[wheelNum-1].push(luckyUserOpenID);
                }
            }


            global.memcached.set("luckyAwardUsers",global.luckyAwardUsers,0,function(err,data){});
        }

        for(var i in luckyUserIds){
            var luckyUserOpenID = luckyUserIds[i];
            var message = global.messageCheckedList[luckyUserOpenID].messageList[global.messageCheckedList[luckyUserOpenID].messageList.length-1];
            luckyUserOpenIDs[luckyUserOpenID] = {lastMessage:message ? message.msg : ""};
        }
        res.jsonp(luckyUserOpenIDs);
    }else if(req.query.action == "getAwardUserForTicket"){
        var wheelNum = req.query.wheelNum;
        var ranking = req.query.ranking;
        if(!ranking || !wheelNum){
            res.jsonp([]);
            return;
        }
        //console.log(checkTicketRepeat(3));
        if(!global.ticketUserMap.length){
            global.ticketUserMap = strNumIntervalToIntArray(global.config.ticketNum);
            for(var xx = 0;xx<3;xx++){
                global.ticketUserMap = shuffle(global.ticketUserMap);//洗牌
            }
            global.ticketWeightedMap = strNumIntervalToIntArray(global.config.ticketWeighted);
            //console.log(global.ticketUserMap);
        }
        var prizeCount = global.config.ticketWheelAward[ranking-1][wheelNum-1];
        if(!prizeCount){
            res.jsonp([]);
            return;
        }
        var luckyTicket = [];
        if(global.luckyAwardUsers.ticketWheelAward &&
            global.luckyAwardUsers.ticketWheelAward[ranking-1] &&
            global.luckyAwardUsers.ticketWheelAward[ranking-1][wheelNum-1] &&
            global.luckyAwardUsers.ticketWheelAward[ranking-1][wheelNum-1].length){
            luckyTicket = global.luckyAwardUsers.ticketWheelAward[ranking-1][wheelNum-1];
        }else{
            if(!global.luckyAwardUsers.ticketWheelAward){global.luckyAwardUsers.ticketWheelAward = [];}
            if(!global.luckyAwardUsers.ticketWheelAward[ranking-1]){global.luckyAwardUsers.ticketWheelAward[ranking-1] = [];}
            global.luckyAwardUsers.ticketWheelAward[ranking-1][wheelNum-1] = [];

            for(var i=0;i<prizeCount;i++){
                //var luckyNum  = Math.ceil(Math.random()*(global.ticketUserMap.length-1)-1);
                //luckyNum = global.ticketUserMap[luckyNum];


                var luckyNum = ticketChoose(global.ticketUserMap,global.ticketWeightedMap,global.config.ticketWeightedProportion);

                //之前中奖重复
                if(checkTicketRepeat(luckyNum)){
                    //console.log("中奖号码重复了");
                    i--;
                }else{
                    luckyTicket.push(luckyNum);
                    global.luckyAwardUsers.ticketWheelAward[ranking-1][wheelNum-1].push(luckyNum);
                }
            }
            global.memcached.set("luckyAwardUsers",global.luckyAwardUsers,0,function(err,data){});
        }


        res.jsonp(luckyTicket);

    }
    else if(req.query.action == "getWeixinWheel"){
        //[10,15,5,6,8]
        res.jsonp(global.config.weixinWheelAward);
    }
    else if(req.query.action == "ticketWheel"){
        //[[5],[4,3],[2,2],[5]]
        var a = {awardInfo:[],tickets:global.config.ticketNum};
        for(var key in global.config.ticketWheelAward){
            a.awardInfo.push(global.config.ticketWheelAward[key].length);
        }

        res.jsonp(a);
    }
    else{
        res.jsonp(global.userInfoForWeb);
        global.userInfoForWeb = [];//清空
        global.memcached.set("userInfoForWeb",global.userInfoForWeb,0,function(err,data){
            //console.log(err,data);
        });
    }

});

module.exports = router;