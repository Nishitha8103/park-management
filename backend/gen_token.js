const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 'dummy_id' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
console.log(token);
