const axios = require('axios');
const assert = require('assert');

const API_URL = 'http://localhost:3000/api';
let authToken = '';
let userId = '';
let sessionId = '';

async function testUserRegistration() {
  try {
    const response = await axios.post(`${API_URL}/users/register`, {
      username: 'testuser',
      password: 'testpass123',
      email: 'test@example.com'
    });
    
    assert.strictEqual(response.status, 201);
    assert.ok(response.data.token);
    assert.ok(response.data.user);
    console.log('✅ User registration test passed');
    
    authToken = response.data.token;
    userId = response.data.user.id;
  } catch (error) {
    console.error('❌ User registration test failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testUserLogin() {
  try {
    const response = await axios.post(`${API_URL}/users/login`, {
      username: 'testuser',
      password: 'testpass123'
    });
    
    assert.strictEqual(response.status, 200);
    assert.ok(response.data.token);
    assert.ok(response.data.user);
    console.log('✅ User login test passed');
    
    authToken = response.data.token;
  } catch (error) {
    console.error('❌ User login test failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testCreateSession() {
  try {
    const response = await axios.post(
      `${API_URL}/sessions`,
      {
        english_level: 'middle/grade7',
        interests: ['sports', 'music'],
        targetWords: ['apple', 'banana', 'orange']
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    assert.strictEqual(response.status, 200);
    assert.ok(response.data.id);
    assert.ok(response.data.article);
    console.log('✅ Create session test passed');
    
    sessionId = response.data.id;
  } catch (error) {
    console.error('❌ Create session test failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testGetArticles() {
  try {
    const response = await axios.get(
      `${API_URL}/sessions/${sessionId}/articles`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    assert.strictEqual(response.status, 200);
    assert.ok(Array.isArray(response.data));
    console.log('✅ Get articles test passed');
  } catch (error) {
    console.error('❌ Get articles test failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testGetQuizQuestions() {
  try {
    const response = await axios.get(
      `${API_URL}/sessions/${sessionId}/quiz`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );
    
    assert.strictEqual(response.status, 200);
    assert.ok(Array.isArray(response.data));
    console.log('✅ Get quiz questions test passed');
  } catch (error) {
    console.error('❌ Get quiz questions test failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testUnauthorizedAccess() {
  try {
    await axios.get(
      `${API_URL}/sessions/${sessionId}/articles`,
      {
        headers: { Authorization: 'Bearer invalid_token' }
      }
    );
    console.error('❌ Unauthorized access test failed: Should have received 401');
  } catch (error) {
    assert.strictEqual(error.response.status, 401);
    console.log('✅ Unauthorized access test passed');
  }
}

async function runTests() {
  try {
    console.log('Starting API tests...\n');
    
    await testUserRegistration();
    await testUserLogin();
    await testCreateSession();
    await testGetArticles();
    await testGetQuizQuestions();
    await testUnauthorizedAccess();
    
    console.log('\nAll tests completed successfully! 🎉');
  } catch (error) {
    console.error('\nTests failed:', error);
    process.exit(1);
  }
}

runTests(); 