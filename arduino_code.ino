#include <DHT.h>

#define FLAME_SENSOR_PIN 2
#define MQ2_SENSOR_PIN A0
#define DHT_SENSOR_PIN 3
#define BUZZER_PIN 7       // Buzzer connected to pin 7
#define DHT_TYPE DHT22
#define MQ2_THRESHOLD 500  // Adjust this threshold based on calibration

DHT dht(DHT_SENSOR_PIN, DHT_TYPE);

void setup() {
  Serial.begin(9600);
  dht.begin();
  pinMode(FLAME_SENSOR_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW); // Ensure buzzer is off initially
}

void loop() {
  bool activateBuzzer = false; // Flag to control buzzer state

  // Small delay before reading DHT, can sometimes help
  delay(100); 

  // --- Read Local Sensors ---
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  // Check if DHT reads failed (returned NAN)
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Failed to read from DHT sensor!");
    // Decide how to handle failure: retry, use old values, or send NAN
    // For now, we'll let the NAN values pass through
  }

  int mq2_value = analogRead(MQ2_SENSOR_PIN);
  // Flame sensor often goes LOW when flame detected, so !digitalRead is true for flame
  bool flame_detected = !digitalRead(FLAME_SENSOR_PIN);

  // --- Check Local Sensor Conditions ---
  if (flame_detected) {
    Serial.println("Local flame detected!"); // Debug message
    activateBuzzer = true;
  }
  if (mq2_value > MQ2_THRESHOLD) {
    Serial.println("Local smoke detected! MQ2: " + String(mq2_value)); // Debug message
    activateBuzzer = true;
  }

  // --- Check for Command from ESP32 ---
  // ESP32 sends commands via its TX pin (12) connected to Arduino RX pin (0) = Serial
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim(); // Remove potential whitespace/newlines
    if (command == "FIRE") {
       Serial.println("Received FIRE command from ESP32"); // Debug message
       activateBuzzer = true;
    }
  }

  // --- Control Buzzer ---
  if (activateBuzzer) {
    digitalWrite(BUZZER_PIN, HIGH);
  } else {
    digitalWrite(BUZZER_PIN, LOW);
  }

  // --- Send Sensor Data to ESP32 ---
  // Arduino sends via its TX pin (1) connected to ESP32 RX pin (13) = arduinoSerial on ESP32
  // Format: T:temperature,H:humidity,M:mq2_value,F:flame_detected
  String sensorData = "T:" + String(temperature, 1) +
                     ",H:" + String(humidity, 1) +
                     ",M:" + String(mq2_value) +
                     ",F:" + String(flame_detected);

  Serial.println(sensorData); // Send data over Serial for ESP32 to read
  delay(2000); // Maintain original delay
} 