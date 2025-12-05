package com.shangmin.whisperrr.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Security configuration for adding security headers and request tracking.
 * 
 * <p>This configuration adds essential security headers to all HTTP responses
 * to protect against common web vulnerabilities and provides request tracking
 * capabilities.</p>
 * 
 * <h3>Security Headers Added:</h3>
 * <ul>
 *   <li><strong>X-Content-Type-Options:</strong> Prevents MIME type sniffing</li>
 *   <li><strong>X-Frame-Options:</strong> Prevents clickjacking attacks</li>
 *   <li><strong>X-XSS-Protection:</strong> Enables XSS filtering</li>
 *   <li><strong>Strict-Transport-Security:</strong> Enforces HTTPS (production)</li>
 *   <li><strong>Content-Security-Policy:</strong> Restricts resource loading</li>
 * </ul>
 * 
 * @author shangmin
 * @version 1.0
 * @since 2024
 */
@Configuration
public class SecurityConfig implements WebMvcConfigurer {
    
    private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new SecurityHeadersInterceptor());
    }
    
    /**
     * Interceptor to add security headers to all responses.
     */
    private static class SecurityHeadersInterceptor implements HandlerInterceptor {
        
        @Override
        public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
            // Add security headers
            response.setHeader("X-Content-Type-Options", "nosniff");
            response.setHeader("X-Frame-Options", "DENY");
            response.setHeader("X-XSS-Protection", "1; mode=block");
            response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
            
            // Content Security Policy - restrict resource loading
            response.setHeader("Content-Security-Policy", 
                "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'");
            
            // In production, enforce HTTPS
            // Uncomment in production:
            // response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
            
            return true;
        }
    }
}



