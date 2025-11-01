/* eslint-disable no-console */
const BASE = 'https://script.google.com/macros/s/AKfycbwAqTHxDLVU6zAAyn4IPzzSrXLk7Z3QvcF4-vScBAsAgdsHDewzJfXE3Rm_xTjoJENl/exec';
const ORIGIN = process.env.TEST_ORIGIN || 'https://ai-auto-mail-system.netlify.app';

async function testGet() {
  const url = `${BASE}?action=getSettings&origin=${encodeURIComponent(ORIGIN)}&v=${Date.now()}`;
  const res = await fetch(url);
  const allow = res.headers.get('access-control-allow-origin');
  console.log('[GET] status:', res.status);
  console.log('[GET] Access-Control-Allow-Origin:', allow);
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    console.log('[GET] Response JSON:', json);
  } catch (error) {
    console.log('[GET] Response Text:', text);
  }
}

async function testPost() {
  const url = `${BASE}?origin=${encodeURIComponent(ORIGIN)}&v=${Date.now()}`;
  const payload = {
    action: 'login',
    email: 'dummy@example.com',
    password: 'dummy-password'
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain'
    },
    body: JSON.stringify(payload)
  });
  const allow = res.headers.get('access-control-allow-origin');
  console.log('[POST] status:', res.status);
  console.log('[POST] Access-Control-Allow-Origin:', allow);
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    console.log('[POST] Response JSON:', json);
  } catch (error) {
    console.log('[POST] Response Text:', text);
  }
}

(async () => {
  try {
    await testGet();
    await testPost();
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
})();
