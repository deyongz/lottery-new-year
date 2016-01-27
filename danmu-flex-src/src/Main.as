

package
{
	import flash.display.Loader;
	import flash.display.MovieClip;
	import flash.display.NativeWindow;
	import flash.display.NativeWindowInitOptions;
	import flash.display.NativeWindowSystemChrome;
	import flash.display.NativeWindowType;
	import flash.display.Screen;
	import flash.display.StageAlign;
	import flash.display.StageScaleMode;
	import flash.events.Event;
	import flash.events.HTTPStatusEvent;
	import flash.events.IOErrorEvent;
	import flash.events.MouseEvent;
	import flash.events.SecurityErrorEvent;
	import flash.events.TimerEvent;
	import flash.net.URLLoader;
	import flash.net.URLLoaderDataFormat;
	import flash.net.URLRequest;
	import flash.net.URLRequestMethod;
	import flash.net.URLVariables;
	import flash.utils.Timer;
	
	import mx.events.FlexEvent;
	
	import spark.components.Group;
	import spark.components.Image;
	import spark.components.Label;
	import spark.components.WindowedApplication;
	

	//import spark.components.;

	public class Main extends MovieClip
	{
		public var nativewindow:NativeWindow;
		private var mainWindow:WindowedApplication;
		private var getDataTimer : Timer;
		private var messageQueue : Array = new Array(
			/*
			{"nickname":"邹德永","msg":"新年快乐！","headimgurl":"http://wx.qlogo.cn/mmopen/ajNVdqHZLLCicbVITnrxWgTkkyCLCYnk9VXvb7FHWEICicwDNqiaEUbyZOu9rJicianb360FoonsXqeclUFibf1uLL5Q/0"},
			{"nickname":"deyongz2","msg":"来年发大财！","headimgurl":"http://wx.qlogo.cn/mmopen/ajNVdqHZLLCicbVITnrxWgTkkyCLCYnk9VXvb7FHWEICicwDNqiaEUbyZOu9rJicianb360FoonsXqeclUFibf1uLL5Q/0"}
			*/
			); 
		private var screenWidth : Number;
		private var screenHeight : Number;
		private var moveStep : Number = 4;
		private var labelArray : Array = new Array();
		private var labelArrayCache : Array = new Array();
		private var batchShowing : Boolean = false;
		private var _pause : Boolean = false;
		private var batchMoveStep : Number = 5;
		private var laveMessageNumLabel:Label;
		private var _canMove : Boolean = false;
		private var _serverUrl : String;
		private var imagesCache : Object = new Object();
		private var _hPos : int = 0;//弹幕垂直位置百分数
		private var _fontSize:int = 24;
		private var _headImgSize : int = 30;
		private var _nameColor : int = 0x000000;
		private var _contentColor : int = 0xff0000;
		private var _batchShowStoping:Boolean = false;
		//server request
		private var request:URLRequest;
		private var loader:URLLoader;
		public function Main(mainWindow:WindowedApplication,laveMessageNumLabel:Label)
		{
			var i:int;
			
			this.mainWindow = mainWindow;
			
			this.laveMessageNumLabel = laveMessageNumLabel;
			//一开始就创建一堆label待用，后面用的时候创建 会创建不成功，待解决
			for(i=0;i<150;i++){
				this.buildLabel();
			}
			
			this.initNativeWindow();
			var screenIndex : int = Screen.screens.length>1 ? 1 : 0;
			this.showNativeWindow(screenIndex);
			this.initFrameMove();
			
			this.wheelGetDataInit();
			
			this.startOneMessageMove();
			this.initHttpRequest();
			
			
			//nativewindow.stage.addChild(test2);
			
			
			this.switchScreenView(screenIndex);
		}
		//
		public function simulationData():void{
			var i:int;
			
			for(i=0;i<1000;i++){
			var obj:Object;
			if(i%2==0)
				obj = {"nickname":"deyongz","msg":"hello world;阿里山的积分卡拉斯的减肥了卡机是对方考虑按时；打饭卡上","headimgurl":"http://wx.qlogo.cn/mmopen/ajNVdqHZLLCicbVITnrxWgTkkyCLCYnk9VXvb7FHWEICicwDNqiaEUbyZOu9rJicianb360FoonsXqeclUFibf1uLL5Q/0"};
			else
				obj = {"nickname":"deyongz","msg":"hello world;短一点的文字","headimgurl":"http://wx.qlogo.cn/mmopen/ajNVdqHZLLCicbVITnrxWgTkkyCLCYnk9VXvb7FHWEICicwDNqiaEUbyZOu9rJicianb360FoonsXqeclUFibf1uLL5Q/0"};
			
			obj.user = obj.user+i;
			messageQueue.push(obj);
			}
		}
		
		static private function test(l:Label,s:String):void
		{
			l.text = s;
		}
		private function initNativeWindow():void
		{
			var options:NativeWindowInitOptions = new NativeWindowInitOptions(); 
			options.transparent = true; //实现窗口背景透明
			options.systemChrome = NativeWindowSystemChrome.NONE; //是否有关闭 最小化的title
			options.type = NativeWindowType.LIGHTWEIGHT; //任务栏是否有选项，对于有多窗口任务栏的系统有效
			//create the window 
			nativewindow = new NativeWindow(options); 
			nativewindow.title = "聚美优品弹幕窗口"; 
			//nativewindow.stage.color = 0xff0000;
			nativewindow.stage.scaleMode = StageScaleMode.NO_SCALE;
			nativewindow.stage.align = StageAlign.TOP_LEFT;
			nativewindow.alwaysInFront = true;
			//this.nativeWindow.close() 
			
			//nativewindow.stage.addChild();
			nativewindow.stage.addEventListener(MouseEvent.MOUSE_DOWN,mousedownHandle);
		}
		public function set canMove(isCanMove:Boolean):void{
			_canMove = isCanMove;
		}
		public function get canMove():Boolean{
			return this._canMove;
		}
		private  function mousedownHandle(e:MouseEvent):void{
			if(_canMove)
				nativewindow.startMove();
		}
		public function showNativeWindow(screenIndex:int):void
		{
			var screens:Array = Screen.screens;
			var screenInfo:Screen = screens[screenIndex];
			if(!nativewindow){return;}
			//screenWidth = Capabilities.screenResolutionX;
			//screenHeight = Capabilities.screenResolutionY;
			screenWidth = screenInfo.visibleBounds.width;
			screenHeight = screenInfo.visibleBounds.height;
			nativewindow.width = screenWidth;
			nativewindow.height = screenHeight;
			nativewindow.x = screenInfo.visibleBounds.left;//0;//screenWidth+100;
			nativewindow.y = screenInfo.visibleBounds.top;
			nativewindow.activate();
		}
		private function initFrameMove():void{
			addEventListener(Event.ENTER_FRAME, animateBall);
			//var time:Timer = new Timer(1);
			//time.addEventListener(TimerEvent.TIMER,animateBall);
			//time.start();
			function animateBall(e:Event):void{
				for(var i:int; i<labelArray.length; i++){
					var label : Group = labelArray[i];
					
					if(_pause){//如果暂停显示，清屏  把所有label回收缓存
						label.visible = false;
						label.x = screenWidth;
						label.visible = false;
						labelArrayCache.push(label);
						labelArray.splice(i,1);
					}else{
						if(!batchShowing && i+1==labelArray.length && (label.x+label.width+50)<screenWidth){ //如果单行模式 是最后一个全部移动到屏幕中去了，再紧跟着添加一个
							//trace("last move out")
							startOneMessageMove();
						}
						
						if(batchShowing && !_batchShowStoping){ //如果批量模式 每行最后一个全部移入屏幕，在此行后面再添加一个
							var moveNum:int = label.x+label.width+50;
							//trace(moveNum)
							if(screenWidth>=moveNum && screenWidth-batchMoveStep<moveNum){
								var fontColor:Number =  Math.floor(Math.random()*0xffffff);
								addOneMessageToScreen(fontColor,screenWidth,label.y);
							}
						}
						
						if(label.x<-label.width){ //如果移动完成了 回收
							//trace(i+"-index is moveOver");
							label.visible = false;
							labelArrayCache.push(label);//用完后的label回收到缓存
							labelArray.splice(i,1);
						}else{ //如果没有移动完成，继续移动
							label.x = label.x-(batchShowing ? batchMoveStep : moveStep);
						}
						
					}
					
				}
				if(batchShowing&&labelArray.length<=0){//如果在批量模式下 没有可视元素 表示没有数据了，自动变成不是批量显示
					batchShowing = false;
					_batchShowStoping = false;
				}
			}
		}
		private function clearScreen():void{
			for(var i:int; i<labelArray.length; i++){
				var label : Group = labelArray[i];
				label.visible = false;
				label.x = screenWidth;
				label.visible = false;
				labelArrayCache.push(label);
				labelArray.splice(i,1);
			}
		}
		private function wheelGetDataInit():void
		{
			getDataTimer = new Timer(2000);
			getDataTimer.addEventListener(TimerEvent.TIMER,this.onTimer);
			getDataTimer.start();
		}
		//轮询获取服务器消息
		private function onTimer(evt:TimerEvent):void
		{
			//如果正在移动的label没有了，再往里面添加
			if(!labelArray.length && !batchShowing){
				this.startOneMessageMove();
			}
			if(!_serverUrl)return;
			try
			{
				loader.load(request);
			}
			catch (error:Error)
			{
				trace("Unable to load URL");
			}
			
			
		}
		//队列获取一条消息
		private function getAMessage():Object
		{
			if(messageQueue.length>0){
				var message : Object = messageQueue[0];
				messageQueue.shift();
				return message;
			}else{
				return null;
			}
		}
		//创建一个label
		private function buildLabel():void{
			var group:Group = new Group();
			group.visible = false;
			
			var image : Image = new Image();
			image.width = _headImgSize;
			image.height = _headImgSize;
			group.addElement(image);
			
			var nameLabel:Label = new Label();
			nameLabel.setStyle("fontSize",_fontSize);
			//nameLabel.setStyle("fontWeight","bold");
			nameLabel.x = _headImgSize + 5;
			nameLabel.y = 3;
			group.addElement(nameLabel);
			
			var label2:Label = new Label();
			label2.setStyle("fontSize",_fontSize);
			//label2.x = 35;
			label2.y = 3;
			//label2.stage.align = StageAlign.LEFT;
			//label2.text = "123123123";
			group.addElement(label2);
			
			
			
			this.mainWindow.addElement(group);
			group.addEventListener(FlexEvent.CREATION_COMPLETE,cp);
			function cp(e:FlexEvent):void{
				nativewindow.stage.addChild(group);
				labelArrayCache.push(group);
				//trace("label width:"+label.width)
			}
		}
		private function getStringLength(thisString : String) : Number{
				var thisStringBytsLength : Number = 0;
				for( var i : Number = 0; i < thisString.length  ; i++ )                        {
					if(thisString.charCodeAt(i) >= 1000)
					{
						//说明该字符是中文
						thisStringBytsLength = thisStringBytsLength + 2;
					}
					else
					{
						//说明字符非中文
						thisStringBytsLength++;
					}
				}
				return thisStringBytsLength;
		}
		private function addOneMessageToScreen(fontColor:Number,x:Number,y:Number):void{
			if(this._pause){return;}
			if(!labelArrayCache.length){trace("labelArrayCache is none-----------");return;}
			this.laveMessageNumLabel.text = String(messageQueue.length);
			var message : Object = this.getAMessage();
			if(message){
				//trace("start a new message move");
				//从缓存拿一个label
				var group:Group = labelArrayCache[0];
				labelArrayCache.shift();
				
				var userNameLabel : Label = group.getElementAt(1) as Label;
				userNameLabel.x = _headImgSize + 5;
				userNameLabel.text = message.nickname+":";
				userNameLabel.setStyle("fontSize",_fontSize);
				userNameLabel.setStyle("color",_nameColor);
				
				var msgLabel : Label = group.getElementAt(2) as Label;
				msgLabel.text = message.msg;
				msgLabel.setStyle("color",fontColor);
				msgLabel.setStyle("fontSize",_fontSize);
				var txtLen : int = getStringLength(message.nickname);
				//trace("txtLen:"+txtLen);
				msgLabel.x = _headImgSize +29+txtLen*_fontSize/2;
				
				group.visible = true;
				
				
				
				//trace(userNameLabel.width);
				//msgLabel.x = message.nickname.length*24 + 35;
				group.x = x;
				group.y = y;
				labelArray.push(group);
				
				
				var urlStr : String;
				if(!_serverUrl || !message.headimgurl_local){
					urlStr = message.headimgurl;
				}else{
					urlStr = _serverUrl + "/" +message.headimgurl_local;
					//trace("local head img url--"+urlStr+"--\n")
				}
				
				var image : Image = group.getElementAt(0) as Image;
				image.width = _headImgSize;
				image.height = _headImgSize;
				if(imagesCache[urlStr]){
					image.source = imagesCache[urlStr];
				}else{
					try{ //图片加载不成功有网络抛出错误
						var loader: Loader = new Loader(); 
		                var urlRequest: URLRequest = new URLRequest(urlStr);   
		                loader.load(urlRequest);
		                loader.contentLoaderInfo.addEventListener(Event.COMPLETE,function(e:Event):void{
								imagesCache[urlStr] = e.target.content;
			                    image.source = e.target.content;
		                });
					}catch(e:Error){}
				}
				
			}else{
				//trace("have no message");
			}
			
		}
		private function startOneMessageMove():void{
			this.addOneMessageToScreen(_contentColor,screenWidth,Math.floor(_hPos/100*screenHeight) );
		}
		public function batchShowMessage2():void{
			if(this._pause){return;}
			clearScreen();
			var maxNum:Number = Math.min(messageQueue.length,40);
			this.batchShowing = true;
			for(var i:int=0;i<maxNum;i++){
				var posY:Number = Math.floor(Math.random()*screenHeight);
				var posX:Number = Math.floor(Math.random()*(screenWidth/2)+screenWidth);
				var fontColor:Number =  Math.floor(Math.random()*0xffffff);
				this.addOneMessageToScreen(fontColor,posX,posY);
			}
			
		}
		public function batchShowMessage():void{
			if(batchShowing){return;}
			if(this._pause){return;}
			this.batchShowing = true;
			_batchShowStoping = false;
			clearScreen();
			var posY : int = 0;
			while(1){
				if(messageQueue.length<=0){break;}
				var fontColor:Number =  Math.floor(Math.random()*0xffffff);
				this.addOneMessageToScreen(fontColor,screenWidth,posY);
				posY += _fontSize+22;
				if(posY>screenHeight-_fontSize){
					break;
				}
			}
		}
		public function stopBatchShow():void{
			if(!batchShowing){_batchShowStoping = false;return;}
			if(_batchShowStoping){return;}
			_batchShowStoping = true;
		}
		public function get batchShowStoping():Boolean{
			return _batchShowStoping;
		}
		public function set hPos(posNum : int):void{
			if(posNum<0 || posNum>100){return;}
			_hPos = posNum;
		}
		public  function set pause(b:Boolean):void{
			batchShowing = false;
			this._pause = b;
		}
		public function set batchMoveSpeed(speed:int):void{
			batchMoveStep = speed;
		}
		public function set moveSpeed(speed:int):void{
			moveStep = speed;
		}
		public function set fontSize(size:int):void{
			size = Math.max(12,size);
			size = Math.min(60,size);
			if(size%2==1){
				size+=1;
			}
			_headImgSize = size+6;
			this._fontSize = size;
		}
		public function set nameColor(color : int):void{
			_nameColor = color;
		}
		public function set contentColor(color : int):void{
			_contentColor = color;
		}
		public  function get pause():Boolean{
			return this._pause;
		}
		public function set serverUrl(url:String):void{
			_serverUrl = url;
			request.url = url+"/getMessageForSwf";
		}
		private function initHttpRequest():void{
			var requestVars:URLVariables = new URLVariables();
			requestVars.object_name = "key1";
			requestVars.cache = new Date().getTime();
			
			request = new URLRequest();
			//request.url = "http://vps.fy-rc.com:8080/getMessageForSwf";
			request.method = URLRequestMethod.GET;
			request.data = requestVars;
			
			for (var prop:String in requestVars) {
				trace("Sent " + prop + " as: " + requestVars[prop]);
			}
			
			loader = new URLLoader();
			loader.dataFormat = URLLoaderDataFormat.TEXT;
			loader.addEventListener(Event.COMPLETE, loaderCompleteHandler);
			loader.addEventListener(HTTPStatusEvent.HTTP_STATUS, httpStatusHandler);
			loader.addEventListener(SecurityErrorEvent.SECURITY_ERROR, securityErrorHandler);
			loader.addEventListener(IOErrorEvent.IO_ERROR, ioErrorHandler);
			
			var lastHttpBoom:Boolean = false;
			var lastHttpPause:Boolean = false;
			function loaderCompleteHandler(e:Event):void
			{
				trace(e.target.data);
				try{
					var obj : Object = JSON.parse(e.target.data); //{"messageList":[{nickname:"",headimgurl:"",msg:""}],"pauseView":false,"boom":false}
					if(obj.messageList && obj.messageList.length){
						
						for(var k:int=0;k<obj.messageList.length;k++){
							var newMsg:Object = obj.messageList[k] as Object;
							messageQueue.push(newMsg);
						}
						//var msgList:Array = obj.messageList as Array;
						//messageQueue.concat(msgList);
						//trace(obj.messageList.length);
					}
					if(obj.boom!=lastHttpBoom){
						lastHttpBoom = obj.boom;
						if(obj.boom){
							batchShowMessage();
						}else{
							stopBatchShow();
						}
					}
					
					if(lastHttpPause!=obj.pauseView){
						_pause = obj.pauseView;
						lastHttpPause = obj.pauseView;
					}
					
				}catch(e:Error){
					
				}
				
				//trace(obj.messageList.length)
				//trace(obj.pauseView);
				//trace(obj.boom);
				/*
				var variables:URLVariables = new URLVariables( e.target.data );
				if(variables.success)
				{
					trace(variables.path);     
				}
				*/
			}
			function httpStatusHandler (e:Event):void
			{
				//trace("httpStatusHandler:" + e);
			}
			function securityErrorHandler (e:Event):void
			{
				trace("securityErrorHandler:" + e);
			}
			function ioErrorHandler(e:Event):void
			{
				trace("ioErrorHandler: " + e);
			}

			
		}
		private function switchScreenView(screenIndex:int):void{ 
			var a:Array = Screen.screens;
			
		}
	}
}


