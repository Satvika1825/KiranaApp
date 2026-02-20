const fetch = require('node-fetch'); // Ensure node-fetch is available or use global fetch in Node 18+

const API_URL = 'http://localhost:5000/api/auth';
const TEST_MOBILE = '9999999999';
const TEST_PASSWORD = 'password123';

async function testAuthFlow() {
    console.log('Starting Auth Flow Test...');

    try {
        // 1. Send OTP
        console.log('\n1. Sending OTP...');
        const sendOtpRes = await fetch(`${API_URL}/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile: TEST_MOBILE })
        });

        const sendOtpData = await sendOtpRes.json();
        console.log('Send OTP Status:', sendOtpRes.status);
        console.log('Send OTP Response:', sendOtpData);

        if (!sendOtpRes.ok) throw new Error('Failed to send OTP');

        const otp = sendOtpData.otp;
        if (!otp) throw new Error('OTP not received in response (Enable dev mode to see OTP in response)');

        console.log('Received OTP:', otp);

        // 2. Verify OTP & Register
        console.log('\n2. Verifying OTP...');
        const verifyRes = await fetch(`${API_URL}/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mobile: TEST_MOBILE,
                otp: otp,
                name: 'Test Owner',
                email: 'test@example.com',
                role: 'kirana_owner',
                password: TEST_PASSWORD
            })
        });

        const verifyData = await verifyRes.json();
        console.log('Verify OTP Status:', verifyRes.status);
        console.log('Verify OTP Response:', verifyData);

        if (!verifyRes.ok) throw new Error('Failed to verify OTP');

        // 3. Login
        console.log('\n3. Logging in...');
        const loginRes = await fetch(`${API_URL}/login-owner`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mobile: TEST_MOBILE,
                password: TEST_PASSWORD
            })
        });

        const loginData = await loginRes.json();
        console.log('Login Status:', loginRes.status);
        console.log('Login Response:', loginData);

        if (!loginRes.ok) throw new Error('Login failed');

        console.log('\nSUCCESS: Auth flow completed successfully!');

    } catch (error) {
        console.error('\nFAILED:', error.message);
    }
}

testAuthFlow();
