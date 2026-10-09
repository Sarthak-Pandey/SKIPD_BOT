const http = require('http');

async function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Testing POST /api/chat independently ---');

  // Test 1: Valid message
  const t1 = await makeRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/chat',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    JSON.stringify({ message: 'How do I use Glowscreen?' })
  );
  console.log('Test 1 (Valid message): Status =', t1.status, '| Response =', t1.body);
  if (t1.status !== 200 || !t1.body.reply) {
    throw new Error('Test 1 failed!');
  }

  // Test 2: Empty message
  const t2 = await makeRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/chat',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    JSON.stringify({ message: '' })
  );
  console.log('Test 2 (Empty message): Status =', t2.status, '| Error =', t2.body);
  if (t2.status !== 400) {
    throw new Error('Test 2 failed!');
  }

  // Test 3: Whitespace only message
  const t3 = await makeRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/chat',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    JSON.stringify({ message: '     ' })
  );
  console.log('Test 3 (Whitespace message): Status =', t3.status, '| Error =', t3.body);
  if (t3.status !== 400) {
    throw new Error('Test 3 failed!');
  }

  // Test 4: Missing message property
  const t4 = await makeRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/chat',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    JSON.stringify({})
  );
  console.log('Test 4 (Missing message): Status =', t4.status, '| Error =', t4.body);
  if (t4.status !== 400) {
    throw new Error('Test 4 failed!');
  }

  // Test 5: Message is not a string
  const t5 = await makeRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/chat',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    JSON.stringify({ message: 12345 })
  );
  console.log('Test 5 (Non-string message): Status =', t5.status, '| Error =', t5.body);
  if (t5.status !== 400) {
    throw new Error('Test 5 failed!');
  }

  // Test 6: Message exceeds limit
  const t6 = await makeRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/chat',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    JSON.stringify({ message: 'a'.repeat(1005) })
  );
  console.log('Test 6 (Message > 1000 chars): Status =', t6.status, '| Error =', t6.body);
  if (t6.status !== 400) {
    throw new Error('Test 6 failed!');
  }

  // Test 7: Malformed JSON
  const t7 = await makeRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/chat',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    '{ invalid json '
  );
  console.log('Test 7 (Malformed JSON): Status =', t7.status, '| Error =', t7.body);
  if (t7.status !== 400) {
    throw new Error('Test 7 failed!');
  }

  // Test 8: GET request (unsupported method)
  const t8 = await makeRequest(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/api/chat',
      method: 'GET',
    },
    null
  );
  console.log('Test 8 (GET method on POST route): Status =', t8.status);
  if (t8.status !== 405) {
    throw new Error('Test 8 failed! Expected 405 Method Not Allowed');
  }

  console.log('\n--- ALL API UNIT TESTS PASSED SUCCESSFULLY ---');
}

runTests().catch((err) => {
  console.error('API Testing failed:', err);
  process.exit(1);
});
