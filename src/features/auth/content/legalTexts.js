// Bundled plain-text versions of the legal documents shown on the consent screen.
// Source of truth lives in Terms_and_Conditions.md and Privacy_Policy.md at the
// repo root. Keep these strings in sync when the canonical docs change.

export const TERMS_TEXT = `Terms and Conditions for SmartKisan

Last Updated: May 2026

Welcome to SmartKisan. These Terms and Conditions outline the rules and regulations for the use of the SmartKisan Mobile Application, developed and operated by Hbeonlabs Technologies Pvt. Ltd. By downloading or using the app, these terms automatically apply to you. Please read them carefully before using the app. You are not allowed to copy or modify the app, any part of the app, or our trademarks in any way.

1. Description of Service
SmartKisan is an IoT-enabled agriculture management platform that provides remote and automated control over agricultural water pumps, AI-based plant disease detection, soil and weather analytics, and real-time sensor monitoring. The app requires an internet connection (via Wi-Fi or Cellular Data) to function correctly.

2. Hardware Control Liability and Disclaimers
SmartKisan allows users to remotely control physical hardware, specifically high-voltage agricultural water pumps and irrigation valves.

User Responsibility: You are solely responsible for ensuring that remote operation of your pumps is safe. Do not turn on pumps if people or livestock are in close proximity to moving parts or high-voltage lines.

Limitation of Liability: Hbeonlabs Technologies Pvt. Ltd. and its developers shall not be held liable for any crop loss, water wastage, equipment damage (e.g., dry running a pump), electrical fires, or personal injury resulting from the use or malfunction of this application, network failures, or automated schedules.

Fail-safes: We recommend installing physical hardware fail-safes (e.g., thermal relays, dry-run preventers) in conjunction with our smart controllers.

3. Data Collection and Privacy
To provide its core functionality, SmartKisan requests specific device permissions. See our Privacy Policy below for details on what we collect and how it is used.

4. Third-Party Services
SmartKisan uses OpenWeatherMap (weather data), Hugging Face Spaces (AI inference for disease detection), and an MQTT broker (real-time pump communication). We do not guarantee the constant uptime or accuracy of these third-party services.

5. Updates to the App
We may update the app from time to time to add new features or comply with updated Google Play Store policies. You promise to always accept updates to the application when offered to you.

6. Changes to These Terms
We may update our Terms and Conditions from time to time. You are advised to review these terms periodically for any changes.

7. Contact Us
If you have any questions, contact support@smartkisan.app.`;


export const PRIVACY_POLICY_TEXT = `Privacy Policy for SmartKisan

Effective Date: May 23, 2026

Hbeonlabs Technologies Pvt. Ltd. operates the SmartKisan mobile application. This Privacy Policy explains what information we collect, how we use it, who we share it with, and the rights you have over your data.

1. Information we collect
Account information: email address (required), phone number (optional), name (optional), password (stored only as a one-way bcrypt hash), and Google account identifier if you sign in with Google.

Farm and device data: farm name, type, size, location coordinates, field names, soil types, sowing dates, crop varieties, photos you upload, pump configurations and run history, IoT device identifiers, and sensor readings (soil moisture, pH, temperature, NPK).

Device permissions: Location (used to fetch local weather and recommend crops, on-demand only), Camera and Photo Library (for plant disease leaf photos, not stored on our servers), Push Notifications token (only if you enable notifications), Network access (for backend and MQTT communication).

Technical data: app version, device model, OS version, language preference, and your IP address (logged transiently for rate-limiting, not retained for analytics).

2. How we use your information
We use your data to authenticate you, run the app's farming features, control your pumps in real time, show weather and crop recommendations, run AI plant disease detection, send notifications you opt into, and improve app stability via crash reports. We do not use your data for advertising, profiling, or sale.

3. Who we share your information with
We share data only with services strictly required to run the app: OpenWeatherMap (lat/lng only, for weather), Hugging Face Spaces (a single leaf photo for AI inference, not retained), our MQTT broker (pump commands and sensor data scoped to your user ID), Google Sign-In (only if you choose it), and our cloud hosting provider (where the database runs). We do not sell your personal data to any party, ever.

4. Where your data is stored
Account, farm, and sensor data is stored in a managed PostgreSQL database hosted with our cloud provider. Photos are sent to HuggingFace for inference and discarded after the response. MQTT messages are not persisted beyond delivery. All data in transit is encrypted via HTTPS and WSS.

5. How long we keep your data
Account data: retained while active, deleted within 30 days of an account deletion request. Farm and crop data: retained while account is active, deletable on request. Photos: not retained. Logs: up to 90 days, then purged.

6. Your rights
You can request access to your data, correct inaccurate data via the in-app Profile screen, delete your account and associated data, export your data in a machine-readable format, withdraw consent for optional features, and opt out of any non-essential data collection. Contact support@smartkisan.app for any request.

7. Children's privacy
SmartKisan is intended for users 13 years of age or older. We do not knowingly collect personal information from children under 13.

8. Data security
Passwords are hashed with bcrypt (cost factor 10). Session tokens are JWTs with a 30-day expiry. All API traffic is over HTTPS / TLS 1.2 or higher. We will notify you within 72 hours of any data breach affecting your information.

9. Changes to this policy
We may update this Privacy Policy from time to time. We will notify you in-app for material changes.

10. Contact us
Email: support@smartkisan.app
Company: Hbeonlabs Technologies Pvt. Ltd.`;
