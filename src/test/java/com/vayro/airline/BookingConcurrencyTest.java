package com.vayro.airline;

import com.vayro.airline.dto.BookingRequest;
import com.vayro.airline.dto.BookingResponse;
import com.vayro.airline.entity.Flight;
import com.vayro.airline.entity.User;
import com.vayro.airline.enums.FlightStatus;
import com.vayro.airline.enums.Role;
import com.vayro.airline.repository.BookingRepository;
import com.vayro.airline.repository.FlightRepository;
import com.vayro.airline.repository.UserRepository;
import com.vayro.airline.service.BookingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@ActiveProfiles("test")
class BookingConcurrencyTest {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private FlightRepository flightRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Long flightId;
    private final List<String> userEmails = new ArrayList<>();

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAll();
        flightRepository.deleteAll();
        userRepository.deleteAll();
        userEmails.clear();

        // Create flight with only 1 available seat
        Flight flight = new Flight(
                "VY-CONCURRENCY-1",
                "Vayro Express",
                "JFK",
                "ORD",
                LocalDateTime.now().plusDays(2),
                LocalDateTime.now().plusDays(2).plusHours(3),
                1, // Total seats = 1
                1, // Available seats = 1
                new BigDecimal("199.99"),
                FlightStatus.SCHEDULED
        );
        flight = flightRepository.save(flight);
        flightId = flight.getId();

        // Create 2 distinct customer accounts
        for (int i = 1; i <= 2; i++) {
            String email = "racer" + i + "@vayro.com";
            User user = new User("Racer " + i, email, passwordEncoder.encode("Pass123!"), "+12345678", Role.USER);
            userRepository.save(user);
            userEmails.add(email);
        }
    }

    @Test
    @DisplayName("Concurrency: Prevent overselling when concurrent requests contest the last available seat")
    void testConcurrentBooking_PreventsOverselling() throws InterruptedException {
        int threadCount = 2;
        ExecutorService executorService = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch endLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);
        List<Exception> capturedExceptions = Collections.synchronizedList(new ArrayList<>());

        for (int i = 0; i < threadCount; i++) {
            final String email = userEmails.get(i);
            executorService.submit(() -> {
                try {
                    startLatch.await(); // Synchronize all threads to fire simultaneously
                    BookingRequest request = new BookingRequest(flightId, 1);
                    BookingResponse response = bookingService.createBooking(request, email);
                    if (response != null) {
                        successCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    failureCount.incrementAndGet();
                    capturedExceptions.add(e);
                } finally {
                    endLatch.countDown();
                }
            });
        }

        startLatch.countDown(); // Fire both threads at once!
        boolean finishedInTime = endLatch.await(10, TimeUnit.SECONDS);
        executorService.shutdown();

        // Assertions:
        // 1. All threads finished execution
        assertEquals(true, finishedInTime);

        // 2. Exactly ONE booking must succeed because there was only 1 seat available
        assertEquals(1, successCount.get(), "Exactly one concurrent booking should succeed for the last seat");

        // 3. Exactly ONE booking must fail (preventing overselling)
        assertEquals(1, failureCount.get(), "The losing concurrent booking must fail");

        // 4. Verify remaining available seats in database is strictly 0 (never negative)
        Flight updatedFlight = flightRepository.findById(flightId).orElseThrow();
        assertEquals(0, updatedFlight.getAvailableSeats(), "Remaining seats must be exactly 0 (no overselling)");

        // 5. Total confirmed bookings in DB must be exactly 1
        assertEquals(1, bookingRepository.count(), "Total confirmed bookings in DB must be exactly 1");
    }
}
