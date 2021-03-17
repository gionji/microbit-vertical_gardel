function swith_all_relays (relay_state: number) {
    pump_state = relay_state
    lamp_1_state = relay_state
    lamp_2_state = relay_state
    apply_relays_status()
}
function irrigate () {
    pump_state = 1
    pins.digitalWritePin(DigitalPin.P13, pump_state)
    send_data_to_thingspeak()
    basic.pause(2000)
    pump_state = 0
    pins.digitalWritePin(DigitalPin.P13, pump_state)
}
function light_time_check () {
    if (RTC_DS1307.getTime(RTC_DS1307.TimeType.HOUR) < 18) {
        lamp_1_state = 1
        lamp_2_state = 1
    } else {
        lamp_1_state = 0
        lamp_2_state = 0
    }
    pins.digitalWritePin(DigitalPin.P15, lamp_1_state)
    pins.digitalWritePin(DigitalPin.P16, lamp_2_state)
}
input.onButtonPressed(Button.A, function () {
    switch_light(2)
})
input.onButtonPressed(Button.AB, function () {
    irrigate()
})
function apply_relays_status () {
    pins.digitalWritePin(DigitalPin.P13, pump_state)
    pins.digitalWritePin(DigitalPin.P15, lamp_1_state)
    pins.digitalWritePin(DigitalPin.P16, lamp_2_state)
}
input.onButtonPressed(Button.B, function () {
    switch_light(1)
})
function read_sensors () {
    moisture_01 = Environment.ReadSoilHumidity(AnalogPin.P1)
    water_level = Environment.ReadWaterLevel(AnalogPin.P2)
    mq135 = pins.analogReadPin(AnalogPin.P3)
    light2 = Environment.ReadLightIntensity(AnalogPin.P4)
    temperature = Environment.octopus_BME280(Environment.BME280_state.BME280_temperature_C)
    pressure = Environment.octopus_BME280(Environment.BME280_state.BME280_pressure)
    humidity = Environment.octopus_BME280(Environment.BME280_state.BME280_humidity)
    presence = Environment.PIR(DigitalPin.P14)
}
function switch_light (num: number) {
    if (num == 1) {
        if (lamp_1_state == 0) {
            lamp_1_state = 1
        } else {
            lamp_1_state = 0
        }
        pins.digitalWritePin(DigitalPin.P15, lamp_1_state)
    } else {
        if (lamp_2_state == 0) {
            lamp_2_state = 1
        } else {
            lamp_2_state = 0
        }
        pins.digitalWritePin(DigitalPin.P16, lamp_2_state)
    }
    send_data_to_thingspeak()
}
function send_data_to_thingspeak () {
    if (ESP8266_IoT.thingSpeakState(true)) {
        ESP8266_IoT.setData(
        "GOAHTC2VJJ7U3LE8",
        light2,
        temperature,
        humidity,
        moisture_01,
        mq135,
        parseFloat("" + convertToText(lamp_1_state) + convertToText(lamp_2_state)),
        pump_state,
        presence
        )
        ESP8266_IoT.uploadData()
    } else {
        OLED.clear()
        OLED.writeString("Things speak \\n disconnected")
    }
}
function connect_to_wifi () {
    ESP8266_IoT.initWIFI(SerialPin.P8, SerialPin.P12, BaudRate.BaudRate115200)
    ESP8266_IoT.connectWifi("gionji-padwei", "topatopatopa")
    if (ESP8266_IoT.wifiState(true)) {
        OLED.writeStringNewLine("wifi connected")
    } else {
        OLED.writeStringNewLine("not connected")
    }
    ESP8266_IoT.wait(2000)
}
function print_variables () {
    OLED.clear()
    OLED.writeString("T-H-P: ")
    OLED.writeNum(temperature)
    OLED.writeString(" ")
    OLED.writeNum(humidity)
    OLED.writeString(" ")
    OLED.writeNumNewLine(pressure)
    OLED.writeString("Mois: ")
    OLED.writeNum(moisture_01)
    OLED.writeString(" ")
    OLED.writeNumNewLine(water_level)
    OLED.writeString("MQ135: ")
    OLED.writeNumNewLine(mq135)
    OLED.writeString("Lamps: ")
    OLED.writeNum(lamp_1_state)
    OLED.writeString(" ")
    OLED.writeNum(lamp_2_state)
    OLED.writeString(" ")
    OLED.writeNumNewLine(pump_state)
    OLED.writeString("Time:")
    OLED.writeNumNewLine(RTC_DS1307.getTime(RTC_DS1307.TimeType.HOUR))
    OLED.writeString("Light: ")
    OLED.writeNumNewLine(light2)
}
let presence = 0
let humidity = 0
let pressure = 0
let temperature = 0
let light2 = 0
let mq135 = 0
let water_level = 0
let moisture_01 = 0
let lamp_2_state = 0
let lamp_1_state = 0
let pump_state = 0
OLED.init(128, 64)
connect_to_wifi()
ESP8266_IoT.connectThingSpeak()
pump_state = 0
lamp_1_state = 1
lamp_2_state = 1
apply_relays_status()
basic.forever(function () {
    basic.pause(10000)
    read_sensors()
    print_variables()
    send_data_to_thingspeak()
})
