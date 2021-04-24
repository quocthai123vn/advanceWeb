const express=require('express')
const Router=express.Router()
const User=require('../models/UserModel')
const fs=require('fs')
const emailValidator = require('email-validator')
const {roleNameFile}=require('../supportFile')
const bcrypt=require('bcrypt')

const multer=require('multer')
const upload=multer({dest:'uploads', 
fileFilter:(req,file,callback)=>{ 
    if(file.mimetype.startsWith('image/')){ 
        callback(null,true)
    }
    else{
        callback(null,false)
    }
},limits:{fileSize:5000000}})

Router.use(function( req, res, next ) {
    if ( req.query._method == 'DELETE' ) {
        req.method = 'DELETE';
        req.url = req.path;
    }       
    next(); 
});

Router.get('/dashboard',(req,res)=>{
    let userLogin=req.session.user
    if(!userLogin){
        return res.redirect('/login')
    }
    res.render('admin',{userLogin})
})

Router.get('/students',(req,res)=>{
    let userLogin=req.session.user
    if(!userLogin){
        return res.redirect('/login')
    }
    const error=req.flash('error')
    User.find({"userRole.role":"SV"}).sort({name:1})
    .then(users=>{
        res.render('studentManage',{users,userLogin,search:'',error})
    })
    
})

Router.post('/students',(req,res) =>{
    let userLogin=req.session.user
    if(!userLogin){
        return res.redirect('/login')
    }
    let {search}=req.body
    if(!search){
        let message='Vui lòng nhập thông tin tìm kiếm'
        req.flash('error',message)
        return res.redirect('/students')
    }
    User.find({$or:[{name:new RegExp(search,'i'),"userRole.role":"SV"},{email:new RegExp(search,'i'),"userRole.role":"SV"}]}).sort({name:1})
    .then(users=>{
        res.render('studentManage',{users,userLogin,search})
    })
})

Router.get('/departments',(req,res)=>{
    let userLogin=req.session.user
    if(!userLogin){
        return res.redirect('/login')
    }
    const error=req.flash('error')
    User.find({"userRole.role":{$ne:"SV"}}).sort({name:1})
    .then(users=>{
        res.render('departmentManage',{users,userLogin,search:'',error})
    })
    
})

Router.post('/departments',(req,res)=>{
    let userLogin=req.session.user
    if(!userLogin){
        return res.redirect('/login')
    }
    let {search}=req.body
    if(!search){
        let message='Vui lòng nhập thông tin tìm kiếm'
        req.flash('error',message)
        return res.redirect('/departments')
    }
    User.find({$or:[{name:new RegExp(search,'i'),"userRole.role":{$ne:"SV"}},{email:search,"userRole.role":{$ne:"SV"}}]}).sort({name:1})
    .then(users=>{
        res.render('departmentManage',{users,userLogin,search})
    })
})

Router.delete('/department/:id', function ( req, res ) {
    let userLogin=req.session.user
    if(!userLogin){
        return res.redirect('/login')
    }
    let {id}=req.params
    User.findByIdAndDelete(id)
    .then(p=>{
        console.log(p)
        res.send('OK')
    })
});

Router.get('/addDepartment',(req,res)=>{
    let userLogin=req.session.user
    if(!userLogin){
        return res.redirect('/login')
    }
    res.render('addDepartment',{userLogin,error:'',email:'',name:''})
    
})


Router.post('/addDepartment',(req,res)=>{
    let userLogin=req.session.user
    if(!userLogin){
        return res.redirect('/login')
    }
    let uploader=upload.single('image')
    uploader(req,res,err=>{
        let image=req.file
        let {email,name,role}=req.body
        msg=''
        if(!email){
            msg+='Vui lòng nhập email'
        }
        else if(!emailValidator.validate(email)){
            msg+='email sai định dạng'
        }
        else if(!name){
            msg+='Vui lòng nhập tên phòng ban'
        }
        else if(name.length<6){
            msg+='Tên phòng ban phải tối thiểu 6 ký tự'
        }
        else if(err){
            msg='File ảnh quá lớn'
        }
        else if(!image){
           
            msg='File ảnh không hợp lệ'
        }
        else if(!role){
            msg='Vui lòng chọn chuyên mục'
        }

        if(msg.length>0){
            res.render('addDepartment',{
            error: msg,
            userLogin,
            email,
            name
            })   
        }
        else{
            fs.renameSync(image.path,`uploads/${image.originalname}`)
            if(typeof role==='string'){
                let u= new User({
                    email:email,
                    name:name,
                    nickname:'',
                    avatar:'/uploads/'+image.originalname,
                    password:bcrypt.hashSync(process.env.PASSWORD,10),
                    userRole:[
                        {
                            role:role,
                            roleName:roleNameFile[role]
                        }
                    ]
                })
                return u.save().then(()=>{
                    res.redirect('/dashboard')
                })
            }
            else{
                var obj=`[`
                role.forEach(r=>{
                    obj+= `{"role":"${r}","roleName":"${roleNameFile[r]}"},`
                })
                    
                obj = obj.substring(0, obj.length - 1);
                obj+=`]`
                let u= new User({
                    email:email,
                    name:name,
                    nickname:'',
                    avatar:'/uploads/'+image.originalname,
                    password:bcrypt.hashSync(process.env.PASSWORD,10),
                    userRole:JSON.parse(obj)
                })
                return u.save().then(()=>{
                    res.redirect('/dashboard')
                })
            }
            
        }
    })
})
    
    



module.exports=Router