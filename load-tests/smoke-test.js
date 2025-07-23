import http from 'k6/http';
import { check, sleep } from 'k6';

// Smoke test configuration - minimal load to verify basic functionality
export let options = {
  vus: 1, // Single virtual user
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% of requests under 5s
    http_req_failed: ['rate<0.1'],     // Error rate under 10%
    checks: ['rate>0.9'],              // 90% of checks should pass
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://staging.chasewhiterabbit.sxc.codes';

export function setup() {
  console.log(`Running smoke test against: ${BASE_URL}`);
  return { baseUrl: BASE_URL };
}

export default function (data) {
  // Test critical endpoints
  testHealthEndpoint(data.baseUrl);
  testHomePage(data.baseUrl);
  testAPIEndpoints(data.baseUrl);
  
  sleep(1);
}

function testHealthEndpoint(baseUrl) {
  console.log('Testing health endpoint...');
  let response = http.get(`${baseUrl}/health`);
  
  check(response, {
    'Health endpoint status is 200': (r) => r.status === 200,
    'Health endpoint responds quickly': (r) => r.timings.duration < 1000,
  });
}

function testHomePage(baseUrl) {
  console.log('Testing homepage...');
  let response = http.get(`${baseUrl}/`);
  
  check(response, {
    'Homepage status is 200': (r) => r.status === 200,
    'Homepage loads quickly': (r) => r.timings.duration < 3000,
    'Homepage has content': (r) => r.body.length > 0,
  });
}

function testAPIEndpoints(baseUrl) {
  console.log('Testing API endpoints...');
  
  // Test ready endpoint
  let readyResponse = http.get(`${baseUrl}/ready`);
  check(readyResponse, {
    'Ready endpoint accessible': (r) => r.status < 500,
  });
  
  // Test metrics endpoint if available
  let metricsResponse = http.get(`${baseUrl}/metrics`);
  check(metricsResponse, {
    'Metrics endpoint accessible': (r) => r.status < 500,
  });
}

export function teardown(data) {
  console.log('Smoke test completed');
}
