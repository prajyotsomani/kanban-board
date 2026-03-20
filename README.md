# 🗂️ Kanban Board Project

A full-stack Kanban Board application built using MERN stack (MongoDB, Express, React, Node.js).  
It allows users to manage tasks efficiently with drag-and-drop functionality.

---

## 🚀 Features

- Create, update, delete tasks
- Drag and drop tasks between columns
- User authentication (if implemented)
- Responsive UI
- Real-time updates (optional)

---

## 🛠️ Tech Stack

**Frontend:**
- React.js
- Tailwind CSS / CSS
- Axios

**Backend:**
- Node.js
- Express.js

**Database:**
- MongoDB

---

## 📂 Project Structure
kanban-board/
│
├── backend/
│ ├── src/
│ ├── models/
│ ├── routes/
│ └── server.js
│
├── frontend/
│ ├── src/
│ └── public/
│
└── README.md

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/prajyotsomani/kanban-board.git
cd kanban-board
🔧 Backend Setup
📌 Step 1: Go to backend folder
cd backend
📌 Step 2: Install dependencies
npm install
📌 Step 3: Create .env file

Create a .env file inside backend folder and add:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
📌 Step 4: Run backend server
npm start

or (for development)

npm run dev
🎨 Frontend Setup
📌 Step 1: Go to frontend folder
cd frontend
📌 Step 2: Install dependencies
npm install
📌 Step 3: Run frontend
npm start
🗄️ Database Setup (MongoDB)
Option 1: Local MongoDB

Install MongoDB locally

Run MongoDB service

Use connection string:

mongodb://127.0.0.1:27017/kanban
Option 2: MongoDB Atlas

Go to MongoDB Atlas

Create cluster

Get connection string

Paste into .env:

MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/kanban
📦 Scripts
Backend
npm start     # run server
npm run dev   # nodemon
Frontend
npm start     # run react app
npm build     # build production
🌐 API Endpoints (Example)
Method	Endpoint	Description
GET	/tasks	Get all tasks
POST	/tasks	Create task
PUT	/tasks/:id	Update task
DELETE	/tasks/:id	Delete task
🧑‍💻 Author

Prajyot Kumar (Prajyot Somani)

⭐ Contribution

Feel free to fork this repo and contribute!


