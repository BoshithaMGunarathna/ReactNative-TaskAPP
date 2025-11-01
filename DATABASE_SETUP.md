# ⚙️ RAILWAY DATABASE SETUP - FINAL STEP

## 🔴 **ACTION REQUIRED: Configure Database Connection**

Your Railway backend is running, but the database connection needs to be configured.

---

## 📋 **SETUP STEPS**

### **Step 1: Add MySQL Service to Railway (if not done)**

1. Go to Railway dashboard: https://railway.app
2. Select your project: `ReactNative-TaskAPP`
3. Click **"+ New"** button
4. Select **"Database"** → **"Add MySQL"**
5. Wait for MySQL to provision (~30 seconds)

### **Step 2: Link Database to Backend Service**

1. In Railway dashboard, click on your **backend service**
2. Go to **"Variables"** tab
3. Click **"+ New Variable"** → **"Add Reference"**
4. Select your MySQL service
5. Add these variable references:

   | Variable Name | Reference To (from MySQL service) |
   |---------------|-----------------------------------|
   | `DB_HOST` | `MYSQLHOST` |
   | `DB_USER` | `MYSQLUSER` |
   | `DB_PASSWORD` | `MYSQLPASSWORD` |
   | `DB_NAME` | `MYSQLDATABASE` |

6. Click **"Save"** - Railway will auto-redeploy

### **Step 3: Create Database Tables**

Once the backend redeploys with database variables:

#### **Option A: Via Railway CLI (Recommended)**

```powershell
# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
cd D:\projects\ReactNative-TaskAPP\server
railway link

# Run migrations
railway run npm run migrate:all
```

#### **Option B: Connect with MySQL Client**

1. In Railway → MySQL service → **"Connect"** tab
2. Copy the connection URL
3. Use MySQL Workbench, DBeaver, or CLI:
   ```powershell
   mysql -h [HOST] -P [PORT] -u [USER] -p[PASSWORD] [DATABASE]
   ```
4. Run these SQL commands:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  push_token VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  recipient_id INT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (recipient_id) REFERENCES users(id)
);
```

### **Step 4: Verify Database Connection**

```powershell
Invoke-WebRequest -Uri "https://reactnative-taskapp-production.up.railway.app/db-check" -UseBasicParsing
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "Database connection successful"
}
```

### **Step 5: Test API Endpoints**

```powershell
# Test stats endpoint (should work now)
Invoke-WebRequest -Uri "https://reactnative-taskapp-production.up.railway.app/api/stats" -UseBasicParsing
```

**Expected Response:**
```json
{
  "totalUsers": 0,
  "activeUsers": 0
}
```

---

## ✅ **VERIFICATION CHECKLIST**

After completing the steps above:

- [ ] MySQL service added to Railway project
- [ ] Environment variables linked (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)
- [ ] Backend service redeployed with new variables
- [ ] Database tables created (users, messages)
- [ ] `/db-check` endpoint returns 200 OK
- [ ] `/api/stats` endpoint returns user counts
- [ ] App can register users
- [ ] App can send/receive messages

---

## 🐛 **TROUBLESHOOTING**

### **Error: "getaddrinfo ENOTFOUND mysql.railway.internal"**
- **Cause:** Database environment variables not set
- **Fix:** Complete Step 2 above - link MySQL variables to backend service

### **Error: "Access denied for user"**
- **Cause:** Wrong credentials
- **Fix:** Verify variables are referencing MySQL service correctly

### **Error: "Table doesn't exist"**
- **Cause:** Database tables not created
- **Fix:** Complete Step 3 - run migrations or SQL commands

### **Backend shows "Restarting" continuously**
- **Cause:** Server crashes on startup due to DB errors
- **Fix:** Check Railway logs, verify all env variables are set

---

## 📊 **CURRENT STATUS**

✅ **Working:**
- Backend server is running
- Health endpoint responding
- Expo app published and accessible
- Socket.IO configured
- Frontend connects to backend URL

⚠️ **Needs Configuration:**
- Database connection (follow steps above)
- Database tables creation
- API endpoints requiring database

---

## 🎯 **NEXT STEPS**

1. Complete database setup (Steps 1-3 above)
2. Verify all endpoints work (Step 4-5)
3. Test app registration and messaging
4. Mark acceptance criteria as complete

---

## 📞 **QUICK LINKS**

- **Railway Dashboard:** https://railway.app
- **Backend Service:** https://reactnative-taskapp-production.up.railway.app
- **Health Check:** https://reactnative-taskapp-production.up.railway.app/health ✅
- **DB Check:** https://reactnative-taskapp-production.up.railway.app/db-check ⚠️
- **API Stats:** https://reactnative-taskapp-production.up.railway.app/api/stats ⚠️

---

**Note:** Once database is configured, all features will work end-to-end!
