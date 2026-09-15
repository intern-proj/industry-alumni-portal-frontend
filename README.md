# NSBM Industry Alumni Portal - Frontend

Welcome to the **Industry Alumni Portal Frontend** application built with React, Vite, and Tailwind CSS.

## Modules & Services
- **Auth & User Management**: Authentication, Profile Management, Student Sync
- **Event Management**: Workshop Creation, Venue Allocation, Speaker Scheduling
- **Event Participation**: Event Registration, Dynamic QR Code Check-in
- **Certificate Service**: Certificate Generation, QR Credential Verification, PDF Downloads
- **Application & Vacancy Service**: AI ATS Matching, Candidate Pipelines, Resume Attachments
- **Notification & Audit Storage**: Automated Reminders, System Audit Trail

## Certificate Service Contribution (By U.V.N.S.Mayuranga - 28340)
- Integrated `certificateService.js` for REST API endpoints `/api/v1/certificates` (Port 8085).
- Integrated `MyCertificates.jsx` student portal for searching, viewing verified credentials, and downloading PDF certificates.
- Integrated `CertificateVerification.jsx` public QR verification page with cryptographic signature check.
- Integrated `CertificateConfig.jsx` staff management for certificate background templates and eligibility criteria.

## Getting Started
```bash
npm install
npm run dev
```
