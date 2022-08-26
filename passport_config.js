const passport = require('passport')
const localStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const {userModel} = require('./schemas')

const customFields = {
    usernameField: 'username',
    passwordField: 'password'
}

myCallBack = async (username, password, done)=>{
    try{
        console.log('Entered upto this part accurately')
        const user = await userModel.findOne({username: username.toUpperCase()})
        if(!user) {
            console.log('User not found')
            return done(null, false)
        }
        const password_valid = await bcrypt.compare(password, user.password)
        if(password_valid){
            return done(null, user)
        }
        else{
            console.log('InvalidPassword')
            return done(null, false)
        }
    }
    catch(e){
        return done(e)
    }
}

myStrategy = new localStrategy(customFields, myCallBack)

passport.use(myStrategy)

passport.serializeUser((user, done)=>{
    done(null, user.id)
})

passport.deserializeUser((userid, done)=>{
    userModel.findById(userid).then(user=>{
        done(null, user)
    }).catch(err=>{
        done(err)
    })
})  