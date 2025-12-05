package com.shangmin.whisperrr.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Filter to add correlation ID to all requests for request tracking.
 * 
 * <p>This filter generates a unique correlation ID for each request and adds it
 * to the MDC (Mapped Diagnostic Context) for logging and to the response headers
 * for client tracking. If a correlation ID is already present in the request
 * headers, it uses that instead of generating a new one.</p>
 * 
 * <h3>Correlation ID Usage:</h3>
 * <ul>
 *   <li><strong>Request Tracking:</strong> Track requests across service boundaries</li>
 *   <li><strong>Logging:</strong> Include correlation ID in all log messages</li>
 *   <li><strong>Error Handling:</strong> Include correlation ID in error responses</li>
 *   <li><strong>Debugging:</strong> Easily trace requests through logs</li>
 * </ul>
 * 
 * <h3>Header Name:</h3>
 * <p>Uses "X-Correlation-ID" header name, which is a common standard for
 * correlation ID tracking in microservices architectures.</p>
 * 
 * @author shangmin
 * @version 1.0
 * @since 2024
 */
@Component
@Order(1)
public class CorrelationIdFilter extends OncePerRequestFilter {
    
    private static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
    private static final String CORRELATION_ID_MDC_KEY = "correlationId";
    
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        
        // Get correlation ID from request header or generate new one
        String correlationId = request.getHeader(CORRELATION_ID_HEADER);
        if (correlationId == null || correlationId.isEmpty()) {
            correlationId = UUID.randomUUID().toString();
        }
        
        // Add to MDC for logging
        MDC.put(CORRELATION_ID_MDC_KEY, correlationId);
        
        // Add to response headers
        response.setHeader(CORRELATION_ID_HEADER, correlationId);
        
        // Store in request attribute for use in controllers/services
        request.setAttribute(CORRELATION_ID_MDC_KEY, correlationId);
        
        try {
            filterChain.doFilter(request, response);
        } finally {
            // Clean up MDC after request
            MDC.remove(CORRELATION_ID_MDC_KEY);
        }
    }
}



