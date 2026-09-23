# Project Overview

## 1. System Objectives

ECOMOW is an IoT-based smart grass cutting system designed to assist in grass maintenance operations.

The project aims to address problems associated with manual grass cutting, including the need for continuous manual labor and the use of conventional grass-cutting tools.

The system objectives are:

- To provide a smart and technology-assisted grass-cutting system.
- To reduce dependence on manual grass-cutting activities.
- To provide remote control of the mower.
- To allow users to monitor mower status.
- To integrate the smart mower with a mobile application.
- To provide cloud-based communication between the application and mower.
- To provide information such as battery status and mower operating status.
- To provide scheduling and operational control features.

## 2. Proposed Scope

The proposed project will integrate the following components and modules.

### A. Smart Mower Device

The smart mower will perform the physical grass-cutting operations. The device may include:

- ESP32 microcontroller
- Drive motor
- Steering motor
- Mowing motor
- Motor controllers
- Battery system
- GPS module
- Sensors
- Emergency stop functionality

### B. Mobile Application

The mobile application will serve as the user interface for interacting with the ECOMOW system.

The application will include:

- User authentication
- Mower connection
- Manual mower control
- Forward and backward movement
- Left and right steering
- Mowing ON/OFF control
- Mower status monitoring
- Battery information
- Scheduling functionality
- Emergency STOP functionality

### C. Cloud Integration

The system will use cloud services to allow communication between the mobile application and the mower.

The proposed cloud integration includes:

- Firebase Authentication
- Firebase Realtime Database
- Cloud-based mower commands
- Mower status updates
- User-related system information

### D. System Integration

The project will integrate the hardware, mobile application, and cloud services into one system.

The general communication flow is:

```text
User
  ↓
Mobile Application
  ↓
Firebase
  ↓
ESP32
  ↓
Mower Hardware
  ↓
Motors / Sensors