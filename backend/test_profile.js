const axios = require('axios');
async function test() {
   try {
     const res1 = await axios.post('http://localhost:5000/api/auth/register', { username: 'testuserxx', password: 'password', full_name: 'test', phone: '123' });
     console.log('Register:', res1.data);
   } catch(e) {}
   try {
     const res1 = await axios.post('http://localhost:5000/api/auth/login', { username: 'testuserxx', password: 'password' });
     console.log('Login:', res1.data);
     if (res1.data.user) {
        const res2 = await axios.put(`http://localhost:5000/api/auth/profile/${res1.data.user.id}`, {
            current_password: 'password',
            full_name: 'Admin Test',
            phone: '0123456789'
        });
        console.log('Update:', res2.data);
     }
   } catch (e) {
     console.error('Error:', e.response?.data || e.message);
   }
}
test();
