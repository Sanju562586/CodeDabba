const bcrypt = require('bcrypt');

async function test() {
    const match1 = await bcrypt.compare('Sanju@126#', '$2b$10$COvoabjt1lABueZQv0Zoju6IyPOyJN49Us1ZrPNV96GKvw/E6ZmzK');
    console.log("sanjaykumardupati6 match:", match1);
    
    const match2 = await bcrypt.compare('Sneha@123#', '$2b$10$JrDJQd6eS0IblF8g4yfS3.LyUdGBDpQyH6GFdlw8Gp0obcdkU1U0K');
    console.log("sneha.amballa0804 match:", match2);
}

test();
