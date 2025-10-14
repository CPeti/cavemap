# 🕳️ OpenCave — Microservice-Based Cave Information Platform

**OpenCave** is a web application for exploring, documenting, and sharing information about caves around the world.  
It follows a **microservice architecture** and can be deployed using **Docker Compose**, **Kubernetes (K8s)**, or **Azure Container Apps (ACA)**.

---

## 🚀 Overview

OpenCave allows users to:

- Browse and search caves by location, depth, and type
- View maps, photos, and details for each cave
- Contribute new cave data (if authorized)
- Upload photos and reviews
- Manage their profile and activity

Each feature is implemented as an independent microservice for scalability and maintainability.

---

## 🧩 Architecture

### Core Microservices

| Service            | Description                                                        |
| ------------------ | ------------------------------------------------------------------ |
| **Auth Service**   | Handles user authentication (JWT, OAuth2), roles, and registration |
| **Cave Service**   | Stores and manages cave data (CRUD, geolocation)                   |
| **Media Service**  | Manages image/video uploads and metadata                           |
| **Review Service** | Handles user reviews and comments on caves                         |
| **Map Service**    | Integrates map and geolocation queries                             |
| **API Gateway**    | Routes all client traffic to the correct backend service           |
| **Frontend**       | React-based user interface                                         |

Optional supporting components:

- **PostgreSQL / MongoDB** – main databases
- **MinIO / Azure Blob Storage** – media storage
- **Redis / RabbitMQ** – caching and asynchronous communication

---

## 🗂️ Project Structure
