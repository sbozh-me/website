# Analytics Infrastructure Implementation Notes

## Date: December 14, 2025

### Summary

Successfully implemented version 0.9.0 of the analytics infrastructure with Docker Compose, setting up Umami for web analytics and GlitchTip for error tracking.

## Working Components

### ✅ PostgreSQL Database
- Status: **Fully operational**
- Both `umami_db` and `glitchtip_db` databases created successfully
- Health checks passing
- Memory usage: ~100MB

### ✅ Redis Cache
- Status: **Fully operational**
- Health checks passing
- Memory usage: ~50MB

### ✅ Umami Analytics
- Status: **Fully operational**
- Accessible at: http://localhost:3001
- Default credentials: admin/umami
- Memory usage: ~200MB
- Ready for website configuration

### ⚠️ GlitchTip Error Tracking
- Status: **Partially operational**
- Container running but connection issues on port 3002
- Database migrations completed successfully
- Worker container experiencing restarts (memory issues resolved by increasing limit to 512MB)
- May need additional configuration or different image version

## Issues Encountered & Solutions

### 1. Password Special Characters
**Issue**: Initial generated password contained special characters (`/`, `+`) that broke PostgreSQL connection URLs.

**Solution**: Generated URL-safe passwords without special characters:
```bash
openssl rand -base64 24 | tr -d '/+=' | head -c 24
```

### 2. Docker Compose Version Warning
**Issue**: Warning about obsolete `version` attribute in docker-compose.yml

**Solution**: Can be safely ignored or remove the `version: '3.8'` line from docker-compose.yml

### 3. GlitchTip Connection Issues
**Issue**: GlitchTip web service returns "Connection reset by peer" on port 3002

**Attempted Solutions**:
- Increased memory limits
- Restarted containers
- Checked internal service status

**Current Status**: Container is running, uWSGI is initialized, but external connection fails. This may be:
- A configuration issue with uWSGI
- Network configuration problem
- Image compatibility issue with Apple Silicon

**Workaround**: For now, focus on Umami for analytics. GlitchTip can be debugged separately.

### 4. GlitchTip Worker Memory
**Issue**: Worker container kept restarting with exit code 137 (out of memory)

**Solution**: Increased memory limit from 256MB to 512MB in docker-compose.yml

## Configuration Adjustments

### Memory Limits
Updated default memory limits for better stability:
- PostgreSQL: 512MB
- Umami: 512MB
- GlitchTip Web: 512MB
- GlitchTip Worker: 512MB (increased from 256MB)
- Redis: 256MB

Total memory usage: ~2GB (within target)

### Environment Variables
Created secure, URL-safe passwords for all services.

## Setup Instructions

### For Umami (Working)
1. Access http://localhost:3001
2. Login with admin/umami
3. Change password immediately
4. Add website configuration
5. Copy website ID to Next.js .env.local

### For GlitchTip (Pending Fix)
Once connection issues are resolved:
1. Access http://localhost:3002
2. Create admin account
3. Set up organization and project
4. Get DSN for Next.js integration

## Local Domain Setup (Optional)

To use friendly local domains, add to `/etc/hosts`:
```bash
sudo nano /etc/hosts
# Add these lines:
127.0.0.1 analytics.local
127.0.0.1 errors.local
```

Then access services at:
- http://analytics.local:3001 (Umami)
- http://errors.local:3002 (GlitchTip)

## Next Steps

### Immediate Actions
1. Configure Umami with website details
2. Test Umami tracking in Next.js application
3. Debug GlitchTip connection issues

### Future Improvements
1. Consider alternative error tracking if GlitchTip issues persist:
   - Try different GlitchTip image version
   - Consider Sentry self-hosted
   - Use cloud error tracking temporarily

2. Add health check endpoints for monitoring

3. Implement automated backups

4. Prepare for production deployment (0.10.0)

## Useful Commands

```bash
# Check all services
make status

# View logs
make logs

# Restart problematic service
docker-compose restart glitchtip-web

# Check memory usage
docker stats

# Backup databases
make backup

# Complete reset
make clean && make setup && make up
```

## Resources

- Umami Documentation: https://umami.is/docs
- GlitchTip Documentation: https://glitchtip.com/documentation
- Docker Compose Reference: https://docs.docker.com/compose/

## Conclusion

The core analytics infrastructure is operational with Umami ready for use. GlitchTip requires additional debugging but doesn't block progress on analytics integration. The implementation provides a solid foundation for privacy-focused analytics and can be enhanced incrementally.