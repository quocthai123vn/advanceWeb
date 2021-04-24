const http=require('http')
const express = require('express')
const app = express()
const checkAuthenciation=require('./checkAuthenciation')
const dotenv = require('dotenv').config() 
const cookieParser=require('cookie-parser')
const session=require('express-session')
const flash= require('express-flash')
const socketio=require('socket.io')
const server=http.createServer(app)
const io=socketio(server)



//router
const UserRouter=require('./routes/UserRouter')
const HomeRouter=require('./routes/HomeRouter')
const NotificationRouter=require('./routes/NotificationRouter')
const AdminRouter=require('./routes/AdminRouter')

///database
const mongoose=require('mongoose')

app.set('socketio', io);
app.set('view engine','ejs')
app.use(express.urlencoded({extended:false}))
app.use(express.static(__dirname));
app.use(cookieParser('mk'))
app.use(session({
    secret: process.env.SESSION_SECRET
}))
app.use(flash())
app.use(express.json())
app.use('/',UserRouter)
app.use('/',HomeRouter)
app.use('/',NotificationRouter)
app.use('/',AdminRouter)


app.get('/post',(req,res)=>{
    let userLogin=req.session.user
    if(!userLogin){
        return res.redirect('/login')
    }
    res.render('post',{userLogin})
})

app.get('/error',(req,res)=>{
    let userLogin=req.session.user
    if(!userLogin){
        return res.redirect('/login')
    }
    res.render('error',{userLogin})
})

app.use((req,res)=>{
    res.redirect('/error')
})

mongoose.connect(process.env.DB_HOST,{
    useNewUrlParser:true,
    useUnifiedTopology:true
})
.then(()=>{
    const port=process.env.PORT || 8080
    server.listen(port,()=>console.log(`http://localhost:${port}`))
})
.catch(e=>console.log("Khong the ket noi"))
