package com.vayro.airline.repository;

import com.vayro.airline.entity.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    @Query("SELECT b FROM Booking b JOIN FETCH b.flight JOIN FETCH b.user WHERE b.bookingReference = :bookingReference")
    Optional<Booking> findByBookingReference(@Param("bookingReference") String bookingReference);

    @Query("SELECT b FROM Booking b JOIN FETCH b.flight WHERE b.user.id = :userId")
    Page<Booking> findByUser_Id(@Param("userId") Long userId, Pageable pageable);

    @Query(value = "SELECT b FROM Booking b JOIN FETCH b.flight JOIN FETCH b.user",
           countQuery = "SELECT COUNT(b) FROM Booking b")
    Page<Booking> findAllWithDetails(Pageable pageable);

    boolean existsByBookingReference(String bookingReference);
}
