    
   	const PORT = 3000						//Đặt địa chỉ Port được mở ra để tạo ra chương trình mạng Socket Server
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
    var url_dbLogin = "mongodb://localhost:27017/";
    var url_dbCtrlDevice = "mongodb://localhost:27017/";
    var url_dbStoreSensor = "mongodb://localhost:27017/";
    
    //#Phải khởi tạo io sau khi tạo app!
    var bodyParser = require('body-parser');
    // parse application/json 
    app.use(bodyParser.json());
    var urlencodedParser = bodyParser.urlencoded({ extended: false })
    app.use(bodyParser.urlencoded({ extended: false }));

    /*Variable in server*/
	var t = 0, h = 0;
    var current_name = "";
    var dbo;
    var userDB = [];
    var ctrlDB = [];
    var sensorDB = [];
    var ttemp = 1;
    var flag_login = false ;
    var check_request = false;
    /*Connect login data base*/
    MongoClient.connect(url_dbLogin, function(err, db) {
          if (err) throw err;
          dbo = db.db("local");
          dbo.collection("users").find({}).toArray(function(err, result) {
            if (err) throw err;
            console.log("database login : " + result);
            userDB = result
            //db.close();
        });
    });
    /*coonect data control device*/
    MongoClient.connect(url_dbCtrlDevice, function(err, db) {
          if (err) throw err;
          dbo = db.db("local");
          dbo.collection("store_datas").find({}).toArray(function(err, result) {
            if (err) throw err;
            console.log("database device : " + result);
            ctrlDB = result;
            //db.close();
        });
    });
    /*connect data sensor */
    MongoClient.connect(url_dbStoreSensor, function(err, db) {
          if (err) throw err;
          dbo = db.db("local");
          dbo.collection("store_sensors").find({}).toArray(function(err, result) {
            if (err) throw err;
            console.log("database sensor : " + result);
            sensorDB = result;
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
   
        for( i =0 ; i<3 ; i++ )
        {
            if(uname == userDB[i].user && password == userDB[i].password && userDB[i].status != 1   )
            {
                console.log(userDB[i].user);
                var conditon = {user:userDB[i].user};
                var updateStatus = {$set: {status : 1}};
                dbo.collection("users").updateOne(conditon, updateStatus, function(err, res) {
                    console.log("Status update");
                });
                console.log(userDB[i].status);
                MongoClient.connect(url_dbLogin, function(err, db) {
                  if (err) throw err;
                  dbo = db.db("local");
                  dbo.collection("users").find({}).toArray(function(err, result) {
                    if (err) throw err;
                    console.log("database : " + result);
                    userDB = result
            //db.close();
                    });
                });
                current_name = userDB[i].user;
                res.render('Login',{status:1}); 

                res.end();
                flag_login = true;
                break;
            }
            else
                flag_login = false;
        }
       if(flag_login == false)
        {
            //console.log(userDB[i].user);
            var conditon = { user:current_name};
            var updateStatus = {$set: {status : -1}};
            dbo.collection("users").updateOne(conditon, updateStatus, function(err, res) {
                    console.log("Status update");
            });
            res.render('Login',{status:-1});  
            res.end();
        }
        
    });

    server.listen(PORT,'0.0.0.0', function()
    {
        //alert(process.env.PORT)
        console.log("connected")
        console.log(ip.address())
    });										// Cho socket server (chương trình mạng) lắng nghe ở port 3484

    server.on('listening', function() {
        console.log('Express server started on port %s at %s', server.address().port, server.address().address);
    });
    io.on("connection",function(socket)
    {
        //console.log("have a connection")
        MongoClient.connect(url_dbCtrlDevice, function(err, db) {
        if (err) throw err;
            dbo = db.db("local");
            dbo.collection("store_datas").find({}).toArray(function(err, result) {
                if (err) throw err;
                    //console.log("database device : " + result);
                    ctrlDB = result;
                    io.sockets.emit("SERVER-SEND-BACKUP-DEVICE",[{Light:ctrlDB[0].ctrl},{Fan:ctrlDB[1].ctrl}])
                    //db.close();
            });
        });
        MongoClient.connect(url_dbStoreSensor, function(err, db) {
            if (err) throw err;
            dbo = db.db("local");
            dbo.collection("store_sensors").find({}).toArray(function(err, result) {
                if (err) throw err;
                //console.log("database sensor : " + result);
                sensorDB = result;
                io.sockets.emit("SERVER-SEND-BACKUP-SENSOR",[{Temperature:sensorDB[1].value},
                    {Humidity:sensorDB[0].value}])
            //db.close();
        });
    });
        //console.log("Temperature: " + sensorDB[1].value)
        //console.log("flag log: "+ flag_login)
        //console.log(ip.address())
        //console.log("Có người kết nối")
        io.sockets.emit("SERVER-SEND-BACKUP-DATA",[{Light:ctrlDB[0].ctrl},{Fan:ctrlDB[1].ctrl}])
        io.sockets.emit("SERVER-SEND-BACKUP-SENSOR",[{Temperature:sensorDB[0].value},
                    {Humidity:sensorDB[1].value}])
        socket.on("CLIENT-SEND-LIGHT-ON", function(data)
        {
            ttemp = ttemp + 1;
            //console.log(ttemp);
            io.sockets.emit("SERVER-SEND-LIGHT-ON",{MODE:"lightOn",AR:"1"})
            var conditon = {devicename:ctrlDB[0].devicename};
            var updateStatus = {$set: {ctrl : "ON"}};
            dbo.collection("store_datas").updateOne(conditon, updateStatus, function(err, res) {
                    console.log("Status Light On is update");
                });

        });
        socket.on("CLIENT-SEND-LIGHT_OFF", function()
        {
           //console.log("Ok light off");
            
            io.sockets.emit("SERVER-SEND-LIGHT-OFF",{MODE:"lightOff",AR:"2"})

            var conditon = {devicename:ctrlDB[0].devicename};
            var updateStatus = {$set: {ctrl : "OFF"}};
            dbo.collection("store_datas").updateOne(conditon, updateStatus, function(err, res) {
                    console.log("Status Light OFF is update");
                });
        });
        socket.on("CLIENT-SEND-FAN-OFF", function()
        {
      
            io.sockets.emit("SERVER-SEND-FAN-OFF",{MODE:"fanOn",AR:"3"})
            var conditon = {devicename:"Fan"};
            var updateStatus = {$set: {ctrl : "OFF"}};
            dbo.collection("store_datas").updateOne(conditon, updateStatus, function(err, res) {
                    console.log("Status Fan Off is update");
                });
        });
        socket.on("CLIENT-SEND-FAN-ON", function()
        {
           
            io.sockets.emit("SERVER-SEND-FAN-ON",{MODE:"fanOff",AR:"4"})

            var conditon = {devicename:"Fan"};
            var updateStatus = {$set: {ctrl : "ON"}};
            dbo.collection("store_datas").updateOne(conditon, updateStatus, function(err, res) {
                    console.log("Status Fan On is update");
                });
        });
        socket.on("CLIENT-SEND-TEMP_HUM", function(data)
        {
            /*param data
                format: [{
                    element: "Temperature",
                    value: x_Number
                },
                {
                    element: "Humidity",
                    value: y_Number
                }]
            /*
            /*Update Value of sensor to data base*/
			if(data.Temperature){
				t = data.Temperature;
				//console.log(data.Temperature);
				var conditon_t = {element:"Temperature"};
				var updateValue_t = {$set: {value : parseFloat(data.Temperature)}};
				dbo.collection("store_sensors").updateOne(conditon_t, updateValue_t, function(err, res) {
						console.log("Value Temperature is update");
					});
			}
			if(data.Humidity){
				h = (data.Humidity + 20);
				//console.log(data.Humidity);// ok
				var conditon_h = {element:"Humidity"};
				var updateValue_h = {$set: {value :  parseFloat(h)}};
				dbo.collection("store_sensors").updateOne(conditon_h, updateValue_h, function(err, res) {
						console.log("Value Humidity is update");
					});
			}
            //io.sockets.emit("SERVER-SEND-TEMP_HUM",data);
			
        });
		socket.on("CLIENT-SEND-TEST", function(data){
			 io.sockets.emit("SERVER-SEND-TEST", data);
		});

    })
    app.get("/", function(req , res)
    {
            //console.log("setInterval");
            flag_login = false;
            //console.log("render Login");
            res.render(path.join(__dirname + '/views/Login.ejs'), {status:0 });
            
    });
     app.get("/login", function(req , res)
    {
            flag_login = false;
            //console.log("setInterval");
            var conditon = {status:1};
            var updateStatus = {$set: {status : 0}};
            dbo.collection("users").updateOne(conditon, updateStatus, function(err, res) {
                    console.log("Status update");
                });
            //console.log("render Login");
            res.render(path.join(__dirname + '/views/Login.ejs'), {status:502});
            
    });
    app.get("/home", function(req , res)
    {
            //console.log("setInterval");
            if(flag_login == true){
              res.render(path.join(__dirname + '/views/trangchu.ejs'), {temp:ttemp, name:current_name,
                Temperature: t,
                Humidity: h}); 
            }
            else
            {
            //console.log("render Login");
            res.render(path.join(__dirname + '/views/Login.ejs'), {status:0 });
        }

    });
    function ParseJson(jsondata) {
        try {
            return JSON.parse(jsondata);
        } catch (error) {
            return null;
        }
    }
    


