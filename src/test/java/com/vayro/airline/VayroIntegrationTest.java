package com.vayro.airline;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vayro.airline.dto.BookingRequest;
import com.vayro.airline.dto.FlightRequest;
import com.vayro.airline.dto.LoginRequest;
import com.vayro.airline.dto.RegisterRequest;
import com.vayro.airline.entity.User;
import com.vayro.airline.enums.Role;
import com.vayro.airline.repository.BookingRepository;
import com.vayro.airline.repository.FlightRepository;
import com.vayro.airline.repository.UserRepository;
import com.vayro.airline.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class VayroIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FlightRepository flightRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private String adminToken;
    private String userToken;
    private User testUser;
    private User adminUser;

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAll();
        flightRepository.deleteAll();
        userRepository.deleteAll();

        // Seed test admin
        adminUser = new User("Vayro Admin", "admin@vayro.com", passwordEncoder.encode("AdminPass123!"), "+111222333", Role.ADMIN);
        adminUser = userRepository.save(adminUser);
        adminToken = jwtTokenProvider.generateToken(adminUser.getEmail(), adminUser.getId(), adminUser.getRole().name());

        // Seed normal test user
        testUser = new User("Alice Traveler", "alice@vayro.com", passwordEncoder.encode("UserPass123!"), "+1987654321", Role.USER);
        testUser = userRepository.save(testUser);
        userToken = jwtTokenProvider.generateToken(testUser.getEmail(), testUser.getId(), testUser.getRole().name());
    }

    @Test
    @DisplayName("Integration: Register, Login, Duplicate Rejection, Profile Retrieval")
    void authLifecycle_Integration() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest("Bob Smith", "bob@vayro.com", "SecurePwd123!", "+1555666777");

        // 1. Register successfully
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("bob@vayro.com"))
                .andExpect(jsonPath("$.user.role").value("USER"));

        // 2. Reject duplicate email registration
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("already exists")));

        // 3. Login with credentials
        LoginRequest loginRequest = new LoginRequest("bob@vayro.com", "SecurePwd123!");
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();

        String bobToken = objectMapper.readTree(loginResult.getResponse().getContentAsString()).get("token").asText();

        // 4. Retrieve current authenticated user profile
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("bob@vayro.com"))
                .andExpect(jsonPath("$.fullName").value("Bob Smith"));
    }

    @Test
    @DisplayName("Integration: Role-Based Access Control - User cannot perform Admin operations")
    void roleBasedAccessControl_Integration() throws Exception {
        LocalDateTime departure = LocalDateTime.now().plusDays(3);
        FlightRequest flightRequest = new FlightRequest("VY-999", "Vayro Wings", "BOS", "LAX",
                departure, departure.plusHours(6), 150, new BigDecimal("320.00"));

        // Attempt admin operation with regular USER token -> Expect 403 Forbidden
        mockMvc.perform(post("/api/v1/admin/flights")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(flightRequest)))
                .andExpect(status().isForbidden());

        // Attempt without any token -> Expect 401 Unauthorized
        mockMvc.perform(post("/api/v1/admin/flights")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(flightRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Integration: Complete Flight, Search, Booking and Cancellation Flow")
    void fullBookingLifecycle_Integration() throws Exception {
        LocalDate travelDate = LocalDate.now().plusDays(7);
        LocalDateTime departure = travelDate.atTime(10, 0, 0);
        LocalDateTime arrival = travelDate.atTime(16, 30, 0);

        FlightRequest flightRequest = new FlightRequest(
                "VY-777",
                "Vayro Intercontinental",
                "ORD",
                "MIA",
                departure,
                arrival,
                100,
                new BigDecimal("250.00")
        );

        // 1. Admin creates flight
        MvcResult flightResult = mockMvc.perform(post("/api/v1/admin/flights")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(flightRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.flightNumber").value("VY-777"))
                .andExpect(jsonPath("$.availableSeats").value(100))
                .andReturn();

        JsonNode flightNode = objectMapper.readTree(flightResult.getResponse().getContentAsString());
        Long flightId = flightNode.get("id").asLong();

        // 2. Public user searches for flight
        mockMvc.perform(get("/api/v1/flights/search")
                        .param("source", "ORD")
                        .param("destination", "MIA")
                        .param("travelDate", travelDate.toString())
                        .param("minSeats", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].flightNumber").value("VY-777"));

        // 3. Authenticated customer books 3 seats
        BookingRequest bookingRequest = new BookingRequest(flightId, 3);
        MvcResult bookingResult = mockMvc.perform(post("/api/v1/bookings")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bookingRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.bookingReference", startsWith("VAYRO-")))
                .andExpect(jsonPath("$.numberOfPassengers").value(3))
                .andExpect(jsonPath("$.totalPrice").value(750.00)) // 3 * 250.00
                .andExpect(jsonPath("$.bookingStatus").value("CONFIRMED"))
                .andReturn();

        String bookingRef = objectMapper.readTree(bookingResult.getResponse().getContentAsString())
                .get("bookingReference").asText();

        // 4. Verify seats decremented from 100 to 97
        mockMvc.perform(get("/api/v1/flights/" + flightId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.availableSeats").value(97));

        // 5. Customer fetches "My Bookings"
        mockMvc.perform(get("/api/v1/bookings/my")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].bookingReference").value(bookingRef));

        // 6. Customer cancels booking
        mockMvc.perform(patch("/api/v1/bookings/" + bookingRef + "/cancel")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookingStatus").value("CANCELLED"));

        // 7. Verify seats restored from 97 back to 100
        mockMvc.perform(get("/api/v1/flights/" + flightId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.availableSeats").value(100));

        // 8. Attempt repeated cancellation -> Expect 400 Bad Request
        mockMvc.perform(patch("/api/v1/bookings/" + bookingRef + "/cancel")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("already cancelled")));
    }

    @Test
    @DisplayName("Integration: Request validation error responses format")
    void validationErrorHandling_Integration() throws Exception {
        // Invalid registration request: missing email and short password
        RegisterRequest invalidRequest = new RegisterRequest("", "not-an-email", "123", "");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.email").isNotEmpty())
                .andExpect(jsonPath("$.validationErrors.password").isNotEmpty())
                .andExpect(jsonPath("$.validationErrors.fullName").isNotEmpty());
    }
}
