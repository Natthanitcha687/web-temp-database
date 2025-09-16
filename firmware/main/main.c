// firmware/main/main.c
#include <stdio.h>
#include <string.h>                // <-- ต้องมีสำหรับ strcpy / strlen
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "esp_wifi.h"
#include "nvs_flash.h"
#include "esp_event.h"
#include "esp_netif.h"
#include "esp_http_client.h"

#define WIFI_SSID  "Babytoonz"
#define WIFI_PASS  "gartooninter1234"
// *** แก้ช่องว่างออก ***  ห้ามมี space หลัง http://
#define SERVER_URL "http://172.20.10.2:3000/api/data"

#define TAG "WEB_TEMP"

static void wifi_init_sta(void) {
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    esp_netif_create_default_wifi_sta();

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));
    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA));

    wifi_config_t wifi_config = { 0 };
    strcpy((char*)wifi_config.sta.ssid, WIFI_SSID);
    strcpy((char*)wifi_config.sta.password, WIFI_PASS);
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_config));
    ESP_ERROR_CHECK(esp_wifi_start());
    ESP_ERROR_CHECK(esp_wifi_connect());
}

static void send_data(float temp, float hum) {
    char post_data[128];
    snprintf(post_data, sizeof(post_data),
             "{\"temperature\":%.1f,\"humidity\":%.1f,\"deviceId\":\"esp32-1\"}",
             temp, hum);

    esp_http_client_config_t config = {
        .url = SERVER_URL,
        .transport_type = HTTP_TRANSPORT_OVER_TCP,
        .timeout_ms = 8000,
    };

    esp_http_client_handle_t client = esp_http_client_init(&config);
    esp_http_client_set_method(client, HTTP_METHOD_POST);
    esp_http_client_set_header(client, "Content-Type", "application/json");
    esp_http_client_set_header(client, "Accept", "application/json");
    esp_http_client_set_post_field(client, post_data, strlen(post_data));

    esp_err_t err = esp_http_client_perform(client);
    if (err == ESP_OK) {
        int status = esp_http_client_get_status_code(client);
        ESP_LOGI(TAG, "HTTP POST OK, Status=%d", status);

        // (ออปชัน) อ่าน response body
        char buf[128];
        int n = esp_http_client_read(client, buf, sizeof(buf)-1);
        if (n > 0) { buf[n] = 0; ESP_LOGI(TAG, "Resp: %s", buf); }
    } else {
        ESP_LOGE(TAG, "HTTP POST failed: %s", esp_err_to_name(err));
    }
    esp_http_client_cleanup(client);
}

void app_main(void) {
    ESP_ERROR_CHECK(nvs_flash_init());
    wifi_init_sta();

    vTaskDelay(5000 / portTICK_PERIOD_MS); // รอให้ Wi-Fi ติดจริงก่อน

    while (1) {
        float temp = 25.0f + (esp_random() % 100) / 10.0f;
        float hum  = 50.0f + (esp_random() % 100) / 10.0f;
        ESP_LOGI(TAG, "Temp=%.1f Hum=%.1f", temp, hum);
        send_data(temp, hum);
        vTaskDelay(15000 / portTICK_PERIOD_MS); // ทุก 15 วินาที
    }
}
