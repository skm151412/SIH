package com.publicvision.util;

/**
 * Utility class for calculating distances between geographical coordinates
 */
public class GeoUtils {

    private static final double EARTH_RADIUS_KM = 6371.0;

    private GeoUtils() {
        // Private constructor to prevent instantiation
    }

    /**
     * Calculate the distance between two points using the Haversine formula
     *
     * @param lat1 Latitude of first point
     * @param lon1 Longitude of first point
     * @param lat2 Latitude of second point
     * @param lon2 Longitude of second point
     * @return Distance between the points in kilometers
     */
    public static double calculateDistanceInKm(double lat1, double lon1, double lat2, double lon2) {
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_KM * c;
    }

    /**
     * Check if two locations are within a specified distance of each other
     *
     * @param lat1 Latitude of first point
     * @param lon1 Longitude of first point
     * @param lat2 Latitude of second point
     * @param lon2 Longitude of second point
     * @param maxDistanceKm Maximum distance in kilometers
     * @return true if the distance is less than or equal to maxDistanceKm
     */
    public static boolean isWithinDistance(double lat1, double lon1, double lat2, double lon2, double maxDistanceKm) {
        return calculateDistanceInKm(lat1, lon1, lat2, lon2) <= maxDistanceKm;
    }
}
