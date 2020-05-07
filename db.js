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

const user = mongoose.model('users', userSchema)

user.create(
{
	user : "buiduc",
	password : "1104",
	status: 0
})
