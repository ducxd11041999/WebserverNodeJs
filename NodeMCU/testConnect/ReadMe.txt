format send data from esp to server:

client.send("Name-of-event", data);
***data is a JSON

***Example:

client.send("client send temperature", {"temperature" : 38})

on server will capture event  name "client send temperature" 
and data.temperature = 38


