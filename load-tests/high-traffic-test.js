import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
export let errorRate = new Rate('errors');
export let responseTimeTrend = new Trend('response_time');

// Test configuration
export let options = {
  scenarios: {
    // Gradual ramp-up to simulate realistic traffic patterns
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 20 },   // Ramp up to 20 users
        { duration: '5m', target: 50 },   // Stay at 50 users
        { duration: '2m', target: 100 },  // Ramp up to 100 users
        { duration: '5m', target: 100 },  // Stay at 100 users
        { duration: '3m', target: 200 },  // Peak load
        { duration: '5m', target: 200 },  // Sustain peak
        { duration: '2m', target: 0 },    // Ramp down
      ],
    },
    // Spike test to check system resilience
    spike_test: {
      executor: 'ramping-vus',
      startTime: '20m',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 500 }, // Sudden spike
        { duration: '1m', target: 500 },  // Sustain spike
        { duration: '30s', target: 0 },   // Quick ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.05'],    // Error rate under 5%
    checks: ['rate>0.95'],             // 95% of checks should pass
  },
  ext: {
    loadimpact: {
      distribution: {
        'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 50 },
        'amazon:eu:dublin': { loadZone: 'amazon:eu:dublin', percent: 25 },
        'amazon:ap:singapore': { loadZone: 'amazon:ap:singapore', percent: 25 },
      },
    },
  },
};

// Base URL - should be updated for your staging environment
const BASE_URL = __ENV.BASE_URL || 'https://staging.chasewhiterabbit.sxc.codes';

// Test data
const testUsers = [
  { username: 'testuser1', email: 'test1@example.com' },
  { username: 'testuser2', email: 'test2@example.com' },
  { username: 'testuser3', email: 'test3@example.com' },
];

export function setup() {
  console.log(`Starting load test against: ${BASE_URL}`);
  
  // Verify the application is accessible
  let response = http.get(`${BASE_URL}/health`);
  if (response.status !== 200) {
    throw new Error(`Application not accessible. Status: ${response.status}`);
  }
  
  return { baseUrl: BASE_URL };
}

export default function (data) {
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];
  
  // Test various endpoints with realistic user behavior
  testHomePage(data.baseUrl);
  sleep(1 + Math.random() * 2); // Random pause 1-3 seconds
  
  testAPIEndpoints(data.baseUrl);
  sleep(0.5 + Math.random()); // Random pause 0.5-1.5 seconds
  
  testUserInteractions(data.baseUrl, user);
  sleep(2 + Math.random() * 3); // Longer pause between user sessions
}

function testHomePage(baseUrl) {
  let response = http.get(`${baseUrl}/`);
  
  let success = check(response, {
    'Homepage status is 200': (r) => r.status === 200,
    'Homepage loads in reasonable time': (r) => r.timings.duration < 3000,
    'Homepage contains expected content': (r) => r.body.includes('ChaseWhiteRabbit'),
  });
  
  errorRate.add(!success);
  responseTimeTrend.add(response.timings.duration);
}

function testAPIEndpoints(baseUrl) {
  const endpoints = [
    '/api/health',
    '/api/status',
    '/api/metrics',
    '/api/projects',
    '/api/users/profile',
  ];
  
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  let response = http.get(`${baseUrl}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'k6-load-test/1.0',
    },
  });
  
  let success = check(response, {
    [`${endpoint} status is 200 or 404`]: (r) => r.status === 200 || r.status === 404,
    [`${endpoint} response time OK`]: (r) => r.timings.duration < 5000,
  });
  
  errorRate.add(!success);
  responseTimeTrend.add(response.timings.duration);
}

function testUserInteractions(baseUrl, user) {
  // Simulate user registration/login flow
  let loginPayload = JSON.stringify({
    username: user.username,
    email: user.email,
    action: 'login_attempt'
  });
  
  let response = http.post(`${baseUrl}/api/auth/login`, loginPayload, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  let success = check(response, {
    'Auth endpoint accessible': (r) => r.status < 500,
    'Auth response time OK': (r) => r.timings.duration < 3000,
  });
  
  errorRate.add(!success);
  responseTimeTrend.add(response.timings.duration);
  
  // Simulate some user actions
  if (response.status < 400) {
    // Test user dashboard or profile
    let dashboardResponse = http.get(`${baseUrl}/dashboard`, {
      headers: {
        'Authorization': response.headers['Authorization'] || 'Bearer test-token',
      },
    });
    
    check(dashboardResponse, {
      'Dashboard accessible': (r) => r.status < 500,
    });
  }
}

export function teardown(data) {
  console.log('Load test completed successfully');
  console.log(`Tested against: ${data.baseUrl}`);
}
