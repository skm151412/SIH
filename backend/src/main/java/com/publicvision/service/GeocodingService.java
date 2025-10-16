package com.publicvision.service;

import java.net.URI;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Service for handling geocoding and reverse geocoding requests
 */
@Service
public class GeocodingService {
    
    private final RestTemplate restTemplate;
    private static final String NOMINATIM_API_URL = "https://nominatim.openstreetmap.org/reverse";
    
    public GeocodingService() {
        this.restTemplate = new RestTemplate();
    }
    
    /**
     * Performs reverse geocoding using OpenStreetMap Nominatim API
     * 
     * @param lat Latitude
     * @param lng Longitude
     * @return Human-readable address or null if the address couldn't be determined
     */
    public String reverseGeocode(double lat, double lng) {
        try {
            URI uri = UriComponentsBuilder.fromHttpUrl(NOMINATIM_API_URL)
                .queryParam("lat", lat)
                .queryParam("lon", lng)
                .queryParam("format", "json")
                .queryParam("zoom", 18)  // Higher zoom level for more detailed results
                .queryParam("addressdetails", 1)
                .build()
                .toUri();
            
            // Add User-Agent header (required by Nominatim)
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "PublicVision-CivicIssueApp/1.0");
            
            ResponseEntity<String> response = restTemplate.exchange(
                uri,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                String.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK) {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode root = mapper.readTree(response.getBody());
                
                if (root.has("display_name")) {
                    return root.get("display_name").asText();
                } else {
                    System.err.println("No address found in reverse geocoding response");
                    return null;
                }
            } else {
                System.err.println("Reverse geocoding request failed with status: " + response.getStatusCode());
                return null;
            }
        } catch (Exception e) {
            System.err.println("Error performing reverse geocoding: " + e.getMessage());
            return null;
        }
    }
}