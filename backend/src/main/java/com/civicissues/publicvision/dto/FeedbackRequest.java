package com.civicissues.publicvision.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public class FeedbackRequest {

    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer rating;

    private String feedback;

    public FeedbackRequest() {
    }

    public FeedbackRequest(Integer rating, String feedback) {
        this.rating = rating;
        this.feedback = feedback;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }
}
