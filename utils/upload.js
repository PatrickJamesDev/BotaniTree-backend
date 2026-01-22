const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');

const s3 = new AWS.S3();
const bucketName = 'your-bucket-name'; // Replace with your actual bucket name

const storage = multerS3({
    s3: s3,
    bucket: bucketName,
    acl: 'public-read',
    metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
        cb(null, Date.now().toString() + '-' + file.originalname);
    }
});

module.exports = { storage, s3, bucketName };