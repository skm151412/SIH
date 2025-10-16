package com.publicvision.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class UpdateStatusRequest {

    @NotNull(message = "Status is required")
    private String status;

    @NotBlank(message = "Comment is required")
    private String comment;

    public UpdateStatusRequest() {
    }

    public UpdateStatusRequest(String status, String comment) {
        this.status = status;
        this.comment = comment;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
