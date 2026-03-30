# SmartKisan MQTT Topics

## Broker
- **Testing:** `broker.hivemq.com` (public, no auth)
  - App (WebSocket): `wss://broker.hivemq.com:8884/mqtt`
  - Backend (TCP): `mqtt://broker.hivemq.com:1883`
- **Production:** Replace with HiveMQ Cloud or self-hosted Mosquitto

## Topic Structure

```
smartkisan/{userId}/pump/{pumpId}/command   → App → Device (ON/OFF)
smartkisan/{userId}/pump/{pumpId}/status    → Device → App (status updates)
smartkisan/{userId}/pump/{pumpId}/timer     → App → Device (timer commands)
smartkisan/{userId}/sensors/{deviceId}/data → Device → App (sensor readings)
smartkisan/{userId}/alerts                  → System → App (alerts)
```

## Topic Details

### 1. Pump Command
**Topic:** `smartkisan/{userId}/pump/{pumpId}/command`
**Direction:** App → Backend/Device
**QoS:** 1
**Payload:**
```json
{
  "action": "on",
  "pumpId": "pump_123",
  "timestamp": "2026-03-28T10:30:00Z",
  "source": "app"
}
```

### 2. Pump Status
**Topic:** `smartkisan/{userId}/pump/{pumpId}/status`
**Direction:** Device/Backend → App
**QoS:** 1
**Payload:**
```json
{
  "status": "on",
  "pumpId": "pump_123",
  "pumpName": "Main Field Pump",
  "timestamp": "2026-03-28T10:30:01Z",
  "runTime": null
}
```

### 3. Pump Timer
**Topic:** `smartkisan/{userId}/pump/{pumpId}/timer`
**Direction:** App → Backend
**QoS:** 1
**Payload:**
```json
{
  "action": "start_timer",
  "pumpId": "pump_123",
  "duration": 1800,
  "timestamp": "2026-03-28T10:30:00Z",
  "source": "app"
}
```

### 4. Sensor Data
**Topic:** `smartkisan/{userId}/sensors/{deviceId}/data`
**Direction:** Device → App
**QoS:** 0
**Payload:**
```json
{
  "deviceId": "sensor_001",
  "type": "soil_moisture",
  "value": 45.2,
  "unit": "%",
  "battery": 87,
  "timestamp": "2026-03-28T10:30:00Z"
}
```

### 5. Alerts
**Topic:** `smartkisan/{userId}/alerts`
**Direction:** System → App
**QoS:** 1
**Payload:**
```json
{
  "type": "threshold",
  "severity": "warning",
  "message": "Soil moisture dropped below 30%",
  "deviceId": "sensor_001",
  "timestamp": "2026-03-28T10:30:00Z"
}
```

## Testing with MQTT Box

1. Connect to `mqtt://broker.hivemq.com:1883`
2. Subscribe to `smartkisan/#` to see all messages
3. Publish to `smartkisan/test_user/pump/pump1/command` with `{"action":"on","source":"mqttbox"}`
4. You should see a status response on `smartkisan/test_user/pump/pump1/status`
