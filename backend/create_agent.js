const mongoose = require('mongoose');
const User = require('./models/user');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to DB');

        const mobile = '9999999999';
        try {
            let agent = await User.findOne({ mobile });
            if (agent) {
                console.log('Agent already exists:', agent.mobile);
                agent.role = 'delivery_partner'; // Ensure role
                agent.password = 'agent'; // Reset password
                await agent.save();
            } else {
                agent = await User.create({
                    name: 'Test Agent',
                    mobile,
                    password: 'agent',
                    role: 'delivery_partner',
                    email: 'agent@test.com'
                });
                console.log('Agent created:', agent.mobile);
            }
        } catch (err) {
            console.error(err);
        } finally {
            mongoose.disconnect();
        }
    })
    .catch(err => console.error(err));
