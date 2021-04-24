const mongoose = require('mongoose')
const Schema = mongoose.Schema

const NotificationSchema=new Schema({
    title:String,
    nd:String,
    date:String,
    by:String,
    chuyenmuc:String
})

module.exports=mongoose.model('Notification',NotificationSchema)