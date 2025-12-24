use('viral-ideas');
db.createCollection('schedules');
db.getCollection('schedules').insertOne({
  postId: 'test1',
  content: 'Test LinkedIn post',
  scheduleTime: new Date('2025-08-31T06:00:00Z'),
  status: 'pending'
});
db.getCollection('schedules').find({}).limit(1);