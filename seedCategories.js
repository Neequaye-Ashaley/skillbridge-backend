const mongoose = require('mongoose');
const Category = require('./models/Category');

const categories = [
  {
    name: 'Plumbing',
    description: 'Professional plumbing services for homes and businesses',
    icon: '🔧',
  },
  {
    name: 'Electrical',
    description: 'Electrical installation, repair, and maintenance',
    icon: '⚡',
  },
  {
    name: 'Carpentry',
    description: 'Custom woodworking and furniture',
    icon: '🪚',
  },
  {
    name: 'Painting',
    description: 'Interior and exterior painting services',
    icon: '🎨',
  },
  {
    name: 'Masonry',
    description: 'Bricklaying and concrete work',
    icon: '🧱',
  },
  {
    name: 'Cleaning',
    description: 'Professional cleaning services',
    icon: '🧹',
  },
  {
    name: 'Gardening',
    description: 'Landscaping and garden maintenance',
    icon: '🌱',
  },
  {
    name: 'HVAC',
    description: 'Heating, ventilation, and air conditioning',
    icon: '❄️',
  },
];

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillbridge')
  .then(async () => {
    console.log('MongoDB Connected');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Insert new categories
    const insertedCategories = await Category.insertMany(categories);
    console.log('Categories seeded successfully:');
    insertedCategories.forEach(cat => {
      console.log(`  ${cat._id}: ${cat.name}`);
    });

    mongoose.disconnect();
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding categories:', error);
    process.exit(1);
  });
