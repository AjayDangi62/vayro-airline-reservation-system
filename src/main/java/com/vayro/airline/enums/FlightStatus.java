package com.vayro.airline.enums;

public enum FlightStatus {
    SCHEDULED,
    ACTIVE,
    DELAYED,
    CANCELLED,
    COMPLETED;

    public boolean isBookable() {
        return this == SCHEDULED || this == ACTIVE;
    }
}
