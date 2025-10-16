package com.publicvision.dto;

import jakarta.validation.constraints.NotBlank;

public class ReopenRequest {

    @NotBlank(message = "Reopen reason is required")
    private String reopenReason;

    public ReopenRequest() {
    }

    public ReopenRequest(String reopenReason) {
        this.reopenReason = reopenReason;
    }

    public String getReopenReason() {
        return reopenReason;
    }

    public void setReopenReason(String reopenReason) {
        this.reopenReason = reopenReason;
    }
}
