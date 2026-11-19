const express = require('express');
const router = express.Router();
const { getUserById, updateUser, updateLocation, updateAvailability, updateArtisanProfile, getAllArtisans, uploadProfileImage, uploadBackgroundImage, uploadBothImages } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { uploadProfileImage: uploadProfileMiddleware, uploadBackgroundImage: uploadBackgroundMiddleware, uploadBoth } = require('../middleware/uploadMiddleware');

router.get('/artisans', getAllArtisans);
router.put('/location', protect, updateLocation);
router.put('/:id/availability', protect, updateAvailability);
router.put('/:id/artisan-profile', protect, updateArtisanProfile);
router.post('/:id/upload/profile', protect, uploadProfileMiddleware, uploadProfileImage);
router.post('/:id/upload/background', protect, uploadBackgroundMiddleware, uploadBackgroundImage);
router.post('/:id/upload/both', protect, uploadBoth, uploadBothImages);
router.get('/:id', getUserById);
router.put('/:id', protect, updateUser);

module.exports = router;
