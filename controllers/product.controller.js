const Product = require('../models/product.model.js');
const ErrorResponse = require('../utils/errorResponse');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get all products
// @route   GET /api/v1/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find();
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/v1/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(
        new ErrorResponse(`Product not found with id of ${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    req.body.user = req.user.id;

    // Parse sizes if it's a string
    if (typeof req.body.sizes === 'string') {
      req.body.sizes = JSON.parse(req.body.sizes);
    }

    // Handle images if uploaded
    if (req.files && req.files.length > 0) {
      req.body.images = await Promise.all(req.files.map(async (file, index) => {
        let imageType;
        switch(index) {
          case 0: imageType = 'front'; break;
          case 1: imageType = 'back'; break;
          case 2: imageType = 'design'; break;
          default: imageType = 'front';
        }
        
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'ecommerce',
          public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
          resource_type: 'auto'
        });

        return {
          public_id: result.public_id,
          url: result.secure_url,
          type: imageType
        };
      }));
    }

    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

exports.uploadProductImages = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
    }

    if (!req.files || req.files.length === 0) {
      return next(new ErrorResponse(`Please upload image files`, 400));
    }

    // Delete old images
    if (product.images?.length > 0) {
      for (const image of product.images) {
        await cloudinary.uploader.destroy(image.public_id);
      }
    }

    // Upload new images
    const uploadedImages = await Promise.all(req.files.map(async (file, index) => {
      let imageType;
      switch(index) {
        case 0: imageType = 'front'; break;
        case 1: imageType = 'back'; break;
        case 2: imageType = 'design'; break;
        default: imageType = 'front';
      }
      
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'ecommerce',
        public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
        resource_type: 'auto'
      });

      return {
        public_id: result.public_id,
        url: result.secure_url,
        type: imageType
      };
    }));

    product.images = uploadedImages;
    await product.save();
    
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/v1/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return next(
        new ErrorResponse(`Product not found with id of ${req.params.id}`, 404)
      );
    }

    // Parse sizes if it's a string (same as in createProduct)
    if (typeof req.body.sizes === 'string') {
      req.body.sizes = JSON.parse(req.body.sizes);
    }

    // Handle image uploads if there are new images
    if (req.files && req.files.length > 0) {
      // Delete old images from cloudinary
      if (product.images?.length > 0) {
        for (const image of product.images) {
          if (image.public_id) {
            await cloudinary.uploader.destroy(image.public_id);
          }
        }
      }

      // Upload new images
      req.body.images = await Promise.all(req.files.map(async (file, index) => {
        let imageType;
        switch(index) {
          case 0: imageType = 'front'; break;
          case 1: imageType = 'back'; break;
          case 2: imageType = 'design'; break;
          default: imageType = 'front';
        }
        
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'ecommerce',
          public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
          resource_type: 'auto'
        });

        return {
          public_id: result.public_id,
          url: result.secure_url,
          type: imageType
        };
      }));
    } else {
      // No new images - exclude images field from the update
      delete req.body.images;
    }

    // Update the product
    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error("Error updating product:", error);
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(
        new ErrorResponse(`Product not found with id of ${req.params.id}`, 404)
      );
    }

    // Delete images from cloudinary
    if (product.images?.length > 0) {
      for (const image of product.images) {
        await cloudinary.uploader.destroy(image.public_id);
      }
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};