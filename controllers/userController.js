const User = require('../models/User');
const ArtisanProfile = require('../models/ArtisanProfile');
const Category = require('../models/Category');

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password_hash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If artisan, include profile
    if (user.role === 'artisan') {
      const profile = await ArtisanProfile.findOne({ user_id: user._id });
      user._doc.artisan_profile = profile;
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Own or Admin)
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check authorization
    if (req.user._id.toString() !== user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name, phone, location, location_address, profile_picture } = req.body;

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (location) {
      user.location = {
        type: 'Point',
        coordinates: [location.lng, location.lat],
      };
    }
    if (location_address) user.location_address = location_address;
    if (profile_picture) user.profile_picture = profile_picture;

    await user.save();

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update own location
// @route   PUT /api/users/location
// @access  Private
const updateLocation = async (req, res) => {
  try {
    const { lat, lng, address } = req.body;

    const user = await User.findById(req.user._id);
    user.location = {
      type: 'Point',
      coordinates: [lng, lat],
    };
    user.location_address = address || user.location_address;

    await user.save();

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update artisan availability
// @route   PUT /api/users/:id/availability
// @access  Private
const updateAvailability = async (req, res) => {
  try {
    const { is_available } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check authorization
    if (req.user._id.toString() !== user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (user.role !== 'artisan') {
      return res.status(400).json({ message: 'Only artisans can update availability' });
    }

    const profile = await ArtisanProfile.findOne({ user_id: user._id });
    if (profile) {
      profile.is_available = is_available;
      await profile.save();
    }

    res.json({ is_available });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update artisan profile
// @route   PUT /api/users/:id/artisan-profile
// @access  Private
const updateArtisanProfile = async (req, res) => {
  try {
    const { bio, qualifications, categories, years_of_experience, base_price_range, past_works, is_available } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check authorization
    if (req.user._id.toString() !== user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (user.role !== 'artisan') {
      return res.status(400).json({ message: 'Only artisans can update their profile' });
    }

    let profile = await ArtisanProfile.findOne({ user_id: user._id });

    // Create profile if it doesn't exist
    if (!profile) {
      profile = await ArtisanProfile.create({
        user_id: user._id,
        rating_avg: 0,
        total_jobs_completed: 0,
        categories: categories || [],
      });
    }

    // Update fields
    if (bio !== undefined) profile.bio = bio;
    if (qualifications !== undefined) profile.qualifications = qualifications;
    if (categories !== undefined) profile.categories = categories;
    if (years_of_experience !== undefined) profile.years_of_experience = years_of_experience;
    if (base_price_range !== undefined) profile.base_price_range = base_price_range;
    if (past_works !== undefined) profile.past_works = past_works;
    if (is_available !== undefined) profile.is_available = is_available;

    await profile.save();

    // Populate categories before returning
    await profile.populate('categories', 'name icon');

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload profile image
// @route   POST /api/users/:id/upload/profile
// @access  Private
const uploadProfileImage = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check authorization
    if (req.user._id.toString() !== user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (user.role !== 'artisan') {
      return res.status(400).json({ message: 'Only artisans can upload profile images' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let profile = await ArtisanProfile.findOne({ user_id: user._id });

    // Create profile if it doesn't exist
    if (!profile) {
      profile = await ArtisanProfile.create({
        user_id: user._id,
        rating_avg: 0,
        total_jobs_completed: 0,
      });
    }

    // Update profile image
    profile.profile_image = `/uploads/profiles/${req.file.filename}`;
    await profile.save();

    res.json({ profile_image: profile.profile_image });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload background image
// @route   POST /api/users/:id/upload/background
// @access  Private
const uploadBackgroundImage = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check authorization
    if (req.user._id.toString() !== user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (user.role !== 'artisan') {
      return res.status(400).json({ message: 'Only artisans can upload background images' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let profile = await ArtisanProfile.findOne({ user_id: user._id });

    // Create profile if it doesn't exist
    if (!profile) {
      profile = await ArtisanProfile.create({
        user_id: user._id,
        rating_avg: 0,
        total_jobs_completed: 0,
      });
    }

    // Update background image
    profile.background_image = `/uploads/backgrounds/${req.file.filename}`;
    await profile.save();

    res.json({ background_image: profile.background_image });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload both profile and background images
// @route   POST /api/users/:id/upload/both
// @access  Private
const uploadBothImages = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check authorization
    if (req.user._id.toString() !== user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (user.role !== 'artisan') {
      return res.status(400).json({ message: 'Only artisans can upload images' });
    }

    if (!req.files || (!req.files.profile_image && !req.files.background_image)) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    let profile = await ArtisanProfile.findOne({ user_id: user._id });

    // Create profile if it doesn't exist
    if (!profile) {
      profile = await ArtisanProfile.create({
        user_id: user._id,
        rating_avg: 0,
        total_jobs_completed: 0,
      });
    }

    // Update profile image if uploaded
    if (req.files.profile_image) {
      profile.profile_image = `/uploads/profiles/${req.files.profile_image[0].filename}`;
    }

    // Update background image if uploaded
    if (req.files.background_image) {
      profile.background_image = `/uploads/backgrounds/${req.files.background_image[0].filename}`;
    }

    await profile.save();

    res.json({
      profile_image: profile.profile_image,
      background_image: profile.background_image,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all artisans
// @route   GET /api/users/artisans
// @access  Public
const getAllArtisans = async (req, res) => {
  try {
    const { category, search } = req.query;

    // Build query
    const query = { role: 'artisan', is_active: true, 'blocked.is_blocked': false };

    // Filter by category if provided
    if (category) {
      const artisanProfiles = await ArtisanProfile.find({ categories: category }).select('user_id');
      const userIds = artisanProfiles.map(p => p.user_id);
      query._id = { $in: userIds };
    }

    // Search by name if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const artisans = await User.find(query).select('-password_hash').sort({ createdAt: -1 });

    // Get artisan profiles for each artisan
    const artisansWithProfiles = await Promise.all(
      artisans.map(async (artisan) => {
        const profile = await ArtisanProfile.findOne({ user_id: artisan._id })
          .populate('categories', 'name icon');

        return {
          ...artisan._doc,
          artisan_profile: profile,
        };
      })
    );

    res.json(artisansWithProfiles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserById,
  updateUser,
  updateLocation,
  updateAvailability,
  updateArtisanProfile,
  uploadProfileImage,
  uploadBackgroundImage,
  uploadBothImages,
  getAllArtisans,
};
