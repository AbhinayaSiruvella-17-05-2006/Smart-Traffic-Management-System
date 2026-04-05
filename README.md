# 🚦 Smart Traffic Management System

## 📌 Overview

Smart Traffic Management System is an intelligent traffic monitoring solution that leverages **computer vision and real-time data processing** to analyze traffic conditions, detect vehicles, and assist in traffic signal optimization.

The system integrates a modern frontend interface with a powerful backend powered by **YOLO (You Only Look Once)** for vehicle detection.

---

## 🌐 Live Links

* 🔗 **Frontend:** https://traffic-frontend-3rp9.onrender.com
* 🔗 **Backend:** https://traffic-backend-svv7.onrender.com

---

## 🎥 Project Demonstration

Due to performance limitations, a complete working demonstration is provided here:

👉 https://drive.google.com/file/d/1YZOdzvLRjz76NiuPg2FPZ6zIUDbrnxHT/view?usp=drive_link

---

## ⚙️ Features

* 🚗 Real-time vehicle detection using YOLOv8
* 📊 Traffic density analysis
* 🚦 Smart signal control simulation
* 🗺️ Route finding system
* 🌦️ Weather alerts integration
* 🧠 Traffic awareness quiz module
* 🌐 Interactive frontend dashboard

---

## 🧠 Tech Stack

### Frontend

* React + TypeScript
* Vite
* Tailwind CSS

### Backend

* Python (Flask-based services)
* YOLOv8 (Ultralytics models)
* REST APIs

---

## ⚠️ Performance Note

This project uses **YOLOv8 models**, which are computationally intensive and require significant memory and processing power.

* ⏳ Backend responses may take more time
* 💾 High memory usage during detection
* ⚠️ Real-time processing may feel slow in limited environments

👉 For a smooth understanding of the system, refer to the demo video above.

---

## 🔗 Backend Configuration (Important)

The project currently uses the following backend URL in the code:

```
https://traffic-backend-svv7.onrender.com/
```

---

### 🖥️ If You Want to Run This Project on Your Machine (Locally)

You need to update the backend URL in the frontend code to:

```js
const BASE_URL = "http://localhost:5000";
```

✔ Make sure your backend server is running on port `5000` before starting the frontend.

---

### ⚠️ Important Note

* The default URL in the repository is not meant for local execution
* If you want to use the project locally, you **must replace it with `http://localhost:5000`**
* Otherwise, the application will not work correctly

---

### 💡 Summary

| Usage               | Backend URL                                |
| ------------------- | ------------------------------------------ |
| Run on your machine | http://localhost:5000                      |
| Default in code     | https://traffic-backend-svv7.onrender.com/ |

---

## 🚀 Running Locally

### Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend

```bash
npm install
npm run dev
```

---

## 💡 Future Improvements

* Optimize YOLO model for low-resource environments
* Improve real-time performance
* Add database for historical traffic data
* Enhance UI/UX and analytics

---

