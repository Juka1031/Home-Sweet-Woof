const express = require('express');
const router = express.Router(); 
const mongoose = require('mongoose');
const passport = require('passport');
const Dog = require('../../models/Dog');
const upload = require('../../upload/upload');
const validateDogInput = require('../../validation/dogs');

router.get("/", (req, res) => {
  Dog.find()
    .then((dogs) => res.json(dogs))
    .catch((err) => res.status(404).json({ nodogssfound: "No dogs found" }));
});

router.get("/user/:user_id", (req, res) => {
  Dog.find({ user: req.params.user_id })
    .then((dogs) => res.json(dogs))
    .catch((err) =>
      res.status(404).json({ nodogsfound: "No dogs found from that user" })
    );
});

router.get("/:id", (req, res) => {
  Dog.findById(req.params.id)
    .then((dog) => res.json(dog))
    .catch((err) =>
      res.status(404).json({ nodogfound: "No dog found with that ID" })
    );
});

router.post('/new', upload.array("photo",1),
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
    //   const { errors, isValid } = validateDogInput(req.body);
  
    //   if (!isValid) {
    //     return res.status(400).json(errors);
    //   }
      
      const file = req.files[0].location
      
  
      const newDog = new Dog({
        name: req.body.name,
        breed: req.body.breed,
        gender: req.body.gender,
        age: req.body.age,
        user_id: req.user.id,
        description: req.body.description,
        photo: file,
      });
  
      newDog.save().then(dog => res.json(dog));
    }
  );


// router.post('/',upload.single('photo'), passport.authenticate('jwt', { session: false }),(req, res) => {
//     console.log(req.file);


// });


  
router.delete('/:id',
passport.authenticate('jwt', { session: false }),
(req, res) => {
    Dog.findById(req.params.id)
    .then(dog => {
        if (dog.user.toHexString() !== req.user.id) {
            res.status(404).json({ notauthorized: 'This is not your dog'})
        } else {
        Dog.findOneAndDelete({ _id: req.params.id })
            .then(() => res.json("deleted"))
            .catch(() =>
            res.status(404).json("delete failed"))
        }
    })
    .catch(() =>
    res.status(404).json({ nodogsfound: 'No dog found' }))
});

router.patch('/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    console.log("before validation")
    // const { errors, isValid } = validateDogInput(req.body);
    //   console.log("first")
    //   if (!isValid) {
    //     return res.status(400).json(errors);
    //   }
    
      const updatedDog = {
        name: req.body.name,
        gender: req.body.gender,
        age: req.body.age,
        breed: req.body.breed
      }

      Dog.findById(req.params.id)
      .then(dog => {
        console.log(dog.user.toHexString())
        console.log(req.user.id)
        console.log(dog)
          if (dog.user.toHexString() !== req.user.id) {
            res.status(404).json({ notauthorized: 'This is not your dog'})
          } else {
            Dog.findOneAndUpdate({ _id: req.params.id }, 
              {$set:updatedDog}, {new: true})
                .then(returnedDog => res.json(returnedDog))
                .catch(() =>
                  res.status(404).json("unable to update"))
          }
      })
      .catch(() =>
        res.status(404).json({ nodogfound: 'No dog found' }))  
  })

  module.exports = router;
