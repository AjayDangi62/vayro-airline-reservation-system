package com.vayro.airline.config;

import com.vayro.airline.entity.Flight;
import com.vayro.airline.entity.User;
import com.vayro.airline.enums.FlightStatus;
import com.vayro.airline.enums.Role;
import com.vayro.airline.repository.FlightRepository;
import com.vayro.airline.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
@Profile("!test") // Do not run automatic seeding in isolated unit/integration test profile
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final FlightRepository flightRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@vayro.com}")
    private String adminEmail;

    @Value("${app.admin.password:Admin@Vayro2026!}")
    private String adminPassword;

    public DataInitializer(UserRepository userRepository,
                           FlightRepository flightRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.flightRepository = flightRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedAdminUser();
        seedSampleFlights();
    }

    private void seedAdminUser() {
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = new User(
                    "Vayro Platform Admin",
                    adminEmail,
                    passwordEncoder.encode(adminPassword),
                    "+1-800-555-0199",
                    Role.ADMIN
            );
            userRepository.save(admin);
            log.info("Initialized default administrator account: {}", adminEmail);
        }
    }

    private void seedSampleFlights() {
        if (flightRepository.count() == 0) {
            LocalDateTime now = LocalDateTime.now();

            Flight flight1 = new Flight(
                    "VY-101",
                    "Vayro Air",
                    "JFK",
                    "LHR",
                    now.plusDays(2).withHour(8).withMinute(30).withSecond(0),
                    now.plusDays(2).withHour(20).withMinute(45).withSecond(0),
                    180,
                    180,
                    new BigDecimal("649.99"),
                    FlightStatus.SCHEDULED
            );

            Flight flight2 = new Flight(
                    "VY-202",
                    "Vayro Air",
                    "SFO",
                    "HND",
                    now.plusDays(3).withHour(11).withMinute(0).withSecond(0),
                    now.plusDays(4).withHour(15).withMinute(30).withSecond(0),
                    250,
                    250,
                    new BigDecimal("899.50"),
                    FlightStatus.SCHEDULED
            );

            Flight flight3 = new Flight(
                    "VY-303",
                    "Vayro Express",
                    "DXB",
                    "SIN",
                    now.plusDays(5).withHour(14).withMinute(15).withSecond(0),
                    now.plusDays(5).withHour(21).withMinute(45).withSecond(0),
                    160,
                    160,
                    new BigDecimal("420.00"),
                    FlightStatus.SCHEDULED
            );

            flightRepository.save(flight1);
            flightRepository.save(flight2);
            flightRepository.save(flight3);
            log.info("Initialized 3 sample demonstration flights for local testing");
        }
    }
}
