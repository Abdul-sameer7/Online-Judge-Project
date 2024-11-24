const express = require("express");
const app = express();
const {DBConnection} = require('./database/db.js');
const User = require('./models/users.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
DBConnection();

app.get("/", (req, res) => {
    res.send("welcome to Register Authentication");
});

app.post("/register", async (req, res) => {
    console.log(req);
    try {
        //get all the data from requst body
        const {firstName, lastName, email, password} = req.body;

        //check that all the data should exist
        if(!(firstName && lastName && email && password)){
            return res.status(400).send("please enter all the required fields");
        }

        //check if user already exists
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).send("User already exists!");
        }

        //encrypt the password
        const hashPassword = bcrypt.hashSync(password, 10);
        console.log(hashPassword);

        //save the user in database
        const user = await User.create({
            firstName,
            lastName,
            email,
            password: hashPassword,
        });

        //generate a token for user and send it
        const token = jwt.sign({ id:user._id, email}, process.env.SECRET_KEY, {
            expiresIn: "1h"
        });
        user.token = token;
        user.password = undefined;
        res.status(201).json({
            message: "You have successfully registered",
            user
        });


    } catch (error) {
        console.log(error);
    }
});

app.post('/login', async (req, res) => {
    try {
        const {email, password} = req.body;

        if(!(email && password)){
            return res.status(400).send("please enter both email and password");
        }
        const user = await User.findOne({email});
        if(!user){
            return res.status(401).send("Invalid email or password");
        }

        const ispasswordmatch = await bcrypt.compare(password, user.password);

    if(!ispasswordmatch){
        return res.status(401).send("Invalid email or password");
      }

      const token = jwt.sign({ id:user._id, email}, process.env.SECRET_KEY, {
        expiresIn: "1h"
    });

    res.status(200).json({
        message: "Successfully logged in.",
        token,
    });
    
    } catch (error) {
        console.log(error);
    }
    
});

app.listen(3000, () => {
    console.log("running at port 3000");
});