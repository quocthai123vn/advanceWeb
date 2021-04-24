const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserSchema=new Schema({
    name:String,
    avatar:String,
    nickname:String,
    email:{
        type:String,
        unique: true,
    },
    password: String,
    userRole:[
        {
            role:String,
            roleName:String
        }
    ]
})

module.exports=mongoose.model('User',UserSchema)