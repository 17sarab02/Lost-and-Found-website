const mongoose = require('mongoose')

userConnection = mongoose.createConnection('mongodb://localhost:27017/users')
articlesConnection = mongoose.createConnection('mongodb://localhost:27017/lostNfound')

userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique:true,
        minlength: 9
    },
    fullname: {
        type: String,
        required: true,
    },
    age: {
        type: Number,
    },
    email: {
        type: String,
        unique: true
    },
    contact: {
        type: String,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    }
})

lostSchema = new mongoose.Schema({
    post_by_user: {
        type: String,
        required: true,
        minlength: 9
    },
    lost_by_user: {
        type: String,
        required: true,
        minlength: 9
    },
    lost_by_name: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    place_last_seen_at: {
        type: String,
    },
    time_last_seen_at: {
        type: Date,
        default: new Date()
    },
    time_of_post: {
        type: Date,
        default: new Date()
    },
    category: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    room_to_deliver: {
        type: Number
    },
    image_name_saved: {
        type: Array,
        maxlength: 4
    }
})

foundSchema = new mongoose.Schema({
    post_by_user: {
        type: String,
        required: true,
        minlength: 9
    },
    found_by_user: {
        type: String,
        required: true,
        minlength: 9
    },
    found_by_name: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    place_collected_from: {
        type: String
    },
    time_collected_at: {
        type: Date
    },
    time_of_post: {
        type: Date,
        default: new Date()
    },
    category: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    room_to_collect_from: {
        type: Number
    },
    image_name_saved: {
        type: Array,
        maxlength: 4
    }
})

claimSchema = new mongoose.Schema({
    found_by_user: {
        type: String,
        required: true,
        minlength: 9
    },
    found_by_name: {
        type: String,
        required: true
    },
    lost_by_user: {
        type: String,
        required: true,
        minlength: 9
    },
    lost_by_name: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    time_of_post: {
        type: Date,
        default: new Date()
    },
    time_of_claim: {
        type: Date,
        default: new Date()
    },
    category: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    room_exchanged_at: {
        type: Number
    },
    image_name_saved: {
        type: Array,
        maxlength: 4
    }
})

module.exports.userModel = userConnection.model('users', userSchema)
module.exports.lostModel = articlesConnection.model('lost', lostSchema)
module.exports.foundModel = articlesConnection.model('found', foundSchema)
module.exports.claimModel = articlesConnection.model('claim', claimSchema)