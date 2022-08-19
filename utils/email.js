const nodemailer = require('nodemailer')
const pug = require('pug')
const htmlToTest = require('html-to-text')
module.exports = class Email {
    constructor(user, url){
        this.to = user.email
        this.firstName = user.name.split(' ')[0]
        this.url = url
        this.from = 'sfasdfasdfasdfasdf'
    }
    newTransport() {
        if(process.env.NODE_ENV === 'production') {

        }

        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        })

    }

    async send(template, subject) {
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject
        })

        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToTest.fromString(html)
        }

        
        await this.newTransport().sendMail(mailOptions)
    }
    async sendWelcome() {
        await this.send('welcome', '欢迎来的！！！')
    }
}
