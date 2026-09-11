const mongoose = require('mongoose');

const usernames = ['nishithaanchan39_db_user', 'nishithaanchan39', 'Nishipujry_8', 'Nishitha08', 'admin'];
const passwords = ['Nishipujry_8', 'Nishitha08', 'nishithaanchan39_db_user'];

async function testCombos() {
  for (const user of usernames) {
    for (const pass of passwords) {
      const uri = `mongodb://${user}:${pass}@ac-c4fmk0a-shard-00-00.entzv4n.mongodb.net:27017,ac-c4fmk0a-shard-00-01.entzv4n.mongodb.net:27017,ac-c4fmk0a-shard-00-02.entzv4n.mongodb.net:27017/parks-monitoring?ssl=true&replicaSet=atlas-9nk2zn-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0`;
      try {
        console.log(`Testing ${user}:${pass} ...`);
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
        console.log(`\n\nSUCCESS! Username: ${user}, Password: ${pass}\n\n`);
        process.exit(0);
      } catch (err) {
        if (err.message.includes('bad auth')) {
            console.log('  -> bad auth');
        } else {
            console.log('  -> ' + err.message);
        }
      }
    }
  }
  console.log('All combinations failed.');
  process.exit(1);
}
testCombos();
