# 🚀 Quick Start Guide

## 5-Minute Setup

### Step 1: Setup Directories (1 min)

```bash
cd driver-tracking-app
```

### Step 2: Configure Backend (2 min)

```bash
cd backend

# Copy and configure environment
cp .env.example .env
# Edit .env with your MongoDB credentials

# Install dependencies
npm install
```

### Step 3: Configure Frontend (2 min)

```bash
cd ../frontend
npm install
```

---

## Running Locally

### Terminal 1 - Backend

```bash
cd backend
npm run dev
```

✅ Backend runs at `http://localhost:5000`

### Terminal 2 - Frontend

```bash
cd frontend
npm run dev
```

✅ Frontend runs at `http://localhost:5173`

---

## 🧪 Quick Test

### Test Driver Page

1. Open http://localhost:5173
2. Click "🚚 Driver Dashboard"
3. Allow location access when prompted
4. You should see:
   - 🟢 Connection status
   - Button to "Start Tracking"
   - Trip ID when tracking starts

### Test Customer Page

1. Open new tab: http://localhost:5173
2. Click "📦 Customer Tracking"
3. Enter the Trip ID from driver page
4. Click "Track Delivery"
5. You should see:
   - Live map with driver location
   - Distance and ETA
   - Live updates as driver moves

---

## 🐛 Troubleshooting

### Connection Issues

- Check backend is running: `http://localhost:5000`
- Check `.env` file has correct `CLIENT_URL`
- Check browser console for errors

### MongoDB Connection Failed

- Verify `MONGODB_URI` in `.env` is correct
- Check MongoDB credentials
- Ensure IP address is whitelisted in MongoDB Atlas

### Geolocation Not Working

- Check browser has location permission
- Must use HTTPS in production (or localhost for dev)
- Try in a different browser

### Map Not Showing

- Verify Leaflet is installed: `npm list leaflet`
- Check browser console for CDN errors
- Try clearing browser cache

---

## 📋 Environment Setup (.env)

```env
PORT=5000
CLIENT_URL=http://localhost:5173

# Get from MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
```

---

## 🎨 Features to Try

✅ Real-time GPS tracking
✅ Live map updates
✅ Connection status indicators
✅ Error handling
✅ Responsive design
✅ Modern UI with gradients

---

## 📞 Need Help?

1. Check IMPROVEMENTS.md for detailed changes
2. Check README.md for full documentation
3. Check browser console for error messages
4. Verify all requirements are installed

---

**Ready to go! Happy tracking! 🚀**
