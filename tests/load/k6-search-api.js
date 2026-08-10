import http from 'k6/http';
import { check, sleep } from 'k6';

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp up to 50 users
    { duration: '1m', target: 200 }, // Ramp up to 200 users and hold
    { duration: '30s', target: 0 },  // Scale down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests should be below 200ms
    http_req_failed: ['rate<0.01'],   // Error rate should be less than 1%
  },
};

const BASE_URL = 'http://localhost:3000/api'; // Update to your API URL

export default function () {
  // Simulate hitting the public categories and locations list
  const responses = http.batch([
    ['GET', `${BASE_URL}/categories`],
    ['GET', `${BASE_URL}/countries`],
  ]);

  check(responses[0], {
    'categories status is 200': (r) => r.status === 200,
  });

  check(responses[1], {
    'countries status is 200': (r) => r.status === 200,
  });

  sleep(1); // Think time between requests
}
