import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
export let errorRate = new Rate('errors');
export let responseTimeTrend = new Trend('response_time');

// Stress test configuration - pushes system beyond normal capacity
export let options = {
  stages: [
    { duration: '2m', target: 50 },   // Warm up
    { duration: '5m', target: 100 },  // Normal load
    { duration: '5m', target: 200 },  // High load
    { duration: '5m', target: 300 },  // Stress point
    { duration: '5m', target: 400 },  // Push further
    { duration: '5m', target: 500 },  // Breaking point
    { duration: '3m', target: 0 },    // Recovery
  ],
  thresholds: {
    // More lenient thresholds for stress testing
    http_req_duration: ['p(95)<10000'], // 95% under 10s
    http_req_failed: ['rate<0.5'],      // Allow up to 50% failures
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://staging.chasewhiterabbit.sxc.codes';

export function setup() {
  console.log(`Starting stress test against: ${BASE_URL}`);
  console.log('WARNING: This test will push the system to its limits!');
  
  // Quick health check
  let response = http.get(`${BASE_URL}/health`);
  if (response.status !== 200) {
    console.warn(`Health check failed. Status: ${response.status}`);
  }
  
  return { baseUrl: BASE_URL };
}

export default function (data) {
  // Aggressive testing pattern
  let responses = [];
  
  // Burst of requests to simulate heavy load
  for (let i = 0; i < 3; i++) {
    let response = http.get(`${data.baseUrl}/`);
    responses.push(response);
    
    let success = check(response, {
      'Status is not 5xx': (r) => r.status < 500,
      'Response time acceptable': (r) => r.timings.duration < 15000,
    });
    
    errorRate.add(!success);
    responseTimeTrend.add(response.timings.duration);
    
    // Very short sleep between burst requests
    sleep(0.1);
  }
  
  // Test API under stress
  let apiResponse = http.get(`${data.baseUrl}/api/health`);
  check(apiResponse, {
    'API still responsive': (r) => r.status < 500,
  });
  
  // Slightly longer pause between user sessions
  sleep(0.5 + Math.random() * 0.5);
}

export function teardown(data) {
  console.log('Stress test completed');
  console.log('Check monitoring dashboards for system behavior during stress');
}
