//http://javascript.crockford.com/inheritance.html
//Douglas Crockford
//一个简单的辅助函数，允许你为对象的原型绑定新的函数
Function.prototype.method = function(name, func) {
    this.prototype[name] = func;
    return this;
};
//一个(相当复杂的)函数，允许你优雅地从其它对象中继承函数，
//同时仍能调用"父"对象的函数
Function.method('inherits', function(parent) {
    //追踪所处的父级深度
    //Keep track of how many parent-levels deep we are
    var depth = 0;
    //继承 parent 的方法
    //Inhert the parent's methods
    var proto = this.prototype = new parent();

    //创建一个名为 uber 的新的特权方法，
    //调用它可以执行在继承中被覆盖的任何函数
    //Create a new 'priveledged' function called 'uber', that when called
    //executes any function that has been written over in the inheritance
    this.method('uber', function uber(name) {

        var func; //将被执行的函数(The function to be execute)
        var ret; // 该函数的返回值(the return value of then function)
        var v = parent.prototype; //父类的 prototype(The parent's prototype)
        //如果已经位于另一"uber"函数内
        //If we're already within another 'uber' function
        if (depth) {
            //越过必要的深度以找到最初的 prototype
            //Go the necessary depth to function the orignal prototype
            for ( var i = d; i > 0; i += 1 ) {
                v = v.constructor.prototype;
            }

            //并从该 prototype 取得函数
            //and get the functin from that prototype
            func = v[name];

            //否则，这是第一级的 uber 调用
            //Otherwise, this is the first 'uber' call
        } else {
            //从 prototype 中取得函数
            //Get the function to execute from the prototype
            func = proto[name];

            //如果该函数属于当前的 prototype
            //If the function was a part of this prototype
            if ( func == this[name] ) {
                //则转入 parent 的 prototype 替代之
                //Go to the parent's prototype instead
                func = v[name];
            }
        }

        //记录我们位于继承栈中的'深度'
        //Keep track of how 'deep' we are in the inheritance stack
        depth += 1;

        //使用用第一个参数后面的所有参数调用该函数
        //(第一个参数保有我们正在执行的函数的名称)
        //Call the function to execute with all the arguments but the first
        //(whick holds the name of the function that we're executing)
        ret = func.apply(this, Array.prototype.slice.apply(arguments, [1]));

        //重置栈深度
        //Reset the stack depth
        depth -= 1;

        //返回执行函数的返回值
        //Return the return value of the execute function
        return ret;
    });
    return this;
});
//一个用来仅继承父对象中的几个函数的函数，
//而不是使用 new parent()继承每一个函数
Function.method('swiss', function(parent) {
    //遍历所有要继承的方法
    for (var i = 1; i < arguments.length; i += 1) {
        //要导入的方法名
        var name = arguments[i];

        //将方法导入这个对象的 prototype
        this.prototype[name] = parent.prototype[name];
    }
    return this;
});




//创建一个新的 Person 对象构造器
function Person( name ) {
    this.name = name;
}
//给 Person 对象添加方法
Person.method( 'getName', function(){
    return name;
});
//创建新一个新的 User 对象构造器
function User( name, password ) {
    this.name = name;
    this.password = password;
}
//从 Person 对象继承所有方法
User.inherits( Person );
//给 User 对象添加一个新方法
User.method( 'getPassword', function(){
    return this.password;
});
//重写新 Person 对象创建的方法,
//但又使用 uber 函数再次调用它
User.method( 'getName', function(){
    return "My name is: " + this.uber('getName');
});