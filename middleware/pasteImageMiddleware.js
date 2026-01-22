const envConfig = require('../config/envConfig');
const { s3, bucketName } = require('../utils/upload');
const { PutObjectCommand } = require('@aws-sdk/client-s3');

const MAX_IMAGES = 5;
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MIME_WHITELIST = ['image/jpeg', 'image/png', 'image/webp'];

function makeS3Location(key) {
  const region = envConfig.S3_BUCKET_REGION;
  return `https://${bucketName}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;
}

const pasteImageMiddleware = async (req, res, next) => {
  try {
    const pasted = req.body.pasted_images || req.body.pastedImages;
    if (!pasted) return next();

    let images = Array.isArray(pasted) ? pasted : JSON.parse(pasted);
    if (!Array.isArray(images)) images = [images];

    req.files = req.files || [];

    if (req.files.length + images.length > MAX_IMAGES) {
      return res.status(400).send({ error: `Too many images. Max ${MAX_IMAGES} allowed.` });
    }

    for (const dataUrl of images) {
      if (typeof dataUrl !== 'string') continue;
      const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
      if (!matches) continue;

      const mimetype = matches[1];
      const base64Data = matches[2];

      if (!MIME_WHITELIST.includes(mimetype)) {
        return res.status(400).send({ error: 'Invalid image type' });
      }

      const buffer = Buffer.from(base64Data, 'base64');
      if (buffer.length > MAX_SIZE_BYTES) {
        return res.status(400).send({ error: `Image too large. Max ${MAX_SIZE_BYTES} bytes.` });
      }

      const key = `${req.params.speciesId || 'uploads'}/${req.params.individualId || req.params.nextId || Date.now()}-${Date.now()}-${Math.random().toString(36).substr(2,9)}.${mimetype.split('/')[1]}`;

      const params = {
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
      };

      const command = new PutObjectCommand(params);
      await s3.send(command);

      const location = makeS3Location(key);

      req.files.push({
        location,
        key,
        bucket: bucketName,
        originalname: `pasted-image-${Date.now()}.${mimetype.split('/')[1]}`,
        mimetype,
        size: buffer.length,
        fieldname: 'pasted_images',
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = pasteImageMiddleware;