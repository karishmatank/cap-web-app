import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const dbMs = new Trend('db_ms');
const serMs = new Trend('serialize_ms');

export const options = {
    // stages: [
    //     { duration: '45s', target: 30 },
    //     { duration: '2m', target: 30 },
    //     { duration: '15s', target: 0 }
    // ],
    thresholds: {
        // http_req_duration: ['p(95)<1000'],
        // http_req_failed: ['rate<0.01'],
        db_ms: ['p(95)<300'],
        serialize_ms: ['p(95)<50'],
    }
};

export default function() {
    // const res = http.get('https://apex-cap.onrender.com/core/loadtest/test-list/');
    const res = http.get('https://apex-cap.onrender.com/core/loadtest/test-database-call/');

    const hdrs = {};
    for (const k in res.headers) hdrs[k.toLowerCase()] = res.headers[k];
    dbMs.add(Number(hdrs['db-ms'] || 0));
    serMs.add(Number(hdrs['serialize-ms'] || 0));

    check(res, { 'status was 200': (r) => r.status === 200 });
    sleep(10);
}