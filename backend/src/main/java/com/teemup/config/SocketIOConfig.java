package com.teemup.config;

import com.corundumstudio.socketio.Configuration;
import com.corundumstudio.socketio.SocketIOServer;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

@org.springframework.context.annotation.Configuration
public class SocketIOConfig {

    private static final int PING_TIMEOUT_MS = 60_000;
    private static final int PING_INTERVAL_MS = 25_000;
    private static final int UPGRADE_TIMEOUT_MS = 10_000;

    @Value("${socketio.host}")
    private String host;

    @Value("${socketio.port}")
    private Integer port;

    @Value("${app.cors.allowed-origins:http://localhost:8081,http://localhost:19006}")
    private String allowedOrigins;

    private SocketIOServer server;

    @Bean
    public SocketIOServer socketIOServer() {
        Configuration config = new Configuration();
        config.setHostname(host);
        config.setPort(port);
        config.setOrigin(allowedOrigins);
        config.setPingTimeout(PING_TIMEOUT_MS);
        config.setPingInterval(PING_INTERVAL_MS);
        config.setUpgradeTimeout(UPGRADE_TIMEOUT_MS);

        server = new SocketIOServer(config);
        return server;
    }

    @PreDestroy
    public void stopSocketIOServer() {
        if (server != null) {
            server.stop();
        }
    }
}
