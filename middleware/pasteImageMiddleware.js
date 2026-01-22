const AWS = require('aws-sdk');
const s3 = new AWS.S3();

const pasteImageMiddleware = async (req, res, next) => {
    try {
        const pastedImages = req.body.pasted_images || req.body.pastedImages;
        if (!pastedImages) return next();

        const images = Array.isArray(pastedImages) ? pastedImages : JSON.parse(pastedImages);
        req.files = req.files || [];

        for (const dataUrl of images) {
            const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
            if (!matches) continue;

            const mimetype = matches[1];
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, 'base64');

            const key = `uploads/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const params = {
                Bucket: 'your-s3-bucket-name', // Replace with your bucket name
                Key: key,
                Body: buffer,
                ContentType: mimetype,
            };

            const { Location } = await s3.upload(params).promise();

            req.files.push({
                location: Location,
                key,
                bucket: params.Bucket,
                originalname: `pasted-image-${Date.now()}.${mimetype.split('/')[1]}`,
                mimetype,
                size: buffer.length,
                fieldname: 'pasted_images',
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = pasteImageMiddleware;