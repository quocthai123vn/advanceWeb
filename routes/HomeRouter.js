const express=require('express')
const Router=express.Router()
const multer=require('multer')
const upload=multer({dest:'uploads', 
fileFilter:(req,file,callback)=>{ 
    if(file.mimetype.startsWith('image/')){ 
        callback(null,true)
    }
    else{
        callback(null,false)
    }
},limits:{fileSize:50000}})

//model
const Post=require('../models/PostModel')
////

Router.get('/',(req,res)=>{
    let userLogin=req.session.user
    if(!userLogin){
        return res.redirect('/login')
    }
    Post.find().sort({_id:-1})
    .then(posts=>{
        res.render('index',{posts,userLogin})
    })
})

Router.post('/',(req,res)=>{
    let userLogin=req.session.user
    if(!userLogin){
        return res.redirect('/login')
    }
    let uploader=upload.single('image')
    uploader(req,res,err=>{
        let image=req.file
        let {status}=req.body
        let msg=''
        if(!status){
            msg='Vui lòng nhập nội dung!'
        }
        if(msg.length>0){
            Post.find()
            .then(posts=>{
                res.render('index',{errmsg:msg,posts,userLogin})
            })
        }
        else{
            let post=new Post({
                nd:status,
                date:'',
                by:'Thai cute',
                url:'/post/',
                image:'',
                cmt:[
                    {
                    user:'',
                    msg:'',
                    date:''
                    }
                ]
            })
            return post.save().then(()=>{
                res.redirect('/')
            })
        }
    })
})

module.exports=Router