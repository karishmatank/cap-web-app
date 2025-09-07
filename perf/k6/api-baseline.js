import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '45s', target: 30 },
        { duration: '2m', target: 30 },
        { duration: '15s', target: 0 }
    ],
    thresholds: {
        http_req_duration: ['p(95)<1000'],
        http_req_failed: ['rate<0.01']
    }
};

export default function() {
    // const res = http.get('https://apex-cap.onrender.com/core/loadtest/test-list/');
    const res = http.get('https://apex-cap.onrender.com/core/loadtest/test-database-call/');
    check(res, { 'status was 200': (r) => r.status === 200 });
    sleep(10);
}