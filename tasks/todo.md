# Tier 1 Features Implementation Plan

## Overview
We will implement the Tier 1 critical missing features for the BloodConnect Operations Management System. 
Since I am a single agent here in this terminal environment (native subagent limits apply to just the browser), I will execute these tasks sequentially as the main orchestrator, strictly applying the newly defined `instructions.md` testing protocols after each feature.

## TODOs

### 1. Response Time Tracking (Helpline)
- [ ] Add `resolvedAt` and `responseStatus` fields to the Blood Request creation/update handlers.
- [ ] In `HelplineDashboard`, show metrics for "Average Response Time" (calculating the difference between `createdAt` and `resolvedAt`).
- [ ] UI Consistency Audit & Testing procedure according to `instructions.md`.

### 2. Volunteer Allocation for Events (Camps/Outreach)
- [ ] Update `Camp` interface in `types` to hold an array of assigned volunteer IDs (`assignedVolunteers: string[]`).
- [ ] In `CampDetailsScreen` or `CampCard`, allow City Managers to add/remove volunteers.
- [ ] UI Consistency Audit & Testing procedure according to `instructions.md`.

### 3. Record of Past Donations (Donor History)
- [ ] Update the `Donor` interface to include an array of past donation timestamps (`donationHistory: Date[]`).
- [ ] Add a "Log Donation" button to the `DonorProfile` or `DonorCard` for Helpline/Admins.
- [ ] Display the "Last Donated At" status, ensuring warning labels are shown if within 3 months.
- [ ] UI Consistency Audit & Testing procedure according to `instructions.md`.

### 4. Real-Time Push Notifications (Optional Setup)
- [ ] Setup `expo-notifications` logic to ask for permissions on login.
- [ ] *Note: We may choose to mock this or implement a basic internal Notification center UI if Push requires external Apple/Google certificates.*

---

## Review
- After each task, a comprehensive scoring table (0-100) will be provided according to the Confidence Score rules in `instructions.md`.
