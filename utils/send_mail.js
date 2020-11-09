const nodemailer = require("nodemailer");
const uuid = require("uuid");
const UserLog = require("../models/userlogs");


module.exports = {
    sendResetEmail: (first_name, to_email, url_link, res, username) => {
        let transporter;
        let from;

        if (process.env.NODE_ENV === "development") {
            transporter = nodemailer.createTransport({
                host: "webmail.surflinegh.com",
                secureConnection: true,

                auth: {
                    user: 'egh00047',
                    pass: 'Egy@poli12345678'
                },
                connectionTimeout: 5000

            });
            from = "spolley@surflinegh.com";


        } else {
            transporter = nodemailer.createTransport({
                host: "172.25.36.10",
                port: 825,
                secure: false,
                tls: {

                    rejectUnauthorized: false
                },
                connectionTimeout: 5000
            });

            from = "servicedesk@surflinegh.com";

        }

        const messageBody = `
<p style="font-size: 16px">Dear<strong> ${first_name},</strong></p>
<p style="font-size: 16px">You have forgotten your password and an email has been sent to reset your password.
 Please click the button below to finish resetting your password.</p>
 <br>
 <p><a href="${url_link}" style="background: #09b2e7;color:#0a0707;text-decoration: none;padding: 15px;border: 2px solid #000000;margin: 10px;font-weight: bold;border-radius: 5px">RESET PASSWORD</a></p>
 <br>
 
 <p style="font-size: 16px"><strong>If the button above does not work, copy and paste the address below into a new browser window.</strong></p>
 <p style="font-size: 16px"><span style="background: aqua;">${url_link}</span></p>
 <p style="font-size: 16px">This password reset link is only valid for <strong>24 hours</strong> after you receive this email.</p>
 <p style="font-size: 16px">If you did not ask for your password to be reset, please ignore this email.</p>
 <p style="font-size: 16px"><i>Your Surfline IT Team</i> </p>
`;

        const mailOptions = {
            from: from,
            to: to_email,
            subject: 'IN Web Portal: PASSWORD RESET',
            html: messageBody
        };

        try {
             transporter.sendMail(mailOptions, async function (error, info) {
                if (error) {
                    console.log(error)
                    return res.json({error: "System Error"})
                } else {
                    let txn_id= uuid.v4();
                    let transaction_details = `username=${username}|email=${to_email}|url_link=${url_link}`;
                    let transaction_id = txn_id;
                    let status = "completed";
                    let transaction_type = "forgot password email";
                    let userlog = new UserLog({
                        username,
                        transaction_id,
                        transaction_type,
                        transaction_details,
                        status
                    });
                    userlog = await userlog.save();
                    if (userlog) {

                    } else {
                        console.log("Transaction logging failed")
                    }

                    return res.json({success: "success"})
                }
            });
        } catch (e) {
            console.log(e);
            return res.json({error: "System Error"})

        }


    },

    sendCreateEmail: (first_name, to_email, res, userlogin, password, usercreator,role) => {
        let transporter;
        let from;

        if (process.env.NODE_ENV === "development") {
            transporter = nodemailer.createTransport({
                host: "webmail.surflinegh.com",
                secureConnection: true,

                auth: {
                    user: 'egh00047',
                    pass: 'Egy@poli12345678'
                },
                connectionTimeout: 5000

            });
            from = "spolley@surflinegh.com";


        } else {
            transporter = nodemailer.createTransport({
                host: "172.25.36.10",
                port: 825,
                secure: false,
                tls: {

                    rejectUnauthorized: false
                },
                connectionTimeout: 5000
            });

            from = "servicedesk@surflinegh.com";

        }

        const messageBody = `<p style="font-size: 16px">Dear<strong> ${first_name},</strong></p>
<p style="font-size: 16px">Please find below your login credentials</p>
<p>
<ul>
<li><b>Username: </b>${userlogin}</li>
<li><b>Password: </b>${password}</li>
</ul>
</p>
 <br>
 <p><a href="http://inweb.surflinegh.com" style="background: #09b2e7;color:#0a0707;text-decoration: none;padding: 15px;border: 2px solid #000000;margin: 10px;font-weight: bold;border-radius: 5px">CLICK TO LOGIN</a></p>
 <br>
 
 <p style="font-size: 16px"><strong>If the button above does not work, copy and paste the address below into a new browser window.</strong></p>
 <p style="font-size: 16px"><span style="background: aqua;">http://inweb.surflinegh.com</span></p>
 <p style="font-size: 16px"><i>Your Surfline IT Team</i> </p>
`;

        const mailOptions = {
            from: from,
            to: to_email,
            subject: 'IN Web Portal: LOGIN CREDENTIALS',
            html: messageBody
        };

        try {
            transporter.sendMail(mailOptions, async function (error, info) {
                if (error) {
                    console.log(error)
                    return res.json({error: "User Account CREATED, Error in sending email to recipient"})
                } else {
                    let txn_id= uuid.v4();
                    let transaction_details = `username=${userlogin}|email=${to_email}|role=${role}`;
                    let transaction_id = txn_id;
                    let status = "completed";
                    let username = usercreator;
                    let transaction_type = "create user login";
                    let userlog = new UserLog({
                        username,
                        transaction_id,
                        transaction_type,
                        transaction_details,
                        status
                    });
                    userlog = await userlog.save();
                    if (userlog) {

                    } else {
                        console.log("Transaction logging failed")
                    }

                    res.json({success: "Account created"})
                }
            });
        } catch (e) {
            console.log(e);
            return res.json({error: "System Error"})

        }


    },


}



