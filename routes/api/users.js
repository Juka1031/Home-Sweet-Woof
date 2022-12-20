const express = require("express");
const router = express.Router();
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const keys = require('../../config/keys');
const jwt = require('jsonwebtoken');
const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");
const validateUserInput = require("../../validation/users");
const passport = require('passport');

router.post('/register', (req, res) => {
    const { errors, isValid } = validateRegisterInput(req.body);

    if (!isValid) {
        return res.status(400).json(errors);
    }

    User.findOne({ email: req.body.email })
    .then(user => {
        if (user) {
            return res.status(400).json({email: "A user is already registered with that email"})
        } else {
            const newUser = new User({
                username: req.body.username,
                email: req.body.email,
                password: req.body.password,
                location: req.body.location,
                type: req.body.type
            })

            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if(err) throw err;
                    newUser.password = hash;
                    newUser.save()
                        .then((user) => res.json(user))
                        .catch(err => console.log(err))
                })
            })
        }
    })
})

router.get("/", (req, res) => {
    User.find()
      .then((users) => res.json(users))
      .catch((err) => res.status(404).json({ nousersfound: "No users found" }));
  });

router.get("/:id", (req, res) => {
    User.findById(req.params.id)
        .then((user) => res.json(user))
        .catch((err) =>
            res.status(404).json({ nouserfound: "No user found with that ID" })
        );
});

router.post('/login', (req, res) => {
    const { errors, isValid } = validateLoginInput(req.body);

    if (!isValid) {
        return res.status(400).json(errors);
    }

    const email = req.body.email;
    const password = req.body.password;

    User.findOne({ email })
        .then(user => {
            if(!user) {
                return res.status(404).json({ email: "This user does not exist" });
            }

            bcrypt.compare(password, user.password)
                .then(isMatch => {
                    if(isMatch) {
                        const payload = {
                            id: user.id,
                            username: user.username,
                            email: user.email,
                            type: user.type
                        }
                        jwt.sign(
                            payload,
                            process.env.SECRET_OR_KEY,
                            { expiresIn: 3600 },
                            (err, token) => {
                                res.json({
                                    success: true,
                                    token: "Bearer " + token
                                });
                            }
                        )
                    } else {
                        return res.status(400).json({ password: "Password is incorrect" })
                    }
                })
        })
})

router.patch('/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
      const { errors, isValid } = validateUserInput(req.body);

      if (!isValid) {
        return res.status(400).json(errors);
      }
      const updatedUser = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        phone_number: req.body.phone_number,
        location: req.body.location,
        type: req.body.type,
        description: req.body.description
      }

      User.findById(req.params.id)
      .then(user => {
          if (user._id.toHexString() !== req.user.id) {
            res.status(404).json({ notauthorized: 'This is not your profile'})
          } else {
            User.findOneAndUpdate({ _id: req.params.id }, 
              {$set:updatedUser}, {new: true})
                .then(returnedUser => res.json(returnedUser))
                .catch(() =>
                  res.status(404).json("unable to update"))
          }
      })
      .catch(() =>
        res.status(404).json({ nouserfound: 'No user found' }))  
  })



module.exports = router;