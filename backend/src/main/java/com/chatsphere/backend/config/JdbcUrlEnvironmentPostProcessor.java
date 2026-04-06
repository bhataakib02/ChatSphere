package com.chatsphere.backend.config;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

/**
 * Accepts Aiven/Heroku-style {@code postgres://user:pass@host:port/db?...} in {@code DB_URL} or
 * {@code DATABASE_URL} and maps to {@code spring.datasource.*} so Hikari gets a proper JDBC URL.
 */
@Order(Ordered.LOWEST_PRECEDENCE)
public class JdbcUrlEnvironmentPostProcessor implements EnvironmentPostProcessor {

    private static final String MAP_NAME = "chatsphere-jdbc-url-normalize";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String raw = environment.getProperty("DB_URL");
        if (raw == null || raw.isBlank()) {
            raw = environment.getProperty("DATABASE_URL");
        }
        if (raw == null || raw.isBlank() || raw.startsWith("jdbc:")) {
            return;
        }
        if (!raw.startsWith("postgres://") && !raw.startsWith("postgresql://")) {
            return;
        }

        Parsed parsed = parsePostgresUri(raw);
        if (parsed == null) {
            return;
        }

        Map<String, Object> map = new HashMap<>();
        map.put("spring.datasource.url", parsed.jdbcUrl());

        String dbUser = environment.getProperty("DB_USER");
        String dbPass = environment.getProperty("DB_PASSWORD");
        if ((dbUser == null || dbUser.isBlank()) && parsed.username() != null) {
            map.put("spring.datasource.username", parsed.username());
        }
        if ((dbPass == null || dbPass.isBlank()) && parsed.password() != null) {
            map.put("spring.datasource.password", parsed.password());
        }

        environment.getPropertySources().addFirst(new MapPropertySource(MAP_NAME, map));
    }

    private static Parsed parsePostgresUri(String uri) {
        try {
            String rest = uri.replaceFirst("^postgres(ql)?://", "");
            int at = rest.indexOf('@');
            if (at < 0) {
                return null;
            }
            String userInfo = rest.substring(0, at);
            String hostPart = rest.substring(at + 1);

            int colon = userInfo.indexOf(':');
            if (colon < 0) {
                return null;
            }
            String user = URLDecoder.decode(userInfo.substring(0, colon), StandardCharsets.UTF_8);
            String password = URLDecoder.decode(userInfo.substring(colon + 1), StandardCharsets.UTF_8);
            String jdbcUrl = "jdbc:postgresql://" + hostPart;
            return new Parsed(jdbcUrl, user, password);
        } catch (Exception e) {
            return null;
        }
    }

    private record Parsed(String jdbcUrl, String username, String password) {}
}
