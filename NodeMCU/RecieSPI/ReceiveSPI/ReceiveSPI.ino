//#include <TinySPI.h>
#include <SPI.h>

const uint8_t slaveSelectPin = 10;

void setup (void) {
  Serial.begin(115200); //set baud rate to 115200 for usart
  pinMode(slaveSelectPin, OUTPUT);
  digitalWrite(slaveSelectPin, HIGH); // disable Slave Select
  //SPI.beginTransaction(SPISettings(14000000, MSBFIRST, SPI_MODE0));
  SPI.begin();
  SPI.setClockDivider(SPI_CLOCK_DIV8);//divide the clock by 8
}

void loop (void) {
  // send test int
  for (uint8_t i = 0; i < 32; i++) {
    digitalWrite(slaveSelectPin, LOW); // enable Slave Select
    delay(1000);
    SPI.transfer(i);
    Serial.println(i);
    digitalWrite(slaveSelectPin, HIGH); // disable Slave Select
  }
  //SPI.begin();
  //SPI.endTransaction();
  delay(10);
}
