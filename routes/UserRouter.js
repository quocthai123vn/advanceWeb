const express=require('express')
const Router=express.Router()
const {check, validationResult}=require('express-validator')
const User=require('../models/UserModel')
const bcrypt=require('bcrypt')
const fs=require('fs')

//r GG login
const {OAuth2Client} = require('google-auth-library');
const CLIENT_ID=process.env.CLIENT_ID
const client = new OAuth2Client(CLIENT_ID);
const checkAuthenciation=require('../checkAuthenciation')
//---------------

const { clear } = require('google-auth-library/build/src/auth/envDetect')
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



Router.get('/login',(req,res) =>{
    if(req.session.user){
        return res.redirect('/')
    }
    const success=req.flash('success') 
    const error=req.flash('error')  
    const email=req.flash('email') 
    res.render('login',{email,success,error})
})

const loginValidator=[
    check('email').exists().withMessage('Vui lòng nhập email')
    .notEmpty().withMessage('Không được để trống email')
    .isEmail().withMessage('Email sai định dạng'),

    check('password').exists().withMessage('Vui lòng nhập mật khẩu')
    .notEmpty().withMessage('Không được để trống mật khẩu')
    .isLength({min:6}).withMessage('Mật khẩu phải tối thiểu 6 ký tự')
]

Router.post('/login',loginValidator,(req,res) =>{
    if(req.session.user){
        return res.redirect('/')
    }
    let result  = validationResult(req)
    if(result.errors.length===0){
        const{email,password}=req.body
        User.findOne({email:email}).then((user)=>{
            if(!user){
                req.flash('error','Sai email hoặc mật khẩu')
                req.flash('email',email)
                return res.redirect('/login')
            }
            else{
                const match=bcrypt.compareSync(password,user.password)
                if(!match){
                    req.flash('error','Sai email hoặc mật khẩu')
                    req.flash('email',email)
                
                    return res.redirect('/login')
                }
                else{
                    req.session.user=user
                    return res.redirect('/')
                }
            }
        })
    }
    else{
        result=result.mapped()

        let message
        for(fields in result){
            message=result[fields].msg
            break
        }
        const {email,password}=req.body
        req.flash('error',message)
        req.flash('email',email)
    
        res.redirect('/login')
    }  
})

Router.get('/logout',(req,res)=>{
    req.session.destroy()
    res.redirect('/login')
})


Router.post('/gglogin',(req,res)=>{
    let token=req.body.token
    let user={}
    async function verify(){
        const ticket=await client.verifyIdToken({
            idToken:token,
            audience:CLIENT_ID
        })
        const payload=ticket.getPayload()
        user.name=payload.name
        user.email=payload.email
        user.picture=payload.picture
        user.hd=payload.hd
    }
    verify()
    .then(()=>{
        if(!user.hd || user.hd!=='student.tdtu.edu.vn'){
            return res.redirect('/login')
        }
        else{
            res.cookie('session-token',token)
            let u= new User({
                email:user.email,
                name:user.name,
                nickname:user.name,
                avatar:user.picture,
                password:'',
                userRole:[
                    {
                        role:'SV',
                        roleName:'Sinh Viên'
                    }
                ]
            })
            return u.save().then(()=>{
                res.send('Ok')
            })    
        }      
    })
    .catch(err=>{
        res.clearCookie('session-token')
        req.flash('error','Hủy đăng ký')
        return res.redirect('/login')
    })
})

Router.get('/register',checkAuthenciation,(req,res)=>{
    if(req.session.user){
        return res.redirect('/')
    }
    const error=req.flash('error') 
    res.render('register',{error}) 
})


const registerValidator=[
    check('password').exists().withMessage('Vui lòng nhập mật khẩu')
    .notEmpty().withMessage('Không được để trống mật khẩu')
    .isLength({min:6}).withMessage('Mật khẩu phải tối thiểu 6 ký tự'),

    check('rePassword').exists().withMessage('Vui lòng nhập xác nhận mật khẩu')
    .notEmpty().withMessage('Không được để trống xác nhận mật khẩu')
    .custom((value,{req})=>{
        if(value!==req.body.password){
            throw new Error('Mật khẩu không khớp')
        }
        return true 
    })
]

Router.post('/register',checkAuthenciation,registerValidator,(req,res)=>{
    if(req.session.user){
        return res.redirect('/')
    }
    let result  = validationResult(req)
    if(result.errors.length===0){
        let u=req.user;
        let {password,rePassword}=req.body
        const filter = { email: u.email};
        const hashed=bcrypt.hashSync(password,10)
        const update = { password: hashed };
        let user = User.findOneAndUpdate(filter,update,{new:true},(err)=>{
            if(err){
                req.flash('error',err.message)
                return res.redirect('/register')
            }
            else{
                req.flash('success','Đăng ký thành công')
                res.clearCookie('session-token')
                return res.redirect('/login')
            }
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
    
        return res.redirect('/register')
    }
    
})


Router.get('/profile/:id',(req,res) =>{
    let userLogin=req.session.user
    if(!userLogin){
        return res.redirect('/login')
    }
    let {id}=req.params
    const success=req.flash('success') 
    User.findOne({_id:id}).then((userProfile)=>{
        return res.render('profile',{userProfile,userLogin,success})
    })
    .catch((err)=>{
        res.redirect('/error')
    })
})

Router.get('/edit',(req,res)=>{
    let userLogin=req.session.user
    if(!userLogin){
        return res.redirect('/login')
    }
    res.render('edit',{userLogin})
})

Router.post('/edit',(req,res)=>{
    let userLogin=req.session.User
    if(!userLogin){
        return res.redirect('/login')
    }
    let uploader=upload.single('image')
    uploader(req,res,err=>{
        let {name}=req.body
        let image=req.file
        let msg=''

        if(!name){
            msg='Vui lòng nhập tên hiển thị'
        }
        else if(err){
            msg='File ảnh quá lớn'
        }
        else if(!image){
           
            msg='File ảnh không hợp lệ'
        }
        
        if(msg.length>0){
            res.render('edit',{
            errmsg: msg,
            userLogin
        })
        }
        else{
            fs.renameSync(image.path,`uploads/${image.originalname}`)
            let filter={email:userLogin.email}
            let update={
                nickname:name,
                avatar:'/uploads/'+image.originalname
            }
            let user = User.findOneAndUpdate(filter,update,{new:true},(err)=>{
                if(err){
                    return res.render('edit',{
                        errmsg: err,
                        userLogin
                    })
                }
                else{
                    res.redirect('/profile/'+userLogin._id)
                }
            })
        }
    })
    
})



Router.get('/changePassword',(req,res)=>{
    let userLogin=req.session.user
    if(!userLogin){
        return res.redirect('/login')
    }
    const error=req.flash('error') 
    res.render('changePassword',{error,userLogin})
})

const changePasswordValidator=[
    check('newPassword').exists().withMessage('Vui lòng nhập mật khẩu mới')
    .notEmpty().withMessage('Không được để trống mật khẩu mới')
    .isLength({min:6}).withMessage('Mật khẩu phải tối thiểu 6 ký tự'),

    check('rePassword').exists().withMessage('Vui lòng nhập xác nhận mật khẩu')
    .notEmpty().withMessage('Không được để trống xác nhận mật khẩu')
    .custom((value,{req})=>{
        if(value!==req.body.newPassword){
            throw new Error('Mật khẩu xác nhận không khớp')
        }
        return true 
    })
]

Router.post('/changePassword',changePasswordValidator,(req,res)=>{
    let userLogin=req.session.user
    if(!userLogin){
        return res.redirect('/login')
    }
    let result  = validationResult(req)
    if(result.errors.length===0){
        let {newPassword,rePassword}=req.body
        const hashed=bcrypt.hashSync(newPassword,10)
        let user = User.findOneAndUpdate({email:userLogin.email},{password:hashed},{new:true},(err)=>{
            if(err){
                req.flash('error',err.message)
                return res.redirect('/changePassword')
            }
            else{
                req.flash('success','Đổi mật khẩu thành công')
                return res.redirect(`/profile/${userLogin._id}`)
            }
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
    
        return res.redirect('/changePassword')
    }
})




module.exports=(Router)