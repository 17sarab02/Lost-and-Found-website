const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "lost.n.found.iiitk@gmail.com",
        pass: "xycdupnidfkhmpcj"
    }
})

module.exports.mailer = transporter