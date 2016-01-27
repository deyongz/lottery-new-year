var db = require("pubDB");
var funs = {
    addOrder : function(){
        db.run("insert into orderList (sum,date,type,fee,remark) values (300,1111,2,10,'hello world')")
    },
    deleteOrderById : function(){

    },
    updateOrderById : function(){

    }
}