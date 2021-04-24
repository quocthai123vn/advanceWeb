const mongoose = require('mongoose')
const Schema = mongoose.Schema

const PostSchema=new Schema({
    nd:String,
    date:String,
    by:String,
    url:String,
    image:String,
    cmt:[
        {
        user:String,
        msg:String,
        date:String
    }
    ]
})

module.exports=mongoose.model('Post',PostSchema)