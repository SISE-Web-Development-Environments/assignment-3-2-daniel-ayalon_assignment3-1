var express = require("express");
var router = express.Router()
const DButils = require("../../modules/DButils");
const bcrypt = require("bcrypt");
router.post("/register", async (req, res, next) => {
    try {

        const users = await DButils.execQuery("SELECT username FROM users");
        if (users.find((x) => x.username === req.body.username))
            throw { status: 409, message: "Username taken" };

        let hash_password = bcrypt.hashSync(
            req.body.password,
            parseInt(process.env.bcrypt_saltRounds)
        );
        if(req.body.password!==req.body.confirmPassword){
            throw {status:400, message: "confirm password and password is not same"}
        }
        else {
            await DButils.execQuery(
                `INSERT INTO users VALUES ('${req.body.username}', '${hash_password}','${req.body.firstName}','${req.body.lastName}','${req.body.email}','${req.body.country}','${req.body.image}')`
            );
            res.status(201).send({message: "user created", success: true});
        }
    } catch (error) {
        next(error);
    }
});

router.post("/Login", async (req, res, next) => {
    try {
        // check that username exists
        const users = await DButils.execQuery("SELECT username FROM users");
        if (!users.find((x) => x.username === req.body.username))
            throw { status: 401, message: "Username or Password incorrect" };

        // check that the password is correct
        const user = (
            await DButils.execQuery(
                `SELECT * FROM users WHERE username = '${req.body.username}'`
            )
        )[0];

        if (!bcrypt.compareSync(req.body.password, user.password)) {
            throw { status: 401, message: "Username or Password incorrect" };
        }

        // Set cookie
        req.session.user_id = user.user_id;

        // return cookie
        res.status(200).send({ message: "login succeeded", success: true });
    } catch (error) {
        next(error);
    }
});

router.get("/Logout", function (req, res) {
    req.session.reset(); // reset the session info --> send cookie when  req.session == undefined!!
    res.send({ success: true, message: "logout succeeded" });
});
module.exports = router;

