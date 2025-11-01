# Running tests

All server tests live under `server/src/tests` and use Jest + ts-jest.

From the repo root run:


cd server
npm test


This runs jest and prints results. To collect coverage:


npx jest --coverage


Sample results (this project includes a small tested module `server/src/utils/push.ts`):

```
 PASS  src/tests/push.test.ts
  sendPushNotification
    √ returns parsed json result when fetch succeeds (5 ms)
    √ returns null when fetch throws (1 ms)

-----------|---------|----------|---------|---------|-------------------
File       | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-----------|---------|----------|---------|---------|-------------------
All files  |    4.91 |        2 |       5 |    4.94 | 
 src       |       0 |        0 |       0 |       0 | 
  db.ts    |       0 |        0 |     100 |       0 | 1-16
  index.ts |       0 |        0 |       0 |       0 | 1-512
 src/utils |     100 |      100 |     100 |     100 | 
  push.ts  |     100 |      100 |     100 |     100 | 
-----------|---------|----------|---------|---------|-------------------
Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
```

 `src/utils/push.ts` shows 100% coverage (>50% requirement met). 