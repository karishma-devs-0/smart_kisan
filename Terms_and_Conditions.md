# Terms and Conditions for SmartKisan

**Last Updated:** May 2026

Welcome to **SmartKisan**! These Terms and Conditions outline the rules and regulations for the use of the SmartKisan Mobile Application, developed by Karishma Bhatia.

By downloading or using the app, these terms will automatically apply to you. Please read them carefully before using the app. You are not allowed to copy or modify the app, any part of the app, or our trademarks in any way.

---

## 1. Description of Service
SmartKisan is an IoT-enabled agriculture management platform that provides:
- Remote and automated control over agricultural water pumps.
- AI-based plant disease detection.
- Soil and weather analytics.
- Real-time sensor monitoring.

The app requires an internet connection (via Wi-Fi or Cellular Data) to function correctly and communicate with our cloud or your local MQTT backend.

## 2. Hardware Control Liability & Disclaimers
SmartKisan allows users to remotely control physical hardware, specifically high-voltage agricultural water pumps and irrigation valves.
- **User Responsibility:** You are solely responsible for ensuring that remote operation of your pumps is safe. Do not turn on pumps if people or livestock are in close proximity to moving parts or high-voltage lines.
- **Limitation of Liability:** SmartKisan and its developers shall not be held liable for any crop loss, water wastage, equipment damage (e.g., dry running a pump), electrical fires, or personal injury resulting from the use or malfunction of this application, network failures, or automated schedules.
- **Fail-safes:** We recommend installing physical hardware fail-safes (e.g., thermal relays, dry-run preventers) in conjunction with our smart controllers.

## 3. Data Collection and Privacy (Google Play Policy Compliance)
To provide its core functionality, SmartKisan requests specific device permissions:
- **Location:** Used to provide hyper-local weather forecasts and crop recommendations. Location data is securely fetched and is not sold to third parties.
- **Camera & Photo Library:** Required to capture or upload leaf images for the AI Plant Disease Detection feature. Images are temporarily sent to a Hugging Face AI server for inference and are not permanently stored or used for any other purpose without your consent.
- **Network Access:** Required to communicate with your IoT devices and our backend services.

We are committed to protecting your privacy. We will never sell your personal farming data, schedules, or crop information.

## 4. Third-Party Services
SmartKisan utilizes third-party services that declare their own Terms and Conditions. By using our app, you also agree to the applicable terms of these services:
- OpenWeatherMap API (Weather Data)
- Hugging Face Spaces (AI Inference for Disease Detection)
- HiveMQ or equivalent MQTT brokers

We do not guarantee the constant uptime or accuracy of these third-party services.

## 5. Updates to the App
We may update the app from time to time to add new features or comply with updated Google Play Store policies. The app is currently available on Android. You promise to always accept updates to the application when offered to you. We may also stop providing the app and terminate use of it at any time without giving notice. 

## 6. Changes to These Terms
We may update our Terms and Conditions from time to time. You are advised to review this page periodically for any changes. We will notify you of any changes by posting the new Terms and Conditions on this page.

## 7. Contact Us
If you have any questions or suggestions about our Terms and Conditions, do not hesitate to contact us at `support@smartkisan.app` or via the Play Store developer contact link.
