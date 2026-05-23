# Privacy Policy for SmartKisan

**Effective Date:** May 23, 2026
**Last Updated:** May 23, 2026

Hbeonlabs Technologies Pvt. Ltd. ("we", "us", "our") operates the SmartKisan mobile application (the "App"). This Privacy Policy explains what information we collect, how we use it, who we share it with, and the rights you have over your data.

By installing or using SmartKisan, you agree to the practices described here. If you do not agree, please uninstall the App.

---

## 1. Who we are

**Data Controller:** Hbeonlabs Technologies Pvt. Ltd.
**App:** SmartKisan (package `com.smartkisan.app`)
**Contact:** support@smartkisan.app

---

## 2. Information we collect

We collect the minimum data needed to provide the App's features. Specifically:

### Account information
- **Email address** (required to register and log in)
- **Phone number** (optional, used for OTP login if you choose it)
- **Name** (optional, displayed in your profile)
- **Password** (stored only as a one-way bcrypt hash — we cannot recover it)
- **Google account identifier** (only if you sign in with Google; we receive your email and Google `sub` ID, never your Google password)

### Farm and device data
- Farm name, type, size, and location coordinates you enter during onboarding
- Field names, soil types, sowing dates, crop varieties, photos you upload
- Pump configurations (name, mode, HP, type, schedules) and run history
- IoT device identifiers (MAC address, sensor type, battery level, last sync time)
- Sensor readings (soil moisture, pH, temperature, NPK, EC) from your hardware

### Device permissions (granted by you when prompted)
- **Location (GPS):** used to fetch local weather forecasts and recommend region-appropriate crops. We do not track your location continuously — readings happen on-demand when you open weather or onboarding screens.
- **Camera & Photo Library:** used to capture or select leaf photos for the AI Plant Disease Detection feature. Photos are sent for inference and not stored on our servers.
- **Push Notifications token:** used to send alerts (irrigation reminders, weather warnings, sensor threshold breaches) only if you enable notifications.
- **Network:** required to communicate with our backend, MQTT broker (for real-time pump control), and third-party APIs.

### Technical data
- App version, device model, OS version, language preference — used for crash diagnostics and feature compatibility
- IP address — logged transiently by our backend for rate-limiting and abuse prevention; not retained for analytics

---

## 3. How we use your information

| Purpose | Data used |
|---|---|
| Authenticate you (login, session restore) | Email, phone, password hash, Google ID |
| Run the App's farming features | Farm data, field data, crop data, pump data, sensor readings |
| Control your pumps in real time | Pump IDs, MQTT topics scoped to your user ID |
| Show weather + crop recommendations | Location (GPS coordinates or city you pick) |
| AI plant disease detection | Photos you submit (one-time inference, not stored) |
| Send notifications | Push token + your notification preferences |
| Improve App stability | Crash reports, technical device info (no personal data attached) |

We do **not** use your data for advertising, profiling, or sale to third parties.

---

## 4. Who we share your information with

We share data only with the third-party services strictly required to run the App's features:

| Service | What we share | Why |
|---|---|---|
| **OpenWeatherMap** (weather API) | Latitude/longitude only | To fetch weather forecasts for your area |
| **HuggingFace Spaces** (AI inference) | A leaf photo at scan time | One-time disease detection inference; not retained |
| **MQTT broker** (HiveMQ Cloud or self-hosted) | Pump commands + sensor data scoped to your user ID | Real-time communication with your IoT devices |
| **Google Sign-In** (only if you use it) | Your email + Google `sub` ID | To authenticate you via Google |
| **Cloud hosting provider** (where our backend runs) | Your account data + farm data | To store your data in a managed PostgreSQL database |

We do **not** sell your personal data to any party, ever. We do **not** share data with advertisers or data brokers.

When required by law (court order, subpoena, regulatory request), we may disclose data to government authorities. We will notify you unless legally prohibited.

---

## 5. Where your data is stored

- **Account + farm + sensor data** is stored in a managed PostgreSQL database hosted with our cloud provider.
- **Photos** for disease detection are sent to HuggingFace's CPU servers for inference and discarded after the response is returned.
- **MQTT messages** are routed via the broker but not persisted beyond delivery (real-time, ephemeral).

All data in transit is encrypted via HTTPS (for our APIs) and WSS (for MQTT WebSockets).

---

## 6. How long we keep your data

- **Account data:** retained while your account is active. Deleted within 30 days of account deletion request.
- **Farm + crop + sensor data:** retained while your account is active for historical reports and trend analysis. Deletable on request.
- **Plant disease scan photos:** not retained — discarded immediately after inference.
- **Logs and crash reports:** retained for up to 90 days, then auto-purged.
- **MQTT message history:** not retained (messages are real-time only).

---

## 7. Your rights

You can, at any time:

- **Access** the data we hold about you — request via support@smartkisan.app
- **Correct** inaccurate data via the in-app Profile screen
- **Delete** your account and all associated data via Settings → Account → Delete Account (or email us)
- **Export** your data in a machine-readable format on request
- **Withdraw consent** for optional features (notifications, location) via system permissions or in-app Settings
- **Opt out** of any non-essential data collection — the only essential collection is the data required to log in and run the App's core features

For users in jurisdictions with stronger data rights (EU/GDPR, India/DPDP Act), all rights granted by your local law apply. Contact us with any such request.

---

## 8. Children's privacy

SmartKisan is intended for users **13 years of age or older**. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided us data, please contact support@smartkisan.app and we will delete it.

---

## 9. Data security

We use industry-standard measures to protect your data:

- **Passwords** are hashed with bcrypt (cost factor 10). We never store passwords in plain text and cannot retrieve them.
- **Session tokens** are JWTs with a 30-day expiry; we keep only SHA-256 hashes of refresh tokens server-side.
- **All API traffic** is over HTTPS / TLS 1.2+.
- **Database access** is restricted to our backend server; not exposed publicly.
- **Photos for disease detection** are sent over HTTPS to HuggingFace and not stored on our infrastructure.

No system is perfectly secure. If we ever experience a data breach affecting your information, we will notify you within 72 hours of discovery.

---

## 10. Third-party links

The App may link to third-party government scheme websites (PM-KISAN, KCC, PMFBY, etc.) for informational purposes. We are not responsible for the content or privacy practices of those external sites. Review their policies separately.

---

## 11. Changes to this policy

We may update this Privacy Policy from time to time. When we do, we will:

- Update the "Last Updated" date at the top
- Notify you via in-app banner for material changes
- For significant changes affecting how we use your data, ask for renewed consent

Your continued use of the App after changes means you accept the updated policy.

---

## 12. Contact us

For questions, data requests, or concerns about this Privacy Policy:

**Email:** support@smartkisan.app
**Company:** Hbeonlabs Technologies Pvt. Ltd.
**Postal address:** (to be filled in by Hbeonlabs)

For data protection authority complaints in India: https://www.cert-in.org.in

---

*This Privacy Policy is provided in English. Translations into Hindi, Punjabi, Marathi, Telugu, Tamil, Kannada, Bengali, Gujarati, and Malayalam will be added as the App's localization rolls out.*
