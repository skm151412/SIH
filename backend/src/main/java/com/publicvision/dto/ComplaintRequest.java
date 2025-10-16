package com.publicvision.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.web.multipart.MultipartFile;

public class ComplaintRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 10, max = 100, message = "Title must be between 10 and 100 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(min = 20, message = "Description must be at least 20 characters to provide enough details")
    private String description;

    @NotBlank(message = "Category is required")
    private String category;

    @NotNull(message = "Location latitude is required")
    private Double locationLat;

    @NotNull(message = "Location longitude is required")
    private Double locationLng;

    @Size(min = 10, message = "Address must be at least 10 characters for accurate location information")
    private String address;

    private MultipartFile photo;

    public ComplaintRequest() {
    }

    public ComplaintRequest(String title, String description, String category, Double locationLat, Double locationLng, String address, MultipartFile photo) {
        this.title = title;
        this.description = description;
        this.category = category;
        this.locationLat = locationLat;
        this.locationLng = locationLng;
        this.address = address;
        this.photo = photo;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Double getLocationLat() {
        return locationLat;
    }

    public void setLocationLat(Double locationLat) {
        this.locationLat = locationLat;
    }

    public Double getLocationLng() {
        return locationLng;
    }

    public void setLocationLng(Double locationLng) {
        this.locationLng = locationLng;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public MultipartFile getPhoto() {
        return photo;
    }

    public void setPhoto(MultipartFile photo) {
        this.photo = photo;
    }
}
