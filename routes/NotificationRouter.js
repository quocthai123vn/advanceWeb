const express=require('express')
const Router=express.Router()
const {check, validationResult}=require('express-validator')
const Notification=require('../models/NotificationModel')
const moment = require('moment')
const {roleNameFile}=require('../supportFile')


Router.get('/notification',(req,res) =>{
    let userLogin=req.session.user
    if(!userLogin){
        return res.redirect('/login')
    }
    const error=req.flash('error')
    Notification.find().sort({_id:-1})
    .then(notifications=>{
        res.render('notification',{notifications,userLogin,error,search:''})
    })
})

Router.post('/notification',(req,res) =>{
    let userLogin=req.session.user
    if(!userLogin){
        return res.redirect('/login')
    }

    let {search,chuyenmuc}=req.body

    if(!search && !chuyenmuc){
        let message='Vui lòng nhập thông tin tìm kiếm'
        req.flash('error',message)
        return res.redirect('/notification')
    }
    else if(!chuyenmuc){
        Notification.find({title:new RegExp(search,'i')}).sort({_id:-1})
        .then(notifications=>{
            return res.render('notification',{notifications,userLogin,search})
        })
    }
    else if(!search){
        Notification.find({chuyenmuc:roleNameFile[chuyenmuc]}).sort({_id:-1})
        .then(notifications=>{
            return res.render('notification',{notifications,userLogin})
        })
    }
    else{
        Notification.find({chuyenmuc:roleNameFile[chuyenmuc],title:new RegExp(search,'i')}).sort({_id:-1})
        .then(notifications=>{
            return res.render('notification',{notifications,userLogin,search})
        })
    }
    
})

Router.get('/notification/:id',(req,res) =>{
    let userLogin=req.session.user
    if(!userLogin){
        return res.redirect('/login')
    }
    let {id}=req.params
    Notification.findOne({_id:id}).then((n)=>{
        return res.render('details',{n,userLogin})
    })
    .catch((err)=>{
        res.redirect('/error')
    })
})


Router.get('/addNotification',(req,res)=>{
    let userLogin=req.session.user
    if(!userLogin){
        return res.redirect('/login')
    }
    const error=req.flash('error') 
    res.render('addNotification',{userLogin,error})
})

const addNofValidator=[
    check('postName').exists().withMessage('Vui lòng nhập tiêu đề')
    .notEmpty().withMessage('Không được để trống tiêu đề')
    .isLength({min:6}).withMessage('Tiêu đề phải tối thiểu 6 ký tự'),

    check('detail').exists().withMessage('Vui lòng nhập nội dung')
    .notEmpty().withMessage('Không được để trống nội dung')
]

Router.post('/addNotification',addNofValidator,(req,res)=>{
    let io = req.app.get('socketio')
    let userLogin=req.session.user
    if(!userLogin){
        return res.redirect('/login')
    }
    let result  = validationResult(req)
    let newPost=req.body
    if(result.errors.length===0){
        let n= new Notification({
            title:newPost.postName,
            nd:newPost.detail,
            date:moment().format('DD/MM/YYYY'),
            by:userLogin.name,
            chuyenmuc:roleNameFile[newPost.chuyenmuc]
        })
        return n.save().then(()=>{
            message=n._id
            io.on('connection',socket=>{
                socket.emit('message',message)
            })
            res.redirect('/Notification')
        })   
    }
    else{
        result=result.mapped()

        let message
        for(fields in result){
            message=result[fields].msg
            break
        }
        req.flash('error',message)
        return res.redirect('/addNotification')
    }
})

module.exports=Router