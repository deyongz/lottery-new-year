/**
 * 内部使用index为计算机index,和日常使用有 1 的偏差
 */

/*****************变量********************************/
var chineseNumber = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
var weiXinWheel = []; //[1,2,2,1]
var userNumbers = []; // [1,2,3,4,7,11,12,13 .......]
var gap = $('div.gap_lun');
var first = $('div.first');
var second = $('div.second');
var main = $.extend({
    itemW: 31,
    itemH: 27,
    spreadNumberDuring: 5,
    spreadEffectGap: 5,
    spreadEffectScale: 6,
    spreadEffectDuring: 100,
    selectRunningScale:6,
    runningScaleToSize : 180,
    selectDuring:50,
    initPercent:30,
    percentAdd:17
});
var divNumbers;
var spreadNumberTimer;
var selectTimer;

/****************主流程***********************************/
$.ajax({
    url: serverInfo.serverUrl + ":" + serverInfo.serverHttpPort + '/getUserInfoForWeb?callback=getSelectAllInfo&action=ticketWheel',
    dataType: 'jsonp'
});


/*
 绑定快捷键操作
 */
$(document).keydown(function (e) {
    var code = e.keyCode;
    if (code >= 49 && code <= 57 && e.shiftKey) {
        $.mask.close();
        for (var i = 0; i < weiXinWheel.length; i++) {
            if (code == 49 + i) {
                gap.html('<span class="parent-index">' + chineseNumber[i] + '</span>等奖' + (weiXinWheel[i] > 1 ? (',第<span class="child-index">' + chineseNumber[0] + '</span>轮') : '')).data('parent', i).data('child', 0);
                secondSlide();
                break;
            }
        }

    } else if (code >= 49 && code <= 57) {
        $.mask.close();
        var childIndex = code - 49;
        if (childIndex < weiXinWheel[gap.data('parent')]) {
            gap.data('child', childIndex);
            $('span.child-index').html(chineseNumber[gap.data('child')]);
            secondSlide();
        }
    } else if (code == 83) { //s
        if (second.children().length > 0) {
            //if (confirm('确定重新加载?')) {
                second.empty();
                spreadNumbers();
           // }
        } else {
            if (first.height() == 0) {
                spreadNumbers();
            }
        }
        window.adwardData = "";
        //获取中奖结果
        $.ajax({
            dataType:'jsonp',
            url: serverInfo.serverUrl + ":" + serverInfo.serverHttpPort + '/getUserInfoForWeb?callback=?&action=getAwardUserForTicket&ranking=' + (gap.data('parent') + 1) + '&wheelNum=' + (gap.data('child') + 1),
            success:function(data){
                window.adwardData = data;
            }

        })
    }else if(code == 80) {
        //p
        select();
        setTimeout(function(){
            stop();
        },300);
    }else if(code == 82) {
        //s
        select();
    }else if(code == 87){ //w  切换到微信抽奖
        window.location.href = "/";
    }
});


//noinspection JSUnusedGlobalSymbols
/***************************函数********************************/

// dataList = [1,2,2,1]
function getSelectAllInfo(data) {
    //noinspection JSUnresolvedVariable
    weiXinWheel = data.awardInfo;
    //noinspection JSUnresolvedVariable
    userNumbers = convertToArray(data.tickets);

    main.itemW = Math.max(Math.floor((1220 * 610 / userNumbers.length)/(main.itemH+4)) - 4,31);
    //alert(main.itemW);
}


function secondSlide() {
    first.css({
        height: '200%'
    });
    second.empty();
    first.animate({
        height: 0
    });
    var data = localStorage.getItem(makeString(gap));
    if(data) {
        var array = JSON.parse(data);
        second.html($('<div class="award-number"></div>').html(  ("<span>"+array.join('</span><span>')+"</span>" )  ));
    }
}

function spreadNumbers() {
    var list = shuffle(userNumbers);
    for (var i = 0; i < list.length; i++) {
        second.append($('<div class="number">.</div>').css({
            height: main.itemH,
            width: main.itemW,
            transform: 'none',
            lineHeight: main.itemH + 'px'
        }).attr('id', 'id' + list[i])).data('index', list[i]);
    }
    divNumbers = second.children();

    var _counter = 0;
    var shuffleArray = shuffle($.makeArray(divNumbers));
    spreadNumberTimer = setInterval(function () {
        if (_counter % main.spreadEffectGap == 0) {
            effectNumber($(shuffleArray[_counter]));
        } else {
            normalNumber($(shuffleArray[_counter]));
        }
        _counter++;

        if (_counter >= divNumbers.length) {
            clearInterval(spreadNumberTimer);
        }
    }, main.spreadNumberDuring);

}

function effectNumber(element) {
    element.html(element.attr('id').replace('id', '')).css({
        transform: 'scale(' + main.spreadEffectScale + ',' + main.spreadEffectScale + ')',
        opacity: 1
    });
    setTimeout(function () {
        element.css({
            transform: 'none'
        });
    }, main.spreadEffectDuring);

}

function normalNumber(element) {
    element.html(element.attr('id').replace('id', '')).css({
        transform: 'none'
    }).animate({
        opacity: 1
    }, main.spreadEffectDuring / 10);
}

var selectBefore = 0;
function select() {
    if(!divNumbers)
        return;
    clearInterval(selectTimer);
    divNumbers.css({
        transform: 'none'
    });
    selectTimer = setInterval(function(){
        var index = Math.floor(Math.random() * 10000 % divNumbers.length);
        divNumbers.eq(selectBefore).css({
            transform: 'none'
        });
        divNumbers.eq(index).css({
            transform: 'scale(' + (main.selectRunningScale+7) + ',' + (main.selectRunningScale+7) + ')'
        });
        selectBefore = index;
    },main.selectDuring);
}

function stop(){
    if(!divNumbers)
        return;
    if(window.adwardData){
        setStopNumber(window.adwardData);
    }else{
        $.ajax({
            dataType:'jsonp',
            url: serverInfo.serverUrl + ":" + serverInfo.serverHttpPort + '/getUserInfoForWeb?callback=setStopNumber&action=getAwardUserForTicket&ranking=' + (gap.data('parent') + 1) + '&wheelNum=' + (gap.data('child') + 1)
        })
    }

}

//新的显示中奖结果函数，解决居中和显示问题
function setStopNumber(list) {
    clearInterval(selectTimer);
    divNumbers.eq(selectBefore).css({
        transform: 'none'
    });

    localStorage.setItem(makeString(gap), JSON.stringify(list));


    var _counter = 0;

    var margin  = 16;//间距
    var hNum = 0,
        totalH = 1;

    if(list.length>6){
        if(list.length<12){
            hNum = Math.ceil(list.length/2);
            totalH = 2;
        }else{
            totalH = Math.ceil(list.length/6);
            hNum = 6;
        }
    }else{
        hNum = list.length;
    }


    var dashBoardOffset = second.offset(),
        dashBoardSizeW = second.width(),
        dashBoardSizeH = second.height(),
        imgSize = 40,
        runningScale = (main.runningScaleToSize/imgSize),//Math.round
        imgToSize = runningScale*imgSize;//+2*settings.runningScale;

    var marginLR = dashBoardOffset.left + imgToSize/2+ imgSize/ 2 + (dashBoardSizeW-hNum*(imgToSize+margin)-margin)/2,
        marginT = dashBoardOffset.top + imgToSize/2+imgSize/2  + (dashBoardSizeH-totalH*(imgToSize+margin-20)-margin-20)/2;
        //realPosOffsetX = imgToSize/2-settings.imageSize/ 2,//真正的位置相对缩放的偏移量  X减去这个系数  Y加上下面的系数
        //realPosOffsetY = imgToSize/2+settings.imageSize/ 2;
    var stopTimer = setInterval(function () {
        var id = 'id' + list[_counter];
        var element = divNumbers.filter('#' + id);

        var left = marginLR + (_counter % hNum) * (imgToSize+margin);
        var top = marginT + (Math.floor(_counter/hNum) ) * (imgToSize+margin-20);
        element.css({
            transform: 'scale(' +runningScale + ',' + runningScale+ ')',
            left:$(element).offset().left,
            top:$(element).offset().top,
            position:'absolute',
            margin:0
        }).animate({
            left: left,
            top: top
        }).addClass('selected-number');


        _counter++;
        if (_counter >= list.length) {
            clearInterval(stopTimer);
        }
    }, main.selectDuring);


    setTimeout(function(){
        $('div.selected-number').expose({color:'#000',closeOnEsc: false, closeOnClick: false});
    },main.selectDuring * (list.length + 1));
}
//noinspection JSUnusedGlobalSymbols  这是之前老得代码，会出现不自动居中显示中奖结果，甚至有可能出现显示位置不可见等问题
function setStopNumber2(list) {
    clearInterval(selectTimer);
    divNumbers.eq(selectBefore).css({
        transform: 'none'
    });
    localStorage.setItem(makeString(gap), JSON.stringify(list));
    var _counter = 0;
    var left = second.offset().left;
    var top = second.offset().top;


    var realSize = main.itemW * main.selectRunningScale + 5;
    var colNum = 4;
    var colCount = list.length%colNum;
    var colLength = Math.ceil(list.length/colNum);
    var norCol = Math.floor(list.length/colNum);
    var norCount = norCol*colNum;
    var notNorCount = (colNum - colCount);
    var centLeft = notNorCount*realSize/2;
    var centTop = (563-colLength*(realSize+20))/2

    var stopTimer = setInterval(function () {
        var id = 'id' + list[_counter];
        var element = divNumbers.filter('#' + id);

        var norTop = top + realSize / 2 + Math.floor(_counter / colNum) * realSize + Math.floor(_counter / colNum) * 10;
        var norLeft = left + realSize / 2 + _counter % colNum * realSize + _counter % colNum * 10;
        element.css({
            transform: 'scale(' + main.selectRunningScale + ',' + main.selectRunningScale + ')',
            position: 'absolute',
            left: element.offset().left,
            top: element.offset().top
        }).addClass('selected-number').animate({
            top: centTop+norTop ,
            left: (_counter+1>norCount)  ? centLeft+norLeft :  130+norLeft
        });
        //debugger
        _counter++;
        if (_counter >= list.length) {
            clearInterval(stopTimer);
        }
    }, main.selectDuring);
    setTimeout(function(){
        $('div.selected-number').expose({color:'#000',closeOnEsc: false, closeOnClick: false});
    },main.selectDuring * (list.length + 1));
}

function makeString(gap) {
    return 's_' + gap.data('parent') + '_' + gap.data('child');
}







