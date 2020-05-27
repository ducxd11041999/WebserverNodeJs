#include "Radio.h"
#include <ESP8266WiFi.h>
#include <SocketIOClient.h>
SocketIOClient client;
const char* ssid = "MQ_Network";          //Tên mạng Wifi mà Socket server của bạn đang kết nối
const char* password = "1denmuoi1";  //Pass mạng wifi ahihi, anh em rãnh thì share pass cho mình với.
char host[] = "23.101.29.47";  //Địa chỉ IP dịch vụ, hãy thay đổi nó theo địa chỉ IP Socket server của bạn.
int port =  5000;                  //Cổng dịch vụ socket server do chúng ta tạo!
//từ khóa extern: dùng để #include các biến toàn cục ở một số thư viện khác. Trong thư viện SocketIOClient có hai biến toàn cục
// mà chúng ta cần quan tâm đó là
// RID: Tên hàm (tên sự kiện
// Rfull: Danh sách biến (được đóng gói lại là chuối JSON)
extern String RID;
extern String Rfull;
//Một số biến dùng cho việc tạo một task
unsigned long previousMillis = 0;
long interval = 2000;


#define IS_MASTER 1

#define RF_FREQUENCY                                2400000000// Hz
#define TX_OUTPUT_POWER                             10 // dBm
#define RX_TIMEOUT_TICK_SIZE                        RADIO_TICK_SIZE_1000_US
#define RX_TIMEOUT_VALUE                            1000 // ms
#define TX_TIMEOUT_VALUE                            1000 // ms
#define BUFFER_SIZE                                 255

const uint8_t PingMsg[] = "PING";
const uint8_t PongMsg[] = "PONG";
#define PINGPONGSIZE                                4

typedef enum
{
  APP_LOWPOWER,
  APP_RX,
  APP_RX_TIMEOUT,
  APP_RX_ERROR,
  APP_TX,
  APP_TX_TIMEOUT,
} AppStates_t;

void txDoneIRQ( void );
void rxDoneIRQ( void );
void rxSyncWordDoneIRQ( void );
void rxHeaderDoneIRQ( void );
void txTimeoutIRQ( void );
void rxTimeoutIRQ( void );
void rxErrorIRQ( IrqErrorCode_t errCode );
void rangingDoneIRQ( IrqRangingCode_t val );
void cadDoneIRQ( bool cadFlag );
void debugIRQ(uint32_t reg);
RadioCallbacks_t Callbacks = {
  txDoneIRQ,
  rxDoneIRQ,
  rxSyncWordDoneIRQ,
  rxHeaderDoneIRQ,
  txTimeoutIRQ,
  rxTimeoutIRQ,
  rxErrorIRQ,
  rangingDoneIRQ,
  cadDoneIRQ,
  debugIRQ,
};

extern const Radio_t Radio;

uint16_t RxIrqMask = IRQ_RX_DONE | IRQ_RX_TX_TIMEOUT;
uint16_t TxIrqMask = IRQ_TX_DONE ;

PacketParams_t packetParams;
PacketStatus_t packetStatus;
ModulationParams_t modulationParams;

AppStates_t AppState = APP_LOWPOWER;
uint8_t Buffer[BUFFER_SIZE];
uint8_t BufferSize = BUFFER_SIZE;
uint8_t counter = 0;

void setup() {
  Serial.begin(9600);
  Serial.println("SX1280");

  Radio.Init(&Callbacks);
  Radio.SetRegulatorMode( USE_DCDC ); // Can also be set in LDO mode but consume more power
  Serial.println( "\n\n\r     SX1280 Ping Pong Demo Application. \n\n\r");
  //Việc đầu tiên cần làm là kết nối vào mạng Wifi
  Serial.print("Ket noi vao mang ");
  Serial.println(ssid);

  //Kết nối vào mạng Wifi
  WiFi.begin(ssid, password);

  //Chờ đến khi đã được kết nối
  while (WiFi.status() != WL_CONNECTED) { //Thoát ra khỏi vòng
    delay(500);
    Serial.print('.');
  }

  Serial.println();
  Serial.println(F("Da ket noi WiFi"));
  Serial.println(F("Di chi IP cua ESP8266 (Socket Client ESP8266): "));
  Serial.println(WiFi.localIP());

  if (!client.connect(host, port)) {
    Serial.println(F("Ket noi den socket server that bai!"));
    return;
  }

  //Khi đã kết nối thành công
  if (client.connected()) {
    Serial.println("Ok");
    client.send("connection", "message", "Connected !!!!");
  }


  modulationParams.PacketType = PACKET_TYPE_LORA;

  modulationParams.Params.LoRa.SpreadingFactor = LORA_SF7;
  modulationParams.Params.LoRa.Bandwidth = LORA_BW_1600;
  modulationParams.Params.LoRa.CodingRate = LORA_CR_4_5;

  packetParams.PacketType = PACKET_TYPE_LORA;

  packetParams.Params.LoRa.PreambleLength = 12;
  packetParams.Params.LoRa.HeaderType = LORA_PACKET_VARIABLE_LENGTH;
  packetParams.Params.LoRa.PayloadLength = 1;
  packetParams.Params.LoRa.Crc = LORA_CRC_OFF;
  packetParams.Params.LoRa.InvertIQ = LORA_IQ_NORMAL;

  Radio.SetStandby( STDBY_RC );
  Radio.SetPacketType( modulationParams.PacketType );
  Radio.SetModulationParams( &modulationParams );
  Radio.SetPacketParams( &packetParams );
  Radio.SetRfFrequency( RF_FREQUENCY );
  Radio.SetBufferBaseAddresses( 0x00, 0x00 );
  Radio.SetTxParams( TX_OUTPUT_POWER, RADIO_RAMP_20_US );

  uint8_t syncWord[] = {0xDD, 0xA0, 0x96, 0x69, 0xDD};
  Radio.SetSyncWord( 1, syncWord);


  if (IS_MASTER)
  {
    Radio.SetDioIrqParams( TxIrqMask, TxIrqMask, IRQ_RADIO_NONE, IRQ_RADIO_NONE );
  }
  else
  {
    Radio.SetDioIrqParams( RxIrqMask, RxIrqMask, IRQ_RADIO_NONE, IRQ_RADIO_NONE );
    Radio.SetRx( ( TickTime_t ) {
      RX_TIMEOUT_TICK_SIZE, RX_TIMEOUT_VALUE
    }  );
  }
  AppState = APP_LOWPOWER;
}

void loop() {
  if (IS_MASTER)
  {
    //  if(Serial.available())
    {
      uint8_t data = Serial.read();
      //   Serial.println("MST");
      Radio.SendPayload( &counter, 1, ( TickTime_t ) {
        RX_TIMEOUT_TICK_SIZE, TX_TIMEOUT_VALUE
      }, 0 );

      if (++counter > 100) counter = 0;

      delay(1000);
    }
  }
  else
  {
    //Serial.println("Send");
   // client.send("CLIENT-SEND-TEMP_HUM", "message", "Ok ok");
    switch (AppState)
    {
      case APP_LOWPOWER:
        break;
      case APP_RX:
        AppState = APP_LOWPOWER;

        Radio.GetPayload( Buffer, &BufferSize, BUFFER_SIZE );
        if (BufferSize > 0)
        {
          Serial.print("RX ");
          Serial.print(BufferSize);
          Serial.println(" bytes:");

          for (int i = 0; i < BufferSize; i++)
          {
            Serial.println(Buffer[i]);
          }
        }

        Radio.SetRx( ( TickTime_t ) {
          RX_TIMEOUT_TICK_SIZE, RX_TIMEOUT_VALUE
        }  );
        break;
      case APP_RX_TIMEOUT:
        AppState = APP_LOWPOWER;

        Serial.println("Timeout");
        Radio.SetRx( ( TickTime_t ) {
          RX_TIMEOUT_TICK_SIZE, RX_TIMEOUT_VALUE
        }  );

        break;
      case APP_RX_ERROR:
        AppState = APP_LOWPOWER;
        break;
      case APP_TX:
        AppState = APP_LOWPOWER;
        break;
      case APP_TX_TIMEOUT:
        AppState = APP_LOWPOWER;
        break;
      default:
        AppState = APP_LOWPOWER;
        break;
    }
  }
}

void txDoneIRQ( void )
{
  AppState = APP_TX;
  Serial.println("Sent");
}

void rxDoneIRQ( void )
{
  AppState = APP_RX;
}

void rxSyncWordDoneIRQ( void )
{
}

void rxHeaderDoneIRQ( void )
{
}

void txTimeoutIRQ( void )
{
  AppState = APP_TX_TIMEOUT;
}

void rxTimeoutIRQ( void )
{
  AppState = APP_RX_TIMEOUT;
}

void rxErrorIRQ( IrqErrorCode_t errCode )
{
  AppState = APP_RX_ERROR;
}

void rangingDoneIRQ( IrqRangingCode_t val )
{
}

void cadDoneIRQ( bool cadFlag )
{
}
void debugIRQ(uint32_t reg)
{
  Serial.println(reg);
}
