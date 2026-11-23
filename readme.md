# 🏥 CAREPOINT — Healthcare Dispensary Management System

CarePoint is a full-stack healthcare dispensary management application designed to simplify dispensary discovery, medicine availability, appointment requests, and inventory management.

## ✨ Features

- **Healthcare Directory:** Browse dispensaries through a state-wise and district-wise hierarchy.
- **Client Portal:** Register, log in, explore dispensaries, check medicine availability, and submit requests.
- **Appointment Management:** Submit and manage appointment requests.
- **Medicine Requests:** Request medicines from selected dispensaries and track request processing.
- **Dispensary Admin Dashboard:** Manage inventory, restock medicines, and process client requests and appointments.
- **Super Admin Dashboard:** Create dispensary administrators, assign dispensaries, and manage the medicine catalogue.
- **Role-Based Authentication:** Separate access for clients, dispensary admins, and the super admin.

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| Frontend | React.js, Vite |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Authentication | JWT |
| Styling | CSS |

## 📁 Project Structure

```text
CarePoint/
├── frontend/
├── backend/
├── database/
│   ├── schema.sql
│   ├── government_directory_data.sql
│   ├── sample_data.sql
│   └── source/
├── README.md
└── .gitignore
```

## ⚙️ Local Setup

### Prerequisites
- Node.js and npm
- MySQL Server
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Vaishna-vii/Care_Point
cd CarePoint
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and configure your MySQL credentials, a strong JWT secret (32+ characters), and Super Admin credentials.

Seed the Super Admin account:

```bash
npm run seed:super-admin
```

Start the backend:

```bash
npm run dev
```

### 3. Configure the frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Copy `.env.example` to `.env` if required and configure the API URL.

Start the frontend:

```bash
npm run dev
```

### 4. Open the application

The local development server is available at:

`http://localhost:5173`

## 🗄️ Database

CarePoint uses a MySQL database with a revised 16-table schema.

The `database/` directory contains:
- `schema.sql` — Database structure.
- `government_directory_data.sql` — Healthcare directory data sourced from a government dataset.
- `sample_data.sql` — Sample records for application tables.
- `source/` — Original cleaned CSV dataset.

**Important:** The application expects the revised database schema. If you already have a working database, do not blindly rerun SQL scripts or drop existing tables. Back up your database and verify table definitions before importing anything.

## 🔐 Security Notes

- Never commit `.env` files, passwords, JWT secrets, or authentication tokens.
- Admin accounts are created by the Super Admin and cannot publicly self-register.
- Dispensary admins are restricted to their assigned dispensary.
- Server-side role checks enforce access permissions.

## 🚀 Recent Improvements

- State-wise and district-wise directory navigation.
- Improved inventory restocking with medicine details.
- Appointment request validation and processing.
- Medicine request validation against dispensary stock.
- Stock transaction and audit logging.
- Improved admin and client workflows.

## 🔮 Future Scope

- Medicine price comparison across multiple pharmacy platforms.
- Integration with external healthcare APIs.
- Expansion of healthcare directory coverage across India.

---

**Academic Project:** Developed as a DBMS mini-project.