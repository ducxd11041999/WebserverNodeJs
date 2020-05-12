// required
const mongoose =  require('mongoose')
// connect
mongoose.connect('mongodb://localhost/local')
// create Schem
const userSchema = new mongoose.Schema({
	user : String,
	password: String,
	status: Number
})

const ctrlSchema = new mongoose.Schema({
	devicename : String,
	ctrl: String
})
const sensorSchema = new mongoose.Schema({
	element : String,
	value: Number
})
const user = mongoose.model('users', userSchema)
const store_data = mongoose.model('store_data', ctrlSchema)
const store_sensor = mongoose.model('store_sensor', sensorSchema)

user.remove({}).exec((err, result)=>{
	console.log(result);
});
user.create([
{
	user : "buiduc",
	password : "114",
	status: 0
},
{
	user : "ce232",
	password : "113",
	status: 0
},
{
	user : "ducxd",
	password : "12345",
	status: 0
}]);

store_data.remove({}).exec((err, result)=>{
	console.log(result);
})
store_data.create([
{
	devicename : "Light",
	ctrl: "OFF"
},
{
	devicename : "Fan",
	ctrl: "OFF"
}
]);

store_sensor.remove({}).exec((err, result)=>{
	console.log(result);
})

store_sensor.create([
{
	element: "Temperature",
	value : 0
},
{
	element: "Humidity",
	value : 0
}])