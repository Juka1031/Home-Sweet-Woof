const AWS = require('aws-sdk')
const express = require('express')
const multer = require('multer')
const access = require('../config/keys');
const multerS3 = require('multer-s3')
const path = require('path')
const s3 = new AWS.S3({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  });

// aws.config.update({
//     secretAccessKey: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
//     accessKeyId: 'XXXXXXXXXXXXXXX',
//     region: 'us-east-1'
// });

const upload = multer({
    storage: multerS3({
      s3: s3,
      acl: 'public-read',
      bucket: process.env.BUCKET,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
        cb(null, Date.now().toString());
      },
      
    }),
  });
  
  module.exports = upload;