const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/splitwise').then(async () => {
  const db = mongoose.connection.db;
  const groups = await db.collection('groups').find({}).toArray();
  console.log(groups.map(g => ({ id: g._id, name: g.name, currency: g.currency })));
  
  await db.collection('groups').updateMany({}, { $set: { currency: 'INR' } });
  console.log('Updated all groups to INR');
  process.exit(0);
});
