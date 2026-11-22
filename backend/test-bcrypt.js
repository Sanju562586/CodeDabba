const bcrypt = require('bcrypt');

async function test() {
    const hash = await bcrypt.hash('TestPassword123!', 10);
    const match = await bcrypt.compare('TestPassword123!', hash);
    console.log("bcrypt self-test match:", match);
}

test();
