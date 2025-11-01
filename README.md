# ReactNative-TaskAPP

This contains a React Native (Expo) app and a small Node.js/TypeScript server used for a task app with push notifications.

## What is in this repo

- `app/` - React Native application (Expo + native folders)
- `server/` - Node.js Express + Socket.IO server (TypeScript)

## Quick setup

Prerequisites:
- Node.js (16+ recommended)
- npm

1. Install dependencies for app and server


# from repo root
cd app; 
npm install; 
cd ../server; 
npm install; 



2. Environment

Create `.env` files in `server/` with DB credentials and other secrets. Example:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=taskapp
PORT=3000
```



3. Build and run server


# build
cd server
npm run build
# start
npm start
# or during development
npm run dev


4. Run the app


cd app
npx expo start


## Design notes

- The server is a lightweight Express app that uses `socket.io` for realtime messages and `mysql2/promise` for DB access.
- Push notification sending is handled by a small utility `server/src/utils/push.ts` that wraps Expo push API.
- Migrations and generated build outputs (`server/dist`) are not required to run the project and can be regenerated. Keep `src/` and `package.json` files.

## Tests

- Server tests use Jest + ts-jest. See `server/jest.config.cjs`.
- A short `TESTS.md` provides commands and sample coverage output.

