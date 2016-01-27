var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./countSite.sqlite');
console.log(db)
//db.run("insert into orderList (sum,date,type,fee,remark) values (300,1111,2,10,'hello world')")
//db.run("delete from orderList where id = 2");
//db.each("SELECT * FROM orderList", function(err, row) {
//    console.log(row.id + ": " + row.sum);
//});
//GLOBAL.DB = db;
module.exports = db;