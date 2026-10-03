#ifndef REALTIME_CLIENT_H
#define REALTIME_CLIENT_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include <esp_websocket_client.h>
#include <functional>

/**
 * Supabase Realtime WebSocket Client for AutoBell ESP32-S3
 * 
 * Implements the Phoenix Channels protocol (VSN 2.0.0) over WSS to receive:
 * 1. Instant commands via Realtime Broadcast (sub-100ms latency for Bell, TTS, Voice Notes)
 *    Supports both Binary frame format (kind=4 userBroadcast) and JSON array frames.
 * 2. Instant Postgres changes on command_queue as reliable fallback
 * 3. Schedule update alerts on bell_times (triggers one-time sync instead of constant polling)
 * 
 * Includes rate-limiting and connection guards to prevent memory fragmentation and heap exhaustion.
 */

typedef std::function<void(const char* command, JsonObject& payload)> RealtimeCommandCallback;
typedef std::function<void()> RealtimeScheduleUpdateCallback;

class RealtimeClient {
public:
    static RealtimeClient& getInstance() {
        static RealtimeClient instance;
        return instance;
    }

    void begin(const char* supabaseUrl, const char* anonKey, const String& macAddress, const String& schoolId) {
        _supabaseUrl = supabaseUrl;
        _anonKey = anonKey;
        _macAddress = macAddress;
        _cleanMac = macAddress;
        _cleanMac.replace(":", "");
        _cleanMac.replace("-", "");
        _cleanMac.toUpperCase();
        _schoolId = schoolId;

        // Guard: If client has already been created and started, DO NOT recreate it!
        // esp_websocket_client has auto_reconnect enabled and handles reconnects in the background.
        if (_client != nullptr && _isRunning) {
            return;
        }

        // Rate-limit initializations to at most once per 10 seconds to protect heap
        if (millis() - _lastStartAttempt < 10000 && _lastStartAttempt != 0) {
            return;
        }
        _lastStartAttempt = millis();

        // Heap Guard: Ensure sufficient free heap before starting TLS websocket task
        if (ESP.getFreeHeap() < 30000) {
            Serial.printf("[Realtime] Free heap too low (%u B < 30000 B). Deferring WS start.\n", ESP.getFreeHeap());
            return;
        }

        // Build WebSocket URI: wss://<host>/realtime/v1/websocket?apikey=<key>&vsn=2.0.0
        String host = _supabaseUrl;
        if (host.startsWith("https://")) {
            host = host.substring(8);
        } else if (host.startsWith("http://")) {
            host = host.substring(7);
        }
        int slashIdx = host.indexOf('/');
        if (slashIdx > 0) {
            host = host.substring(0, slashIdx);
        }

        _wsUri = "wss://" + host + "/realtime/v1/websocket?apikey=" + String(_anonKey) + "&vsn=2.0.0";
        Serial.printf("[Realtime] Configured URI: wss://%s/realtime/v1/websocket\n", host.c_str());

        static const char root_ca[] = R"(-----BEGIN CERTIFICATE-----
MIIDdTCCAl2gAwIBAgILBAAAAAABFUtaw5QwDQYJKoZIhvcNAQEFBQAwVzELMAkG
A1UEBhMCQkUxGTAXBgNVBAoTEEdsb2JhbFNpZ24gbnYtc2ExEDAOBgNVBAsTB1Jv
b3QgQ0ExGzAZBgNVBAMTEkdsb2JhbFNpZ24gUm9vdCBDQTAeFw05ODA5MDExMjAw
MDBaFw0yODAxMjgxMjAwMDBaMFcxCzAJBgNVBAYTAkJFMRkwFwYDVQQKExBHbG9i
YWxTaWduIG52LXNhMRAwDgYDVQQLEwdSb290IENBMRswGQYDVQQDExJHbG9iYWxT
aWduIFJvb3QgQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDaDuaZ
jc6j40+Kfvvxi4Mla+pIH/EqsLmVEQS98GPR4mdmzxzdzxtIK+6NiY6arymAZavp
xy0Sy6scTHAHoT0KMM0VjU/43dSMUBUc71DuxC73/OlS8pF94G3VNTCOXkNz8kHp
1Wrjsok6Vjk4bwY8iGlbKk3Fp1S4bInMm/k8yuX9ifUSPJJ4ltbcdG6TRGHRjcdG
snUOhugZitVtbNV4FpWi6cgKOOvyJBNPc1STE4U6G7weNLWLBYy5d4ux2x8gkasJ
U26Qzns3dLlwR5EiUWMWea6xrkEmCMgZK9FGqkjWZCrXgzT/LCrBbBlDSgeF59N8
9iFo7+ryUp9/k5DPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNVHRMBAf8E
BTADAQH/MB0GA1UdDgQWBBRge2YaRQ2XyolQL30EzTSo//z9SzANBgkqhkiG9w0B
AQUFAAOCAQEA1nPnfE920I2/7LqivjTFKDK1fPxsnCwrvQmeU79rXqoRSLblCKOz
yj1hTdNGCbM+w6DjY1Ub8rrvrTnhQ7k4o+YviiY776BQVvnGCv04zcQLcFGUl5gE
38NflNUVyRRBnMRddWQVDf9VMOyGj/8N7yy5Y0b2qvzfvGn9LhJIZJrglfCm7ymP
AbEVtQwdpf5pLGkkeB6zpxxxYu7KyJesF12KwvhHhm4qxFYxldBniYUr+WymXUad
DKqC5JlR3XC321Y9YeRq4VzW9v493kHMB65jUr9TU/Qr6cf9tveCX4XSQRjbgbME
HMUfpIBvFSDJ3gyICh3WZlXi/EjJKSZp4A==
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIIFVzCCAz+gAwIBAgINAgPlk28xsBNJiGuiFzANBgkqhkiG9w0BAQwFADBHMQsw
CQYDVQQGEwJVUzEiMCAGA1UEChMZR29vZ2xlIFRydXN0IFNlcnZpY2VzIExMQzEU
MBIGA1UEAxMLR1RTIFJvb3QgUjEwHhcNMTYwNjIyMDAwMDAwWhcNMzYwNjIyMDAw
MDAwWjBHMQswCQYDVQQGEwJVUzEiMCAGA1UEChMZR29vZ2xlIFRydXN0IFNlcnZp
Y2VzIExMQzEUMBIGA1UEAxMLR1RTIFJvb3QgUjEwggIiMA0GCSqGSIb3DQEBAQUA
A4ICDwAwggIKAoICAQC2EQKLHuOhd5s73L+UPreVp0A8of2C+X0yBoJx9vaMf/vo
27xqLpeXo4xL+Sv2sfnOhB2x+cWX3u+58qPpvBKJXqeqUqv4IyfLpLGcY9vXmX7w
Cl7raKb0xlpHDU0QM+NOsROjyBhsS+z8CZDfnWQpJSMHobTSPS5g4M/SCYe7zUjw
TcLCeoiKu7rPWRnWr4+wB7CeMfGCwcDfLqZtbBkOtdh+JhpFAz2weaSUKK0Pfybl
qAj+lug8aJRT7oM6iCsVlgmy4HqMLnXWnOunVmSPlk9orj2XwoSPwLxAwAtcvfaH
szVsrBhQf4TgTM2S0yDpM7xSma8ytSmzJSq0SPly4cpk9+aCEI3oncKKiPo4Zor8
Y/kB+Xj9e1x3+naH+uzfsQ55lVe0vSbv1gHR6xYKu44LtcXFilWr06zqkUspzBmk
MiVOKvFlRNACzqrOSbTqn3yDsEB750Orp2yjj32JgfpMpf/VjsPOS+C12LOORc92
wO1AK/1TD7Cn1TsNsYqiA94xrcx36m97PtbfkSIS5r762DL8EGMUUXLeXdYWk70p
aDPvOmbsB4om3xPXV2V4J95eSRQAogB/mqghtqmxlbCluQ0WEdrHbEg8QOB+DVrN
VjzRlwW5y0vtOUucxD/SVRNuJLDWcfr0wbrM7Rv1/oFB2ACYPTrIrnqYNxgFlQID
AQABo0IwQDAOBgNVHQ8BAf8EBAMCAYYwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4E
FgQU5K8rJnEaK0gnhS9SZizv8IkTcT4wDQYJKoZIhvcNAQEMBQADggIBAJ+qQibb
C5u+/x6Wki4+omVKapi6Ist9wTrYggoGxval3sBOh2Z5ofmmWJyq+bXmYOfg6LEe
QkEzCzc9zolwFcq1JKjPa7XSQCGYzyI0zzvFIoTgxQ6KfF2I5DUkzps+GlQebtuy
h6f88/qBVRRiClmpIgUxPoLW7ttXNLwzldMXG+gnoot7TiYaelpkttGsN/H9oPM4
7HLwEXWdyzRSjeZ2axfG34arJ45JK3VmgRAhpuo+9K4l/3wV3s6MJT/KYnAK9y8J
ZgfIPxz88NtFMN9iiMG1D53Dn0reWVlHxYciNuaCp+0KueIHoI17eko8cdLiA6Ef
MgfdG+RCzgwARWGAtQsgWSl4vflVy2PFPEz0tv/bal8xa5meLMFrUKTX5hgUvYU/
Z6tGn6D/Qqc6f1zLXbBwHSs09dR2CQzreExZBfMzQsNhFRAbd03OIozUhfJFfbdT
6u9AWpQKXCBfTkBdYiJ23//OYb2MI3jSNwLgjt7RETeJ9r/tSQdirpLsQBqvFAnZ
0E6yove+7u7Y/9waLd64NnHi/Hm3lCXRSHNboTXns5lndcEZOitHTtNCjv0xyBZm
2tIMPNuzjsmhDYAPexZ3FL//2wmUspO8IFgV6dtxQ/PeEMMA3KgqlbbC1j+Qa3bb
bP6MvPJwNQzcmRk13NfIRmPVNnGuV/u3gm3c
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIICCTCCAY6gAwIBAgINAgPlwGjvYxqccpBQUjAKBggqhkjOPQQDAzBHMQswCQYD
VQQGEwJVUzEiMCAGA1UEChMZR29vZ2xlIFRydXN0IFNlcnZpY2VzIExMQzEUMBIG
A1UEAxMLR1RTIFJvb3QgUjQwHhcNMTYwNjIyMDAwMDAwWhcNMzYwNjIyMDAwMDAw
WjBHMQswCQYDVQQGEwJVUzEiMCAGA1UEChMZR29vZ2xlIFRydXN0IFNlcnZpY2Vz
IExMQzEUMBIGA1UEAxMLR1RTIFJvb3QgUjQwdjAQBgcqhkjOPQIBBgUrgQQAIgNi
AATzdHOnaItgrkO4NcWBMHtLSZ37wWHO5t5GvWvVYRg1rkDdc/eJkTBa6zzuhXyi
QHY7qca4R9gq55KRanPpsXI5nymfopjTX15YhmUPoYRlBtHci8nHc8iMai/lxKvR
HYqjQjBAMA4GA1UdDwEB/wQEAwIBhjAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQW
BBSATNbrdP9JNqPV2Py1PsVq8JQdjDAKBggqhkjOPQQDAwNpADBmAjEA6ED/g94D
9J+uHXqnLrmvT/aDHQ4thQEd0dlq7A/Cr8deVl5c1RxYIigL9zC2L7F8AjEA8GE8
p/SgguMh1YQdc4acLa/KNJvxn7kjNuK8YAOdgLOaVsjh4rsUecrNIdSUtUlD
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIIDejCCAmKgAwIBAgIQf+UwvzMTQ77dghYQST2KGzANBgkqhkiG9w0BAQsFADBX
MQswCQYDVQQGEwJCRTEZMBcGA1UEChMQR2xvYmFsU2lnbiBudi1zYTEQMA4GA1UE
CxMHUm9vdCBDQTEbMBkGA1UEAxMSR2xvYmFsU2lnbiBSb290IENBMB4XDTIzMTEx
NTAzNDMyMVoXDTI4MDEyODAwMDA0MlowRzELMAkGA1UEBhMCVVMxIjAgBgNVBAoT
GUdvb2dsZSBUcnVzdCBTZXJ2aWNlcyBMTEMxFDASBgNVBAMTC0dUUyBSb290IFI0
MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAE83Rzp2iLYK5DuDXFgTB7S0md+8Fhzube
Rr1r1WEYNa5A3XP3iZEwWus87oV8okB2O6nGuEfYKueSkWpz6bFyOZ8pn6KY019e
WIZlD6GEZQbR3IvJx3PIjGov5cSr0R2Ko4H/MIH8MA4GA1UdDwEB/wQEAwIBhjAd
BgNVHSUEFjAUBggrBgEFBQcDAQYIKwYBBQUHAwIwDwYDVR0TAQH/BAUwAwEB/zAd
BgNVHQ4EFgQUgEzW63T/STaj1dj8tT7FavCUHYwwHwYDVR0jBBgwFoAUYHtmGkUN
l8qJUC99BM00qP/8/UswNgYIKwYBBQUHAQEEKjAoMCYGCCsGAQUFBzAChhpodHRw
Oi8vaS5wa2kuZ29vZy9nc3IxLmNydDAtBgNVHR8EJjAkMCKgIKAehhxodHRwOi8v
Yy5wa2kuZ29vZy9yL2dzcjEuY3JsMBMGA1UdIAQMMAowCAYGZ4EMAQIBMA0GCSqG
SIb3DQEBCwUAA4IBAQAYQrsPBtYDh5bjP2OBDwmkoWhIDDkic574y04tfzHpn+cJ
odI2D4SseesQ6bDrarZ7C30ddLibZatoKiws3UL9xnELz4ct92vID24FfVbiI1hY
+SW6FoVHkNeWIP0GCbaM4C6uVdF5dTUsMVs/ZbzNnIdCp5Gxmx5ejvEau8otR/Cs
kGN+hr/W5GvT1tMBjgWKZ1i4//emhA1JG1BbPzoLJQvyEotc03lXjTaCzv8mEbep
8RqZ7a2CPsgRbuvTPBwcOMBBmuFeU88+FSBX6+7iP0il8b4Z0QFqIwwMHfs/L6K1
vepuoxtGzi4CZ68zJpiq1UvSqTbFJjtbD4seiMHl
-----END CERTIFICATE-----
)";

        esp_websocket_client_config_t ws_cfg = {};
        ws_cfg.uri = _wsUri.c_str();
        ws_cfg.cert_pem = root_ca;
        ws_cfg.cert_len = sizeof(root_ca);
        ws_cfg.disable_auto_reconnect = false;
        ws_cfg.pingpong_timeout_sec = 20;
        ws_cfg.buffer_size = 4096;
        ws_cfg.task_stack = 8192;
        ws_cfg.skip_cert_common_name_check = false;

        if (_client) {
            esp_websocket_client_destroy(_client);
            _client = nullptr;
        }

        _client = esp_websocket_client_init(&ws_cfg);
        if (!_client) {
            Serial.println("[Realtime] Failed to initialize WebSocket client handle");
            return;
        }

        esp_websocket_register_events(_client, WEBSOCKET_EVENT_ANY, _eventHandler, this);
        esp_err_t err = esp_websocket_client_start(_client);
        if (err == ESP_OK) {
            _isRunning = true;
            Serial.println("[Realtime] WebSocket client started in background task");
        } else {
            Serial.printf("[Realtime] Failed to start WebSocket client: %d\n", err);
            esp_websocket_client_destroy(_client);
            _client = nullptr;
            _isRunning = false;
        }
    }

    void onCommand(RealtimeCommandCallback cb) {
        _commandCallback = cb;
    }

    void onScheduleUpdate(RealtimeScheduleUpdateCallback cb) {
        _scheduleCallback = cb;
    }

    void setSchoolId(const String& schoolId) {
        _schoolId = schoolId;
        if (isConnected()) {
            joinChannels();
        }
    }

    bool isConnected() const {
        return _isConnected;
    }

    void loop() {
        if (!_isRunning || !_client) return;

        static unsigned long lastStatusPrint = 0;
        if (millis() - lastStatusPrint >= 5000) {
            lastStatusPrint = millis();
            Serial.printf("[Realtime Status] isRunning=%d, isConnected=%d, freeHeap=%u\n", 
                          _isRunning, _isConnected, ESP.getFreeHeap());
        }

        // Send Phoenix heartbeat every 30 seconds to maintain presence
        if (_isConnected && millis() - _lastHeartbeat >= 30000) {
            _lastHeartbeat = millis();
            sendHeartbeat();
        }
    }

    void stop() {
        if (_client) {
            _isRunning = false;
            _isConnected = false;
            esp_websocket_client_stop(_client);
            esp_websocket_client_destroy(_client);
            _client = nullptr;
        }
    }

private:
    RealtimeClient() : _client(nullptr), _isConnected(false), _isRunning(false), _lastHeartbeat(0), _lastStartAttempt(0), _refCounter(1) {}

    esp_websocket_client_handle_t _client;
    String _supabaseUrl;
    const char* _anonKey;
    String _macAddress;
    String _cleanMac;
    String _schoolId;
    String _wsUri;
    bool _isConnected;
    bool _isRunning;
    unsigned long _lastHeartbeat;
    unsigned long _lastStartAttempt;
    uint32_t _refCounter;

    RealtimeCommandCallback _commandCallback;
    RealtimeScheduleUpdateCallback _scheduleCallback;

    static void _eventHandler(void* handler_args, esp_event_base_t base, int32_t event_id, void* event_data) {
        RealtimeClient* self = static_cast<RealtimeClient*>(handler_args);
        esp_websocket_event_data_t* data = static_cast<esp_websocket_event_data_t*>(event_data);

        Serial.printf("[Realtime Event] event_id=%d\n", event_id);

        switch (event_id) {
            case WEBSOCKET_EVENT_CONNECTED:
                Serial.println("[Realtime] Connected to Supabase WebSocket!");
                self->_isConnected = true;
                self->_lastHeartbeat = millis();
                self->joinChannels();
                break;

            case WEBSOCKET_EVENT_DISCONNECTED:
                Serial.println("[Realtime] Disconnected from Supabase WebSocket (auto-reconnecting)");
                self->_isConnected = false;
                break;

            case WEBSOCKET_EVENT_DATA:
                if (data->data_len > 0) {
                    if (data->op_code == 0x01) { // Text frame (Phoenix 2.0 array format)
                        self->handleTextMessage(data->data_ptr, data->data_len);
                    } else if (data->op_code == 0x02) { // Binary frame (Supabase broadcast format)
                        self->handleBinaryMessage(reinterpret_cast<const uint8_t*>(data->data_ptr), data->data_len);
                    }
                }
                break;

            case WEBSOCKET_EVENT_ERROR:
                Serial.println("[Realtime] WebSocket error event");
                break;
        }
    }

    void joinChannels() {
        if (!_client || !_isConnected) return;

        // 1. Join Device-specific channel (realtime:device:E405927B0FFC)
        String topicDevice = "realtime:device:" + _cleanMac;
        sendJoin(topicDevice, false, nullptr);

        // 2. Join School-specific broadcast channel if available
        if (_schoolId.length() > 0) {
            String topicSchool = "realtime:school:" + _schoolId;
            sendJoin(topicSchool, false, nullptr);
        }

        // 3. Join Postgres changes channel for command_queue
        sendJoin("realtime:public:command_queue", true, "command_queue");

        // 4. Join Postgres changes channel for bell_times
        sendJoin("realtime:public:bell_times", true, "bell_times");
    }

    void sendJoin(const String& topic, bool isPostgresChange = false, const char* pgTable = nullptr) {
        if (!_client || !_isConnected) return;

        // Phoenix 2.0 array format: [join_ref, ref, topic, "phx_join", payload]
        JsonDocument doc;
        JsonArray arr = doc.to<JsonArray>();

        String refStr = String(_refCounter++);
        arr.add(refStr); // join_ref
        arr.add(refStr); // ref
        arr.add(topic);  // topic
        arr.add("phx_join"); // event

        JsonObject payloadObj = arr.add<JsonObject>();
        JsonObject configObj = payloadObj["config"].to<JsonObject>();

        JsonObject broadcastObj = configObj["broadcast"].to<JsonObject>();
        broadcastObj["ack"] = false;
        broadcastObj["self"] = true;

        JsonObject presenceObj = configObj["presence"].to<JsonObject>();
        presenceObj["key"] = "";
        presenceObj["enabled"] = false;

        JsonArray pgChanges = configObj["postgres_changes"].to<JsonArray>();
        if (isPostgresChange && pgTable != nullptr) {
            JsonObject changeRule = pgChanges.add<JsonObject>();
            changeRule["event"] = "*";
            changeRule["schema"] = "public";
            changeRule["table"] = pgTable;
        }

        String payloadStr;
        serializeJson(doc, payloadStr);
        esp_websocket_client_send_text(_client, payloadStr.c_str(), payloadStr.length(), portMAX_DELAY);
        Serial.printf("[Realtime] Subscribed to topic: %s\n", topic.c_str());
    }

    void sendHeartbeat() {
        if (!_client || !_isConnected) return;

        // Phoenix 2.0 array format: [null, ref, "phoenix", "heartbeat", {}]
        JsonDocument doc;
        JsonArray arr = doc.to<JsonArray>();

        String refStr = String(_refCounter++);
        arr.add(nullptr);    // join_ref is null for heartbeat
        arr.add(refStr);     // ref
        arr.add("phoenix");  // topic
        arr.add("heartbeat");// event
        arr.add<JsonObject>(); // payload {}

        String payloadStr;
        serializeJson(doc, payloadStr);
        esp_websocket_client_send_text(_client, payloadStr.c_str(), payloadStr.length(), portMAX_DELAY);
    }

    void handleBinaryMessage(const uint8_t* buf, int len) {
        if (!buf || len < 5) return;
        uint8_t kind = buf[0];
        // kind == 4: userBroadcast (Supabase Realtime protocol)
        // kind == 3: userBroadcastPush
        if (kind != 4 && kind != 3) {
            return;
        }

        uint8_t topicSize = buf[1];
        uint8_t userEventSize = buf[2];
        uint8_t metadataSize = buf[3];
        uint8_t payloadEncoding = buf[4];

        int offset = 5;
        if (offset + topicSize + userEventSize + metadataSize > len) {
            Serial.println("[Realtime] Malformed binary frame header length");
            return;
        }

        String topic = "";
        for (int i = 0; i < topicSize; i++) topic += (char)buf[offset++];

        String userEvent = "";
        for (int i = 0; i < userEventSize; i++) userEvent += (char)buf[offset++];

        offset += metadataSize; // Skip metadata

        int payloadLen = len - offset;
        if (payloadLen <= 0) return;

        Serial.printf("[Realtime] Binary broadcast on '%s', event='%s'\n", topic.c_str(), userEvent.c_str());

        if (payloadEncoding == 1) { // JSON encoding
            JsonDocument payloadDoc;
            DeserializationError err = deserializeJson(payloadDoc, (const char*)(buf + offset), payloadLen);
            if (err) {
                Serial.printf("[Realtime] Failed to parse binary JSON payload: %s\n", err.c_str());
                return;
            }

            const char* cmdName = nullptr;
            JsonObject cmdPayload;

            if (payloadDoc.is<JsonObject>()) {
                JsonObject root = payloadDoc.as<JsonObject>();
                if (root.containsKey("command")) {
                    cmdName = root["command"].as<const char*>();
                }
                if (root.containsKey("payload") && root["payload"].is<JsonObject>()) {
                    cmdPayload = root["payload"].as<JsonObject>();
                } else {
                    cmdPayload = root;
                }
            }

            if (!cmdName && userEvent.length() > 0 && userEvent != "command") {
                cmdName = userEvent.c_str();
            }

            if (cmdName && _commandCallback) {
                Serial.printf("[Realtime] >>> Instant Binary Broadcast Command: '%s' <<<\n", cmdName);
                _commandCallback(cmdName, cmdPayload);
            }
        }
    }

    void handleTextMessage(const char* data, int len) {
        if (!data || len <= 0) return;

        JsonDocument doc;
        DeserializationError err = deserializeJson(doc, data, len);
        if (err) {
            return;
        }

        const char* join_ref = nullptr;
        const char* ref = nullptr;
        const char* topic = nullptr;
        const char* event = nullptr;
        JsonVariant payload;

        if (doc.is<JsonArray>()) {
            // Phoenix 2.0 array format: [join_ref, ref, topic, event, payload]
            join_ref = doc[0].as<const char*>();
            ref = doc[1].as<const char*>();
            topic = doc[2].as<const char*>();
            event = doc[3].as<const char*>();
            payload = doc[4];
        } else if (doc.is<JsonObject>()) {
            // Legacy / object format
            join_ref = doc["join_ref"].as<const char*>();
            ref = doc["ref"].as<const char*>();
            topic = doc["topic"].as<const char*>();
            event = doc["event"].as<const char*>();
            payload = doc["payload"];
        } else {
            return;
        }

        if (!event || !topic) return;

        // Ignore Phoenix protocol events, heartbeats, and system messages
        if (strcmp(event, "phx_reply") == 0 || strcmp(event, "phx_close") == 0 || 
            strcmp(event, "system") == 0 || strcmp(topic, "phoenix") == 0) {
            return;
        }

        Serial.printf("[Realtime] Text event: '%s' on topic '%s'\n", event, topic);

        // Format 1: Text Broadcast event ({ type: "broadcast", event: "command", payload: { command: "...", payload: { ... } } })
        if (strcmp(event, "broadcast") == 0) {
            if (payload.is<JsonObject>()) {
                JsonObject p = payload.as<JsonObject>();
                const char* cmdName = nullptr;
                JsonObject cmdPayload;

                if (p.containsKey("payload") && p["payload"].is<JsonObject>()) {
                    JsonObject inner = p["payload"].as<JsonObject>();
                    if (inner.containsKey("command")) {
                        cmdName = inner["command"].as<const char*>();
                    }
                    if (inner.containsKey("payload") && inner["payload"].is<JsonObject>()) {
                        cmdPayload = inner["payload"].as<JsonObject>();
                    } else {
                        cmdPayload = inner;
                    }
                } else if (p.containsKey("command")) {
                    cmdName = p["command"].as<const char*>();
                    cmdPayload = p.containsKey("payload") && p["payload"].is<JsonObject>() ? p["payload"].as<JsonObject>() : p;
                }

                if (!cmdName && p.containsKey("event")) {
                    cmdName = p["event"].as<const char*>();
                }

                if (cmdName && _commandCallback) {
                    Serial.printf("[Realtime] >>> Instant Text Broadcast: '%s' <<<\n", cmdName);
                    _commandCallback(cmdName, cmdPayload);
                    return;
                }
            }
        }

        // Format 2: Direct command event name (e.g. event == "command", "RING", "PLAY_URL", "TTS", "VOICE_NOTE")
        if (strcmp(event, "command") == 0 || strcmp(event, "RING") == 0 || strcmp(event, "PLAY_URL") == 0 ||
            strcmp(event, "TTS") == 0 || strcmp(event, "VOICE_NOTE") == 0) {
            const char* cmdName = event;
            JsonObject cmdPayload;
            if (payload.is<JsonObject>()) {
                JsonObject p = payload.as<JsonObject>();
                if (p.containsKey("command")) {
                    cmdName = p["command"].as<const char*>();
                }
                cmdPayload = p.containsKey("payload") && p["payload"].is<JsonObject>() ? p["payload"].as<JsonObject>() : p;
            }
            if (_commandCallback) {
                Serial.printf("[Realtime] >>> Instant Command: '%s' <<<\n", cmdName);
                _commandCallback(cmdName, cmdPayload);
                return;
            }
        }

        // Format 3: Postgres change on command_queue (INSERT)
        if (strcmp(event, "INSERT") == 0 && String(topic).indexOf("command_queue") != -1) {
            JsonObject record;
            if (payload.is<JsonObject>()) {
                JsonObject p = payload.as<JsonObject>();
                if (p.containsKey("data") && p["data"].is<JsonObject>()) {
                    JsonObject d = p["data"].as<JsonObject>();
                    if (d.containsKey("record") && d["record"].is<JsonObject>()) {
                        record = d["record"].as<JsonObject>();
                    }
                } else if (p.containsKey("record") && p["record"].is<JsonObject>()) {
                    record = p["record"].as<JsonObject>();
                }
            }
            if (!record.isNull()) {
                const char* cmd = record["command"].as<const char*>();
                JsonObject cmdPayload = record["payload"].as<JsonObject>();
                if (cmd && _commandCallback) {
                    Serial.printf("[Realtime] >>> Instant Postgres INSERT on command_queue: '%s' <<<\n", cmd);
                    _commandCallback(cmd, cmdPayload);
                    return;
                }
            }
        }

        // Format 4: Schedule or bell_times modified (INSERT/UPDATE/DELETE or schedule_updated)
        static unsigned long lastScheduleCallbackTrigger = 0;
        if (strcmp(event, "schedule_updated") == 0 || 
            ((strcmp(event, "INSERT") == 0 || strcmp(event, "UPDATE") == 0 || strcmp(event, "DELETE") == 0) && String(topic).indexOf("bell_times") != -1)) {
            if (millis() - lastScheduleCallbackTrigger >= 10000) {
                lastScheduleCallbackTrigger = millis();
                Serial.println("[Realtime] Schedule modification detected! Triggering one-time sync...");
                if (_scheduleCallback) {
                    _scheduleCallback();
                }
            }
            return;
        }
    }
};

#endif // REALTIME_CLIENT_H
