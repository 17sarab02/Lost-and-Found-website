const express = require('express')
const app = express()
const path = require('path')
const fs = require('fs')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const passport = require('passport')
const bcrypt = require('bcrypt')
const port = 80
const {mailer} = require('./mailing_facility')

const multer = require('multer')
const { userModel, lostModel, foundModel, claimModel } = require('./schemas')
const thisStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + file.originalname)
    }
});

const upload = multer({
    storage: thisStorage,
})

app.use(express.json())
app.use(express.urlencoded({extended: false}))

app.use(session({
    secret: 'therearenosecretshere',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 5 * 60 * 60 * 1000
    },
    store: MongoStore.create({
        mongoUrl: 'mongodb://localhost/lostNfound'
    })
}))

require('./passport_config')

app.use(passport.initialize())
app.use(passport.session())

app.use(express.static('static'))
app.use('/uploads', express.static('uploads'))
app.set('view engine', 'pug')
app.set('views', 'views')

app.get('/login', (req, res, next)=> {
    if(req.isAuthenticated()){
        res.redirect('/')
    }
    else{
        next()
    }
}, (req, res)=>{
    res.render('login')
})

app.post('/login', passport.authenticate('local', {
    failureRedirect: '/',
    successRedirect: '/'
}))

app.post('/register', async (req, res) => {
    if(req.body.username.length < 9){
        res.render('Redirect', {message1: "Username length should be atleast 9. Couldn't add user", message2: 'Redirecting you back'})
    }
    let hashed_password = await bcrypt.hash(req.body.password, 10)
    let existing_username = await userModel.findOne({username: req.body.username.toUpperCase()})
    let existing_email = await userModel.findOne({email: req.body.email.toLowerCase()})
    let existing_contact = await userModel.findOne({contact: req.body.contact})
    if(existing_username){
        res.render('Redirect', {message1: "Username already exists. Couldn't add user", message2: 'Redirecting you back'})
    }
    else if(existing_email){
        res.render('Redirect', {message1: "Email already exists Couldn't add user", message2: 'Redirecting you back'})
    }
    else if(existing_contact){
        res.render('Redirect', {message1: "Contact already exists. Couldn't add user", message2: 'Redirecting you back'})
    }
    else{
        let created_user = await userModel.create({
            username: req.body.username.toUpperCase(),
            age: req.body.age,
            contact: req.body.contact,
            email: req.body.email.toLowerCase(),
            fullname: req.body.fullname,
            password: hashed_password
        })
        console.log(`Added user\n${created_user}\n..to the database\n`)
        res.render('Redirect', {message1: 'User successfully added', message2: 'Redirecting you back'})
    }
})

app.use((req, res, next)=>{
    if(req.isAuthenticated()){
        next()
    }
    else{
        res.redirect('/login')
    }
})

app.get('/', async (req, res)=>{
    let lost_entries = await lostModel.find().sort({time_of_post: "desc"})
    let found_entries = await foundModel.find().sort({time_of_post: "desc"})
    let claim_entries = await claimModel.find().sort({time_of_post: "desc"})
    res.render('index', {user: req.user, lost: lost_entries, found: found_entries, claims: claim_entries})
})

app.get('/createEntry', (req, res)=>{
    res.render('createEntry', {user: req.user})
})

app.post('/createLost', upload.array('myimage', 4), (req, res)=>{
    image_paths = []
    req.files.forEach(element=>{
        image_paths.push(element.filename)
    })
    if(image_paths.length < 1){
        image_paths.push(req.body.category+'.png')
    }
    if(!req.body.time_last_seen_at){
        req.body.time_last_seen_at = new Date()
    }
    lostModel.create({
        post_by_user: req.user.username,
        lost_by_user: req.user.username,
        lost_by_name: req.user.fullname,
        title: req.body.title,
        contact: req.body.contact,
        place_last_seen_at: req.body.place_last_seen_at,
        time_last_seen_at: req.body.time_last_seen_at,
        time_of_post: new Date(),
        category: req.body.category,
        description: req.body.description,
        room_to_deliver: req.body.room_to_deliver,
        image_name_saved: image_paths
    }).then(resolved=>{
        console.log(`Added lost article to the database\n`);
    })
    mailer.sendMail({
        from: "lost.n.found.iiitk@gmail.com",
        to: req.user.email,
        subject: "Added new entry",
        text: "Hey there! This is to inform you that your entry '" + req.body.title + "' has been successfully added on the Lost-N-Found website lost entries. We look forward to your item being found and returned to you as soon as possible :)"
    }, (err, info)=>{
        if(err){
            console.log(err)
            return;
        }
        console.log('Successfully create-lost mailed to', req.user.email)
    })
    res.render('Redirect', {message1: "Your lost item has been added", message2: "You will be redirected to the homepage"})
})

app.post('/createFound', upload.array('myimage', 4), (req, res)=>{
    image_paths = []
    req.files.forEach(element => {
        image_paths.push('../uploads/' + element.filename)
    })
    if(image_paths.length < 1){
        image_paths.push(req.body.category+'.png')
    }
    if(!req.body.time_collected_at){
        req.body.time_collected_at = new Date()
    }
    foundModel.create({
        post_by_user: req.user.username,
        found_by_user: req.user.username,
        found_by_name: req.user.fullname,
        title: req.body.title,
        contact: req.body.contact,
        place_collected_from: req.body.place_collected_from,
        time_collected_at: req.body.time_collected_at,
        time_of_post: new Date(),
        category: req.body.category,
        description: req.body.description,
        room_to_collect_from: req.body.room_to_collect_from,
        image_name_saved: image_paths
    }).then(resolved=>{
        console.log(`Added found article to the database\n`);
    })
    mailer.sendMail({
        from: "lost.n.found.iiitk@gmail.com",
        to: req.user.email,
        subject: "Added new entry",
        text: "Hey there. This is to inform you that your entry '" + req.body.title + "' has been successfully added on the Lost-N-Found website found entries. We hope that the owner of the item finds your entry and retrieves it as soon as possible :)"
    }, (err, info)=>{
        if(err){
            console.log(err)
            return;
        }
        console.log('Successfully create-found mailed to', req.user.email)
    })
    res.render('Redirect', {message1: "Your found item has been added", message2: "You will be redirected to the homepage"})
})

app.post('/logout', (req, res, next)=>{
    req.logOut(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
    })
    res.redirect('/')
})

app.use('/view', express.static('static'))

app.get('/view/:article_id', async (req, res)=>{
    var required_model = lostModel
    if(req.query.collection == 'found'){
        required_model = foundModel
    }
    myObj = await required_model.findById(req.params.article_id)
    res.render('view', {user: req.user, article: myObj, collection: req.query.collection})
})

app.post('/:article_id', async (req, res)=>{
    if(req.body.task == "Delete"){
        var required_model = lostModel
        if(req.body.collection == 'found'){
            required_model = foundModel
        }
        let myObj = await required_model.findById(req.params.article_id)
        if(myObj.post_by_user != req.user.username){
            res.render('Redirect', {message1: "You didn't post this. You can't delete this either", message2: "You will be redirected to the homepage"})
        }
        else{
            let myObj = await required_model.findByIdAndDelete(req.params.article_id)
            let paths_to_delete = myObj.image_name_saved.filter((value, index, arr)=>{ return value!= myObj.category+'.png'})
            paths_to_delete.forEach(element=>{
                fs.unlink('uploads/'+element, (err)=>{
                    if(err){
                        console.log('Encountered error while deleting', element)
                        return
                    }
                    console.log('Successfully deleted', element)
                })
            })
            console.log()
            mailer.sendMail({
                from: "lost.n.found.iiitk@gmail.com",
                to: req.user.email,
                subject: "Added new entry",
                text: "Hey there. This is to inform you that your entry '" + myObj.title + "' has been successfully deleted from Lost-N-Found website entries."
            }, (err, info)=>{
                if(err){
                    console.log(err)
                    return;
                }
                console.log('Successfully delete_post mailed to', req.user.email)
            })
            res.render('Redirect', {message1: "Your entry has been deleted", message2: "You will be redirected to the homepage"})
        }
    }
    else if(req.body.task == "Respond"){
        var required_model = lostModel
        if(req.body.collection == 'found'){
            required_model = foundModel
        }
        let myObj = await required_model.findById(req.params.article_id)
        if(myObj.post_by_user == req.user.username){
            res.render('Redirect', {message1: "You posted this. Cant respond back to yourself", message2: "You will be redirected to the homepage"})
        }
        else{
            if(req.body.collection == 'found'){
                let myObj = await required_model.findByIdAndDelete(req.params.article_id)
                let desired_object = {
                    found_by_user: myObj.found_by_user,
                    found_by_name: myObj.found_by_name,
                    lost_by_user: req.user.username,
                    lost_by_name: req.user.fullname,
                    title: myObj.title,
                    contact: myObj.contact,
                    time_of_post: myObj.time_of_post,
                    time_of_claim: new Date(),
                    category: myObj.category,
                    description: myObj.description,
                    room_exchanged_at: myObj.room_to_collect_from,
                    image_name_saved: myObj.image_name_saved
                }
                claimModel.create(desired_object).then(async (resolved)=>{
                    console.log('Successfully added to claims')
                    const recipient = await userModel.findOne({username: myObj.found_by_user})
                    mailer.sendMail({
                        from: "lost.n.found.iiitk@gmail.com",
                        to: recipient.email,
                        subject: "Claimed an item in your post",
                        text: `Hey there. This is to inform you that the item in your entry '${myObj.title}' has been claimed to be the posession of ${req.user.username} ${req.user.fullname}. You can contact them at +91-${req.user.contact}`
                    }, (err, info)=>{
                        if(err){
                            console.log(err)
                            return;
                        }
                        console.log('Successfully respond mailed to', recipient.email)
                    })
                })
            }
            else if(req.body.collection == 'lost'){
                let myObj = await required_model.findByIdAndDelete(req.params.article_id)
                let desired_object = {
                    found_by_user: req.user.username,
                    found_by_name: req.user.fullname,
                    lost_by_user: myObj.lost_by_user,
                    lost_by_name: myObj.lost_by_name,
                    title: myObj.title,
                    contact: myObj.contact,
                    time_of_post: myObj.time_of_post,
                    category: myObj.category,
                    description: myObj.description,
                    room_exchanged_at: myObj.room_to_deliver,
                    image_name_saved: myObj.image_name_saved
                }
                claimModel.create(desired_object).then(async (resolved)=>{
                    console.log(resolved)
                    const recipient = await userModel.findOne({username: myObj.lost_by_user})
                    mailer.sendMail({
                        from: "lost.n.found.iiitk@gmail.com",
                        to: recipient.email,
                        subject: "Found your item",
                        text: `Hey there. This is to inform you that your entry '${myObj.title}' has been claimed to have been found by ${req.user.username} ${req.user.fullname}. You can contact them at +91-${req.user.contact}`
                    }, (err, info)=>{
                        if(err){
                            console.log(err)
                            return;
                        }
                        console.log('Successfully mailed')
                    })
                })
            }
            res.render('Redirect', {message1: "The entry has been responded to", message2: "It can now be viewed under claimed items"})
        }
    }
})

app.listen(port, console.log(`Listening on port-${port}`))