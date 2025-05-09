const axios = require('axios');
const assert = require('assert');

const API_BASE = 'http://localhost:3000/api';

async function testCreateSession() {
  const payload = {
    english_level: 'primary/grade1',
    interests: ['音乐', '科技'],
    targetWords: ['apple', 'banana']
  };
  const res = await axios.post(`${API_BASE}/sessions`, payload);
  assert(res.data.id, 'Session id should exist');
  assert(res.data.englishLevel === payload.english_level, 'englishLevel should match');
  console.log('✅ 创建会话接口通过');
  return res.data.id;
}

async function testGetArticles(sessionId) {
  const res = await axios.get(`${API_BASE}/sessions/${sessionId}/articles`);
  assert(Array.isArray(res.data), 'Articles should be an array');
  assert(res.data[0].chineseText && res.data[0].englishText, 'Article should have chineseText and englishText');
  console.log('✅ 获取文章接口通过');
}

async function testGetQuiz(sessionId) {
  const res = await axios.get(`${API_BASE}/sessions/${sessionId}/quiz`);
  assert(Array.isArray(res.data), 'Quiz should be an array');
  assert(res.data[0].question && res.data[0].options, 'Quiz should have question and options');
  console.log('✅ 获取测验题接口通过');
}

(async () => {
  try {
    const sessionId = await testCreateSession();
    await new Promise(r => setTimeout(r, 8000)); // 等待AI生成
    await testGetArticles(sessionId);
    await testGetQuiz(sessionId);
    console.log('🎉 所有接口自动化测试通过');
  } catch (e) {
    console.error('❌ 测试失败:', e.message);
    process.exit(1);
  }
})(); 