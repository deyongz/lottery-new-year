var front = $('div.front');
var dashboards = front.children();
var imageTopDiv = dashboards.filter('.first');
var imagesDashBoard = dashboards.filter('.second');
var items;
var addImageTimer;
var selectTimer;
var weixinWheelArray;


window.splitStr = function (txt, length) {
    if (txt === undefined || txt === null || !length) {
        return '';
    }
    var charLen = 0,splitAtLength = 0,isNeedSplit;
    for (var i = 0; i < txt.length; i++) {
        var c = txt.charCodeAt(i);//转换成字节
        if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {//单字节加1
            charLen++;
        } else {
            charLen += 2;
        }
        if (charLen <= length) {
            splitAtLength++;
        }else if(charLen>length+3){
            isNeedSplit = true;
            break;
        }
    }
    return isNeedSplit ? (txt.substring(0, splitAtLength) + "...") : txt;
};


var settings = $.extend({
    localStorageUrls:'images',//localStorage  的保存头像url 名字
    totalImages: 500,//总计的图片数目
    imageTransition: 70,//加载后返回正确尺寸的延时变量
    imageSize: 27,//正方形图片的高宽//会根据个数来自动计算
    imageStepInDuring: 1,//每多少毫秒加载一张图片
    scaleSize: 6,//进入加载时候放大倍数
    showImageThumbCount: 10,//没各多少张缩小
    imgDivTransformScale: 5,//按键Z对应的放大缩小倍数,好让观众看见图片的内容
    selectDuring: 50,//转盘转动后没各多少时间进行下一个图片选择
    runningScale: 4,//图片停止后显示倍数
    runningScaleToSize : 150,//图片停止后显示到对应的尺寸，不用上面的runningScale
    stopOpacity: .99,//图片停止后显示的透明度
    counterForImage:0,//作为
    initPercent:30,
    percentAdd:17
});


/***********temp start **********/

function process(data) {
    var tempArray = [];
    $.each(data,function(key,item){
        tempArray[tempArray.length] = item;//item['headimgurl'];
    });
    var imagesUrls = tempArray;
    var length = imagesUrls.length;
    var sets = [];
    for (var i = 0; i < length; i++) {
        settings.imageSize = Math.floor(Math.sqrt(1242 * 610 / length)) - 6;
        if(settings.imageSize%2==1){settings.imageSize+=1;}
        imagesDashBoard.append($('<div class="item"></div>').css({
            height:  settings.imageSize,
            width:  settings.imageSize
        }));
        sets[i] = i;
        weightMap[i] = i;
    }
    items = imagesDashBoard.children();
    sets = shuffle(sets);
    var counter = 0;
    addImageTimer = setInterval(function () {
        var userInfo = imagesUrls[sets[counter]];
        if(userInfo.headimgurl_localbig){
            userInfo.headimgurl = serverInfo.serverUrl + ":" + serverInfo.serverHttpPort+"/"+userInfo.headimgurl_localbig;
        }
        if(!userInfo.headimgurl){
            userInfo.headimgurl = serverInfo.serverUrl + ":" + serverInfo.serverHttpPort+"/images/noHeadimg.jpg";
        }
        if (counter % settings.showImageThumbCount == 0)
            replaceImage(sets[counter], userInfo);
        else
            setImage(sets[counter], userInfo);
        counter++;
        if (counter == imagesUrls.length) {
            clearInterval(addImageTimer);
            setTimeout(function () {
                items = imagesDashBoard.children();
                console.log(items.length);
            }, 1000);
        }
    }, settings.imageStepInDuring);
}


function spreadHeads() {
    $.ajax({
        url:serverInfo.serverUrl + ":" + serverInfo.serverHttpPort + '/getUserInfoForWeb?callback=process&action=all',
        dataType:'jsonp'
    });
}



var weightMap = [];
/***********temp end **********/
$(function(){
    getWeiXinWheel();
});

$(window).mousewheel(function(e){
    e.preventDefault();
});

$(document).keydown(function(e){
    //e.preventDefault();
    var keycode = e.keyCode;
    if(keycode>= 49 && keycode <= 57) {
        $.mask.close();
    }
    console.log(keycode)
    switch (keycode) {

        case 38://up
            imageTopDiv.animate({
                height: '200%'
            }, function () {
                imagesDashBoard.empty();
            });

            break;
        case 40://down
            imageTopDiv.animate({
                height: 0
            }, function () {//spreadHeads();
            });
            break;
        case 37://left
            break;
        case 39://right
            break;
        case 83://S
            if (imagesDashBoard.children().length > 0) {
                //if (confirm('确定重新加载?')) {
                    imagesDashBoard.empty();
                    spreadHeads();
               // }
            } else {
                if(imageTopDiv.height() == 0)
                    spreadHeads();
            }
            break;
        case 80://Pause
            select();
            setTimeout(function(){
                stop();
            },300);
            break;
        case 82://run
            select();
            break;
        case 49://1
            if (weixinWheelArray.length > 0) {
                $('div.gap_lun').html('第一轮抽奖');
                $('#close-modal').click();
                imagesDashBoard.empty();
                imageTopDiv.css({height: '200%'}).animate({
                    height: 0
                }).data('index', 1);
                if (localStorage.getItem('reward1')) {
                    returnReward(JSON.parse(localStorage.getItem('reward1')));
                }
            }
            break;
        case 50://2
            if (weixinWheelArray.length > 1) {
                $('div.gap_lun').html('第二轮抽奖');
                $('#close-modal').click();
                imagesDashBoard.empty();
                imageTopDiv.css({height: '200%'}).animate({
                    height: 0
                }).data('index', 2);
                if (localStorage.getItem('reward2')) {
                    returnReward(JSON.parse(localStorage.getItem('reward2')));
                }
            }
            break;
        case 51://3
            if (weixinWheelArray.length > 2) {
                $('div.gap_lun').html('第三轮抽奖');
                $('#close-modal').click();
                imagesDashBoard.empty();
                imageTopDiv.css({height: '200%'}).animate({
                    height: 0
                }).data('index', 3);
                if (localStorage.getItem('reward3')) {
                    returnReward(JSON.parse(localStorage.getItem('reward3')));
                }
            }
            break;
        case 52://4
            if (weixinWheelArray.length > 3) {
                $('div.gap_lun').html('第四轮抽奖');
                $('#close-modal').click();
                imagesDashBoard.empty();
                imageTopDiv.css({height: '200%'}).animate({
                    height: 0
                }).data('index', 4);
                if (localStorage.getItem('reward4')) {
                    returnReward(JSON.parse(localStorage.getItem('reward4')));
                }
            }
            break;
        case 53://5
            if (weixinWheelArray.length > 4) {
                $('div.gap_lun').html('第五轮抽奖');
                $('#close-modal').click();
                imagesDashBoard.empty();
                imageTopDiv.css({height: '200%'}).animate({
                    height: 0
                }).data('index', 5);
                if (localStorage.getItem('reward5')) {
                    returnReward(JSON.parse(localStorage.getItem('reward5')));
                }
            }
            break;
        case 54://6
            if (weixinWheelArray.length > 5) {


                $('div.gap_lun').html('第六轮抽奖');
                $('#close-modal').click();
                imagesDashBoard.empty();
                imageTopDiv.css({height: '200%'}).animate({
                    height: 0
                }).data('index', 6);
                if (localStorage.getItem('reward6')) {
                    returnReward(JSON.parse(localStorage.getItem('reward6')));
                }
            }
            break;
        case 55://7
            if (weixinWheelArray.length > 6) {
                $('div.gap_lun').html('第七轮抽奖');
                $('#close-modal').click();
                imagesDashBoard.empty();
                imageTopDiv.css({height: '200%'}).animate({
                    height: 0
                }).data('index', 7);
                if (localStorage.getItem('reward7')) {
                    returnReward(JSON.parse(localStorage.getItem('reward7')));
                }
            }
            break;
        case 56://8
            if (weixinWheelArray.length > 7) {
                $('div.gap_lun').html('第八轮抽奖');
                $('#close-modal').click();
                imagesDashBoard.empty();
                imageTopDiv.css({height: '200%'}).animate({
                    height: 0
                }).data('index', 8);
                if (localStorage.getItem('reward8')) {
                    returnReward(JSON.parse(localStorage.getItem('reward8')));
                }
            }
            break;
        case 57://9
            if (weixinWheelArray.length > 8) {
                $('div.gap_lun').html('第九轮抽奖');
                $('#close-modal').click();
                imagesDashBoard.empty();
                imageTopDiv.css({height: '200%'}).animate({
                    height: 0
                }).data('index', 9);
                if (localStorage.getItem('reward9')) {
                    returnReward(JSON.parse(localStorage.getItem('reward9')));
                }
            }
            break;
        case 189:// -
            if (confirm('确认删除中奖名单?')) {
                clear();
            }
            break;
        case 67://c
            //$('#trigger').click();
            break;
        case 87://w  微信抽奖
            break;
        case 72: //h  号码抽奖
            window.location.href = "/ticket/";
            break;
    }
});


//noinspection JSUnusedGlobalSymbols
function spreadHeads_() {
    var imagesUrls = JSON.parse(localStorage.getItem(settings.localStorageUrls));
    var length = imagesUrls.length;
    var sets = [];
    for (var i = 0; i < length; i++) {
        imagesDashBoard.append($('<div class="item"></div>').css({
            height: settings.imageSize,
            width: settings.imageSize
        }));
        sets[i] = i;
        weightMap[i] = i;
    }
    items = imagesDashBoard.children();
    sets = shuffle(sets);
    var counter = 0;
    addImageTimer = setInterval(function () {
        if (counter % settings.showImageThumbCount == 0)
            replaceImage(sets[counter], imagesUrls[counter]);
        else
            setImage(sets[counter], imagesUrls[counter]);
        counter++;
        if (counter == items.length) {
            console.log(items.length);
            clearInterval(addImageTimer);
        }
    }, settings.imageStepInDuring);
}
var _weightBefore = 0;
function select() {
    if(!items)
        return;
    clearInterval(selectTimer);
    $.mask.close();
    items.css({
        transform: 'none'
    });
    selectTimer = setInterval(function(){
        var rand = Math.floor(Math.random() * 10000 * weightMap.length);
        var index = rand % weightMap.length;
        items.eq(weightMap[_weightBefore]).css({
            transform: 'none'
        });
        items.eq(weightMap[index]).css({
            transform: 'scale(' + (settings.runningScale+7) + ',' + (settings.runningScale+7) + ')'
        });
        _weightBefore = index;
    },settings.selectDuring);
}

function stop(){
    if(!items)
        return;
    $.ajax({
        url:serverInfo.serverUrl + ":" + serverInfo.serverHttpPort + '/getUserInfoForWeb?callback=setStopImg&action=getAwardUserForWeixin&wheelNum='+imageTopDiv.data('index'),
        dataType:'jsonp'
    });
}

//noinspection JSUnusedGlobalSymbols
function setStopImg(data){
    clearInterval(selectTimer);
    items.css({
        transform: 'none'
    });
    var array = [];
    $.each(data, function (key, item) {
        var data = items.filter('#'+key).data('data');
        array[array.length] = {
            id: key,
            msg: item['lastMessage'],
            src:data['headimgurl'],
            nickname:data['nickname']
        };
    });
    localStorage.setItem('reward' + imageTopDiv.data('index'), JSON.stringify(array));
    var counter = 0;
    if(array.length) {
        var margin  = 30;//间距
        var hNum = 0,
            totalH = 1;

        if(array.length>6){
            if(array.length<12){
                hNum = Math.ceil(array.length/2);
                totalH = 2;
            }else{
                totalH = Math.ceil(array.length/6);
                hNum = 6;
            }
        }else{
            hNum = array.length;
        }


        var dashBoardOffset = imagesDashBoard.offset(),
            dashBoardSizeW = imagesDashBoard.width(),
            dashBoardSizeH = imagesDashBoard.height(),
            runningScale = (settings.runningScaleToSize/settings.imageSize),//Math.round
            imgToSize = runningScale*settings.imageSize;//+2*settings.runningScale;

        var marginLR = dashBoardOffset.left + imgToSize/2+ settings.imageSize/ 2 + (dashBoardSizeW-hNum*(imgToSize+margin)-margin)/2,
            marginT = dashBoardOffset.top + imgToSize/2+settings.imageSize/2  + (dashBoardSizeH-totalH*(imgToSize+margin+26)-margin-26)/2,
            realPosOffsetX = imgToSize/2-settings.imageSize/ 2,//真正的位置相对缩放的偏移量  X减去这个系数  Y加上下面的系数
            realPosOffsetY = imgToSize/2+settings.imageSize/ 2;

        var timer = setInterval(function () {
            var element = items.filter('#'+array[counter]['id']);

            var left = marginLR + (counter % hNum) * (imgToSize+margin);
            var top = marginT + (Math.floor(counter/hNum) ) * (imgToSize+margin+26);//26是字容器的高度
            element.css({
                transform: 'scale(' +runningScale + ',' + runningScale+ ')',
                left:$(element).offset().left,
                top:$(element).offset().top,
                position:'absolute',
                margin:0
            }).animate({
                left: left,
                top: top
            }).addClass('selected');

            var appendDiv = $('<div></div>').css({
                position: 'absolute',
                left: left - realPosOffsetX,
                top: top+realPosOffsetY,
                background:'#fff',
                fontSize:20,
                width:imgToSize,
                height:26
            }).addClass('selected appendix').html(element.data('data')['nickname']);
            element.after(appendDiv);

            counter ++;
            if(counter >= array.length) {
                clearInterval(timer);
                var modal = $('#myModal');
                modal.find('.modal-body').empty();
                for (var i = 0; i < array.length; i++) {
                    var data = items.filter('#' + array[i]['id']).data('data');
                    modal.find('.modal-body').append(
                            $('<img/>').attr('src', data['headimgurl']).css({
                                height: settings.imageSize,
                                width: settings.imageSize
                            })
                        ).append(
                            $('<span></span>').html(data['nickname'])
                        );
                }

            }
        }, settings.selectDuring);

        setTimeout(function(){
            $('div.selected').expose({color:'#000',closeOnEsc: false, closeOnClick: false});
        },settings.selectDuring * (array.length + 1));
    }

}


function replaceImage(index, item) {
    items.eq(index).css({
        background: 'url("' + item['headimgurl'] + '")',
        backgroundSize: '100%',
        opacity: 1,
        transform: 'scale(' + settings.scaleSize + ',' + settings.scaleSize + ')'
    }).data('data',item).attr('id',item['key']);
    setTimeout(function () {
        items.eq(index).css({
            transform: 'none'
        });
    }, settings.imageTransition);
}

function setImage(index, item) {
    items.eq(index).css({
        background: 'url("' + item['headimgurl'] + '")',
        backgroundSize: '100%',
        transform: 'none'
    }).data('data',item).attr('id',item['key']).animate({
        opacity: 1
    }, settings.imageTransition);
}


function clear() {
    for (var i = 1; i < 10; i++) {
        localStorage.removeItem('reward' + i);
    }
}

function returnReward(data) {
    $.each(data, function (key, item) {
        var html = "<div class='reward'><img src='"+item['src']+"' /><div><span class='award-nickname'>"+item['nickname']+"</span><br/><span class='award-msg'>"+splitStr(item['msg'],58)+"</span></div></div>"
        imagesDashBoard.append(html);
    });
}

function getWeiXinWheel() {
    $.ajax({
        url:serverInfo.serverUrl + ":" + serverInfo.serverHttpPort + '/getUserInfoForWeb?callback=weixinWheel&action=getWeixinWheel',
        dataType:'jsonp'
    })
}

function weixinWheel(data) {
    weixinWheelArray = data;
}


//队列加载头像  先加载所有头像，再到队列定时拉头像
$.ajax({
    url: serverInfo.serverUrl + ":" + serverInfo.serverHttpPort + '/getUserInfoForWeb?callback=loadAllUserHeadimg&action=all&time='+new Date().getTime(),
    dataType:'jsonp'
});

var imgList = [];
function preloadImage(data) {
    $.each(data,function(key,item){
        var imgUrl;
        if(item.headimgurl_localbig){
            imgUrl = serverInfo.serverUrl + ":" + serverInfo.serverHttpPort+"/"+item.headimgurl_localbig;
        }else{
            imgUrl = item['headimgurl'];
        }
        imgList[imgList.length] = $('<img class="hide"/>').attr('src',imgUrl);
    });
}
function loadAllUserHeadimg(data){
    preloadImage(data);
    setInterval(function(){
        $.ajax({
            url: serverInfo.serverUrl + ":" + serverInfo.serverHttpPort + '/getUserInfoForWeb?callback=preloadImage&time='+new Date().getTime(),
            dataType:'jsonp'
        });
    },3000);
}