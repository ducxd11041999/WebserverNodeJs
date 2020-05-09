    
   	const PORT = 3000								//Đặt địa chỉ Port được mở ra để tạo ra chương trình mạng Socket Server
    var express = require("express");
    var app = express();
    app.use(express.static("./public"));
    var server = require("http").Server(app);
    var io = require("socket.io")(server);
    app.set("view engine","ejs");
    app.set("views","./views" )
    var ip = require("ip")
    var path = require('path');
    const mongoose =  require('mongoose')
    var mongo = require('mongodb');
    var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://localhost:27017/";

   
    
    //#Phải khởi tạo io sau khi tạo app!
    var bodyParser = require('body-parser');
    // parse application/json 
    app.use(bodyParser.json());
    var urlencodedParser = bodyParser.urlencoded({ extended: false })
    app.use(bodyParser.urlencoded({ extended: false }));

    /*Variable in server*/
    var dbo;
    var userDB = [];
    var ttemp;
    var preFan ="OFF" , preLight="OFF";
    var ttemp = 1;
    var flag_login = false ;
    var check_request = false;
    /*Connect data base*/
    MongoClient.connect(url, function(err, db) {
          if (err) throw err;
          dbo = db.db("local");
          dbo.collection("users").find({}).toArray(function(err, result) {
            if (err) throw err;
            console.log("database : " + result);
            userDB = result
            //db.close();
        });
    });
    /*get data Login*/
    app.post('/login',urlencodedParser ,function (req, res, next) {
        //console.log("alo");
        var body = req.body;
        var uname = body.uname;
        var password = body.psw;
        //console.log(uname);
        //console.log(password);
        var i;
   
        for( i =0 ; i<2 ; i++ )
        {
            if(uname == userDB[i].userName && password == userDB[i].password)
            {
                console.log(userDB[i].userName);
                var conditon = {userName:userDB[i].userName};
                var updateStatus = {$set: {status : 1}};
                dbo.collection("users").updateOne(conditon, updateStatus, function(err, res) {
                    console.log("Status update");
                });
                console.log(userDB[i].status);
                MongoClient.connect(url, function(err, db) {
                  if (err) throw err;
                  dbo = db.db("local");
                  dbo.collection("users").find({}).toArray(function(err, result) {
                    if (err) throw err;
                    console.log("database : " + result);
                    userDB = result
            //db.close();
                    });
                });
                res.render('Login',{status:userDB[i].status});  
                res.end();
                flag_login = true;
                break;
            }
            else
                flag_login = false;
        }
       if(flag_login == false)
        {
            //console.log(userDB[i].userName);
            for( i =0 ; i<2 ; i++ ){
                var conditon = { userName:userDB[i].userName};
                var updateStatus = {$set: {status : -1}};
                dbo.collection("users").updateOne(conditon, updateStatus, function(err, res) {
                    console.log("Status update");
                });
                
            }
            res.render('Login',{status:-1});  
            res.end();
        }
        
    });

    server.listen(PORT, function()
    {
        //alert(process.env.PORT)
        console.log("connected")
        console.log(ip.address())
    });										// Cho socket server (chương trình mạng) lắng nghe ở port 3484

 
    io.on("connection",function(socket)
    {
        console.log("đã nhảy dô đây")
        console.log(ip.address())
        console.log("Có người kết nối")
        socket.on("CLIENT-SEND-LIGHT-ON", function(data)
        {
            ttemp = ttemp + 1;
            preLight = "ON";
            console.log(ttemp);
            io.sockets.emit("SERVER-SEND-LIGHT-ON",{MODE:"lightOn",AR:"1"})
        });
        socket.on("CLIENT-SEND-LIGHT_OFF", function()
        {
            console.log("Ok light off");
            preLight = "OFF";
            io.sockets.emit("SERVER-SEND-LIGHT-OFF",{MODE:"lightOff",AR:"2"})
        });
        socket.on("CLIENT-SEND-FAN-OFF", function()
        {
            preFan = "OFF";
            io.sockets.emit("SERVER-SEND-FAN-OFF",{MODE:"fanOn",AR:"3"})
        });
        socket.on("CLIENT-SEND-FAN-ON", function()
        {
            preFan = "ON";
            io.sockets.emit("SERVER-SEND-FAN-ON",{MODE:"fanOff",AR:"4"})
        });
        socket.on("CLIENT-SEND-TEMP-HUM", function(data)
        {
            io.sockets.emit("SERVER-SEND-TEMP-HUM",{Temp:data.Temp, Humi: data.Humi,AR:"5"})
        });

    })
    app.get("/", function(req , res)
    {
            //console.log("setInterval");
            console.log("render Login");
            res.render(path.join(__dirname + '/views/Login.ejs'), {status:0 });
            
    });
     app.get("/login", function(req , res)
    {
            //console.log("setInterval");
            console.log("render Login");
            res.render(path.join(__dirname + '/views/Login.ejs'), {status:502});
            
    });
    app.get("/home", function(req , res)
    {
            //console.log("setInterval");
            if(flag_login == true){
              res.render(path.join(__dirname + '/views/trangchu.ejs'), {temp:ttemp}); 
            }
            else
            {
            console.log("render Login");
            res.render(path.join(__dirname + '/views/Login.ejs'), {status:502 });
        }

    });
    function ParseJson(jsondata) {
        try {
            return JSON.parse(jsondata);
        } catch (error) {
            return null;
        }
    }
    


