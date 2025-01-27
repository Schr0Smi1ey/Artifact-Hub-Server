# Artifact Hub Backend Server 🔺🌍

This is the backend server for **Artifact Hub**, a platform designed to catalog and explore historical artifacts. The server is built with **Express.js** and provides APIs for user authentication, artifact management, and like functionality. It seamlessly integrates with the frontend to ensure a smooth and secure user experience.

---

## 🌟 Key Features

### **1. User Authentication 🔐**

- Secure login and authentication using JSON Web Tokens (JWT).
- Token-based authorization for protected routes.
- Cookie management for session handling.

### **2. Artifact Management 📜**

- Add, view, update, and delete artifact details.
- Retrieve user-specific artifacts based on authentication.

### **3. Like Functionality ❤️**

- Like or dislike artifacts dynamically.
- Real-time like count updates.
- Retrieve a list of liked artifacts for each user.

### **4. Hosting ☁️**

- Hosted on **Vercel** for scalability, fast deployment, and reliability.

---

## 🔧 Technologies Used

### **1. Backend Framework 🛧️**

- **Express.js**: Efficient and lightweight framework for RESTful APIs.

### **2. Database 🔃**

- **MongoDB**: NoSQL database for managing artifacts, users, and likes.

### **3. Middleware 🛠️**

- **CORS**: Handles cross-origin requests to enable secure frontend-backend communication.
- **cookie-parser**: Parses cookies for secure token management.
- **express.json()**: Parses incoming JSON payloads.
- **verifyToken**: Custom middleware to verify JWT tokens.

### **4. Authentication 🔒**

- **JWT**: Ensures secure authentication and access control.

### **5. Deployment 🚀**

- **Vercel**: Provides smooth and high-performance hosting for the backend server.

---

## 🌍 Root API URL

The server is deployed on Vercel and can be accessed via:

- **[https://artifact-hub.vercel.app](https://artifact-hub-server.vercel.app/)**

---

## API Endpoints 🚀

### **User Routes**

| Method | Endpoint | Description                             |
| ------ | -------- | --------------------------------------- |
| POST   | `/Users` | Create a new user                       |
| GET    | `/Users` | Fetch all registered users (Admin only) |

### **Authentication Routes**

| Method | Endpoint      | Description                             |
| ------ | ------------- | --------------------------------------- |
| POST   | `/jwt`        | Generate JWT for user authentication    |
| POST   | `/logout`     | Clear the JWT from cookies              |
| GET    | `/check-auth` | Verify the user's authentication status |

### **Artifact Routes**

| Method | Endpoint         | Description                                             |
| ------ | ---------------- | ------------------------------------------------------- |
| POST   | `/Artifacts`     | Add new artifact details                                |
| GET    | `/Artifacts`     | Retrieve all artifacts (supports pagination and search) |
| GET    | `/Artifacts/:id` | Retrieve details of a specific artifact by ID           |
| PUT    | `/Artifacts/:id` | Update artifact details                                 |
| DELETE | `/Artifacts/:id` | Delete an artifact by ID                                |
| PATCH  | `/Artifacts/:id` | Update specific fields (e.g., like count)               |
| GET    | `/MyArtifacts`   | Fetch artifacts added by a specific user                |

### **Like Functionality Routes**

| Method | Endpoint                 | Description                                   |
| ------ | ------------------------ | --------------------------------------------- |
| PATCH  | `/toggle-like/:id`       | Like or dislike an artifact                   |
| GET    | `/liked-artifacts`       | Fetch artifacts liked by a specific user      |
| GET    | `/check-like-status/:id` | Check if a user has liked a specific artifact |
| GET    | `/MyLikedArtifactCount`  | Get the count of artifacts liked by a user    |

---

## Contribution Guidelines 🤝

1. **Fork the repository**.
2. **Create a feature branch** (`git checkout -b feature-name`).
3. **Commit your changes** (`git commit -m "Add feature"`).
4. **Push to your branch** (`git push origin feature-name`).
5. **Submit a pull request**.

---

Built with 💙 and passion by [Sarafat Karim](https://www.linkedin.com/in/sarafat-karim/).
