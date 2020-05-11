var socket = io("localhost:3000");

$(document).ready(function()
{
	//console.log("aaa");
	$("#btnLightOn").click(function()
	{
		socket.emit("CLIENT-SEND-LIGHT-ON",{Temp:"20",AR:"1"});
	})
	$("#btnLightOff").click(function()
	{
		//alert("cuuuu");
		socket.emit("CLIENT-SEND-LIGHT_OFF");
	})
	$("#btnFanOn").click(function()
	{
		socket.emit("CLIENT-SEND-FAN-ON");
	})
	$("#btnFanOff").click(function()
	{
		socket.emit("CLIENT-SEND-FAN-OFF");
	})
	/*
	$("#btnLogin").click(function()
	{
		alert("login");
		socket.emit("CLIENT-SEND-LOGIN", {uName: $("#un").val(), pWord: $("#pw").val()});
	})*/
})

socket.on("SERVER-SEND-FAN-ON", function(data)
{
	//alert("Đã chọn hiệu ứng mưa")
	$("#fanMode").html("");
	$("#fanMode").html("[FAN]-Status: ON");
})
socket.on("SERVER-SEND-FAN-OFF", function(data)
{
	//alert("Đã chọn hiệu ứng love")
	$("#fanMode").html("")
	$("#fanMode").html("[FAN]-Status: OFF");
})
socket.on("SERVER-SEND-LIGHT-ON", function(data)
{
	//alert("Đã chọn hiệu ứng plan")
	$("#lightMode").html("")
	$("#lightMode").html("[LIGHT]-Status: ON ");
	$("#idTemp").html("");
	//$("#chart_div").html("Temperature : "+ data.Temp);
	//document.getElementById('chart_div').setAttribute('temp', 20);
	var con = document.getElementById('chart_div').setAttribute('temp');
	alert(con);
})

socket.on("SERVER-SEND-LIGHT-OFF", function(data)
{
	//alert("Đã chọn hiệu ứng domino")
	$("#lightMode").html("")
	$("#lightMode").html("[LIGHT]-Status: OFF ");
})

socket.on("SERVER-SEND-TEMP-HUM", function(data)
{
	//alert("Đã chọn hiệu ứng domino")
	$("#idTemp").html("");

	$("#idTemp").html("Temperature: " + data.Temp);
	$("#idHumidity").html("");
	
	$("#idHumidity").html("Humidity: " + data.Humi);
	//
})

socket.on("SERVER-SEND-BACKUP-DATA", function(data)
{
	//alert("Đã chọn hiệu ứng domino")
	$("#lightMode").html("")
	$("#lightMode").html("[LIGHT]-Status: " + data[0].Light);
	$("#fanMode").html("")
	$("#fanMode").html("[FAN]-Status: " + data[1].Fan);
	//
})