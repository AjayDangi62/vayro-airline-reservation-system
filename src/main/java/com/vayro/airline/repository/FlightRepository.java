package com.vayro.airline.repository;

import com.vayro.airline.entity.Flight;
import com.vayro.airline.enums.FlightStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Optional;

@Repository
public interface FlightRepository extends JpaRepository<Flight, Long> {

    Optional<Flight> findByFlightNumber(String flightNumber);

    boolean existsByFlightNumber(String flightNumber);

    @Query("SELECT f FROM Flight f WHERE UPPER(TRIM(f.source)) = UPPER(TRIM(:source)) " +
           "AND UPPER(TRIM(f.destination)) = UPPER(TRIM(:destination)) " +
           "AND f.departureTime >= :startTime AND f.departureTime <= :endTime " +
           "AND f.availableSeats >= :minSeats " +
           "AND f.status IN :statuses")
    Page<Flight> searchFlights(
            @Param("source") String source,
            @Param("destination") String destination,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("minSeats") int minSeats,
            @Param("statuses") Collection<FlightStatus> statuses,
            Pageable pageable
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT f FROM Flight f WHERE f.id = :id")
    Optional<Flight> findByIdForUpdate(@Param("id") Long id);
}
