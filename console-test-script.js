/**
 * Browser Console Test Script for API Debugging
 * 
 * INSTRUCTIONS:
 * 1. Open browser console (F12 > Console tab)
 * 2. Copy and paste this entire script
 * 3. Press Enter to run
 * 4. The script will test various API endpoints and show results
 */

(async function testAPI() {
  console.log('='.repeat(60));
  console.log('API ENDPOINT TESTING SCRIPT');
  console.log('='.repeat(60));
  
  // Configuration
  const BASE_URL = 'http://0.0.0.0:8000';
  const TEST_CREDENTIALS = {
    username: 'admin',
    password: 'password'
  };
  
  let authToken = null;
  
  // Helper function to make requests
  async function testEndpoint(name, method, url, body = null, requiresAuth = false) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`Testing: ${name}`);
    console.log(`${method} ${url}`);
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (requiresAuth && authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const options = {
      method,
      headers
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    try {
      const startTime = Date.now();
      const response = await fetch(url, options);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`Duration: ${duration}ms`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS');
        console.log('Response:', data);
        return { success: true, data, status: response.status };
      } else {
        const errorText = await response.text();
        console.log('❌ FAILED');
        console.log('Error:', errorText);
        return { success: false, error: errorText, status: response.status };
      }
    } catch (error) {
      console.log('❌ NETWORK ERROR');
      console.log('Error:', error.message);
      return { success: false, error: error.message, status: 0 };
    }
  }
  
  // Test Results Summary
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  function recordResult(name, success) {
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
    results.tests.push({ name, success });
  }
  
  // Test 1: Health Check
  console.log('\n' + '='.repeat(60));
  console.log('TEST 1: Backend Health Check');
  console.log('='.repeat(60));
  const healthCheck = await testEndpoint(
    'Health Check',
    'GET',
    `${BASE_URL}/health`,
    null,
    false
  );
  recordResult('Health Check', healthCheck.success);
  
  if (!healthCheck.success) {
    console.log('\n⚠️  WARNING: Backend is not accessible!');
    console.log('Make sure the backend server is running on', BASE_URL);
    console.log('\nSkipping remaining tests...');
    return;
  }
  
  // Test 2: Login
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Login');
  console.log('='.repeat(60));
  const loginResult = await testEndpoint(
    'Login',
    'POST',
    `${BASE_URL}/auth/login`,
    TEST_CREDENTIALS,
    false
  );
  recordResult('Login', loginResult.success);
  
  if (loginResult.success && loginResult.data.access_token) {
    authToken = loginResult.data.access_token;
    console.log('✅ Token obtained:', authToken.substring(0, 20) + '...');
    
    // Store token in localStorage for app use
    localStorage.setItem('auth_token', authToken);
    console.log('✅ Token saved to localStorage as "auth_token"');
  } else {
    console.log('❌ Failed to obtain auth token. Stopping tests.');
    return;
  }
  
  // Test 3: Get User Profile
  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: Get User Profile');
  console.log('='.repeat(60));
  const profileResult = await testEndpoint(
    'Get User Profile',
    'GET',
    `${BASE_URL}/auth/me`,
    null,
    true
  );
  recordResult('Get User Profile', profileResult.success);
  
  if (profileResult.success) {
    console.log('User Type:', profileResult.data.user_type);
    console.log('User ID:', profileResult.data.id);
  }
  
  // Test 4: Get Unit Names
  console.log('\n' + '='.repeat(60));
  console.log('TEST 4: Get Unit Names');
  console.log('='.repeat(60));
  const unitNamesResult = await testEndpoint(
    'Get Unit Names',
    'GET',
    `${BASE_URL}/auth/unit-names`,
    null,
    false
  );
  recordResult('Get Unit Names', unitNamesResult.success);
  
  // Test 5: Get All Units (Admin)
  console.log('\n' + '='.repeat(60));
  console.log('TEST 5: Get All Units (Protected)');
  console.log('='.repeat(60));
  const unitsResult = await testEndpoint(
    'Get All Units',
    'GET',
    `${BASE_URL}/admin/units`,
    null,
    true
  );
  recordResult('Get All Units', unitsResult.success);
  
  if (unitsResult.success) {
    console.log(`Found ${unitsResult.data.length || 0} units`);
  }
  
  // Test 6: Get Clergy Districts
  console.log('\n' + '='.repeat(60));
  console.log('TEST 6: Get Clergy Districts');
  console.log('='.repeat(60));
  const districtsResult = await testEndpoint(
    'Get Clergy Districts',
    'GET',
    `${BASE_URL}/system/districts`,
    null,
    true
  );
  recordResult('Get Clergy Districts', districtsResult.success);
  
  // Test 7: Get Admin Dashboard Stats
  console.log('\n' + '='.repeat(60));
  console.log('TEST 7: Get Admin Dashboard');
  console.log('='.repeat(60));
  const dashboardResult = await testEndpoint(
    'Get Admin Dashboard',
    'GET',
    `${BASE_URL}/admin/units/dashboard`,
    null,
    true
  );
  recordResult('Get Admin Dashboard', dashboardResult.success);
  
  // Test 8: Get Kalamela Individual Events
  console.log('\n' + '='.repeat(60));
  console.log('TEST 8: Get Kalamela Individual Events');
  console.log('='.repeat(60));
  const individualEventsResult = await testEndpoint(
    'Get Individual Events',
    'GET',
    `${BASE_URL}/kalamela/events/individual`,
    null,
    false
  );
  recordResult('Get Individual Events', individualEventsResult.success);
  
  // Test 9: Get Kalamela Group Events
  console.log('\n' + '='.repeat(60));
  console.log('TEST 9: Get Kalamela Group Events');
  console.log('='.repeat(60));
  const groupEventsResult = await testEndpoint(
    'Get Group Events',
    'GET',
    `${BASE_URL}/kalamela/events/group`,
    null,
    false
  );
  recordResult('Get Group Events', groupEventsResult.success);
  
  // Final Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`Passed: ✅ ${results.passed}`);
  console.log(`Failed: ❌ ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%`);
  
  console.log('\nDetailed Results:');
  results.tests.forEach((test, index) => {
    const icon = test.success ? '✅' : '❌';
    console.log(`  ${index + 1}. ${icon} ${test.name}`);
  });
  
  // Check localStorage
  console.log('\n' + '='.repeat(60));
  console.log('LOCALSTORAGE CHECK');
  console.log('='.repeat(60));
  const storedToken = localStorage.getItem('auth_token');
  if (storedToken) {
    console.log('✅ auth_token exists in localStorage');
    console.log('Token:', storedToken.substring(0, 30) + '...');
  } else {
    console.log('❌ No auth_token found in localStorage');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('TESTING COMPLETE');
  console.log('='.repeat(60));
  
  if (results.failed === 0) {
    console.log('🎉 All tests passed! Your API is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the details above.');
    console.log('\nCommon Issues:');
    console.log('1. Backend not running - Start your backend server');
    console.log('2. CORS errors - Check backend CORS configuration');
    console.log('3. Authentication errors - Check credentials or token handling');
  }
  
  return results;
})();

