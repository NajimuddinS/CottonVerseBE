const { parser } = require('../config/cloudinary');

const uploadImage = (fieldName) => {
  return (req, res, next) => {
    const upload = parser.single(fieldName);
    
    upload(req, res, function(err) {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      next();
    });
  };
};

module.exports = uploadImage;