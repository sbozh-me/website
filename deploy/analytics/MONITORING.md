# Analytics Monitoring Playbook

Operations runbook for monitoring and maintaining the analytics infrastructure.

## Table of Contents

- [Daily Operations](#daily-operations)
- [Health Checks](#health-checks)
- [Alert Thresholds](#alert-thresholds)
- [Common Issues](#common-issues)
- [Incident Response](#incident-response)
- [Performance Baselines](#performance-baselines)
- [Escalation Procedures](#escalation-procedures)

## Daily Operations

### Morning Check (5 minutes)

```bash
# 1. Check service status
docker-compose ps

# Expected: All services "healthy" or "running"

# 2. Check error logs
docker-compose logs --since="24h" | grep -i error | head -20

# 3. Check disk usage
df -h
docker system df

# 4. Quick health check
curl -s http://localhost:3001/api/heartbeat
curl -s http://localhost:3002/api/health/
```

### Weekly Review (15 minutes)

1. **Umami Dashboard Review**
   - Check weekly traffic trends
   - Review top pages
   - Look for anomalies in traffic patterns
   - Export key metrics for reporting

2. **GlitchTip Review**
   - Review new error types
   - Resolve fixed issues
   - Check error rate trends
   - Update alert rules if needed

3. **System Maintenance**
   ```bash
   # Prune old Docker resources
   docker system prune -f

   # Check backup integrity
   ls -la ~/backups/
   ```

### Monthly Tasks

1. Update Docker images
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

2. Review and rotate secrets
3. Test backup restoration
4. Review resource usage trends
5. Update documentation if needed

## Health Checks

### Service Endpoints

| Service | Health URL | Expected Response |
|---------|-----------|-------------------|
| Umami | `/api/heartbeat` | `200 OK` |
| GlitchTip | `/api/health/` | `200 OK` with JSON |
| PostgreSQL | TCP :5432 | Connection accepted |
| Redis | TCP :6379 | PONG response |

### Automated Health Check Script

Create `/home/deploy/scripts/health-check.sh`:

```bash
#!/bin/bash

HEALTHY=true
ALERTS=""

# Check Umami
if ! curl -sf http://localhost:3001/api/heartbeat > /dev/null; then
    HEALTHY=false
    ALERTS+="CRITICAL: Umami is down\n"
fi

# Check GlitchTip
if ! curl -sf http://localhost:3002/api/health/ > /dev/null; then
    HEALTHY=false
    ALERTS+="WARNING: GlitchTip is down\n"
fi

# Check PostgreSQL
if ! docker exec analytics-postgres pg_isready -U analytics_admin > /dev/null; then
    HEALTHY=false
    ALERTS+="CRITICAL: PostgreSQL is down\n"
fi

# Check Redis
if ! docker exec analytics-redis redis-cli ping > /dev/null; then
    HEALTHY=false
    ALERTS+="WARNING: Redis is down\n"
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    ALERTS+="WARNING: Disk usage at ${DISK_USAGE}%\n"
fi

# Check memory
MEM_USAGE=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')
if [ $MEM_USAGE -gt 90 ]; then
    ALERTS+="WARNING: Memory usage at ${MEM_USAGE}%\n"
fi

if [ "$HEALTHY" = false ] || [ -n "$ALERTS" ]; then
    echo -e "Health Check Results:\n$ALERTS"
    # Send alert (configure your notification method)
    # curl -X POST your-webhook-url -d "message=$ALERTS"
    exit 1
fi

echo "All services healthy"
exit 0
```

Schedule in crontab:
```bash
*/5 * * * * /home/deploy/scripts/health-check.sh >> /var/log/analytics-health.log 2>&1
```

## Alert Thresholds

### Critical (Immediate Action)

| Metric | Threshold | Action |
|--------|-----------|--------|
| Service down | Any | Restart service, investigate |
| Disk usage | > 95% | Clear space immediately |
| Database connections | > 90% of max | Investigate and scale |
| Error rate | > 10% increase | Investigate error source |

### Warning (Action within 4 hours)

| Metric | Threshold | Action |
|--------|-----------|--------|
| Disk usage | > 85% | Plan cleanup |
| Memory usage | > 90% | Investigate, consider scaling |
| CPU sustained | > 80% for 15min | Investigate workload |
| Response time | > 2s p95 | Performance investigation |

### Info (Monitor)

| Metric | Threshold | Action |
|--------|-----------|--------|
| Traffic spike | > 2x normal | Monitor for issues |
| New error types | Any | Review and triage |
| Slow queries | > 1s | Consider optimization |

## Common Issues

### Issue: Umami Not Recording Events

**Symptoms**: Dashboard shows no new data

**Diagnosis**:
```bash
# Check service is running
docker-compose ps umami

# Check logs
docker-compose logs --tail=50 umami

# Verify database connection
docker exec analytics-postgres psql -U analytics_admin -d umami_db -c "SELECT COUNT(*) FROM website_event"
```

**Resolution**:
1. Restart Umami: `docker-compose restart umami`
2. Clear browser cache and retry
3. Check CSP headers allow tracking script
4. Verify website ID is correct

### Issue: GlitchTip Not Receiving Errors

**Symptoms**: No new issues in dashboard

**Diagnosis**:
```bash
# Check services
docker-compose ps glitchtip-web glitchtip-worker

# Check worker logs (processes errors)
docker-compose logs --tail=50 glitchtip-worker

# Check Redis (message queue)
docker exec analytics-redis redis-cli info clients
```

**Resolution**:
1. Restart worker: `docker-compose restart glitchtip-worker`
2. Check DSN is correctly configured in app
3. Verify Redis is accepting connections
4. Check email configuration for alert delivery

### Issue: High Memory Usage

**Symptoms**: Services slow or crashing

**Diagnosis**:
```bash
# Check container memory
docker stats --no-stream

# Check overall system
free -h
```

**Resolution**:
1. Restart high-memory service
2. Adjust memory limits in docker-compose.yml
3. Check for memory leaks in application
4. Consider adding swap or upgrading server

### Issue: Database Connection Errors

**Symptoms**: "Connection refused" or timeout errors

**Diagnosis**:
```bash
# Check PostgreSQL status
docker-compose ps postgres
docker-compose logs --tail=20 postgres

# Check connections
docker exec analytics-postgres psql -U analytics_admin -c "SELECT count(*) FROM pg_stat_activity"
```

**Resolution**:
1. Restart PostgreSQL: `docker-compose restart postgres`
2. Check connection limits
3. Look for connection leaks
4. Review pg_hba.conf for access rules

### Issue: SSL Certificate Problems

**Symptoms**: Browser security warnings

**Diagnosis**:
```bash
# Check certificate
curl -vI https://analytics.yourdomain.com 2>&1 | grep -i certificate

# Check Traefik logs
docker-compose logs traefik | grep -i cert
```

**Resolution**:
1. Check DNS is pointing to correct server
2. Verify ports 80/443 are open
3. Check Let's Encrypt rate limits
4. Force certificate renewal

## Incident Response

### Severity Levels

| Level | Definition | Response Time |
|-------|------------|---------------|
| SEV1 | All analytics down | Immediate |
| SEV2 | One service down | 1 hour |
| SEV3 | Degraded performance | 4 hours |
| SEV4 | Minor issue | Next business day |

### SEV1 Runbook

1. **Acknowledge** (0-5 min)
   - Confirm incident
   - Notify stakeholders

2. **Assess** (5-15 min)
   ```bash
   docker-compose ps
   docker-compose logs --tail=100
   df -h && free -h
   ```

3. **Mitigate** (15-30 min)
   - Restart affected services
   - Scale if needed
   - Restore from backup if data corruption

4. **Communicate**
   - Update status page
   - Notify affected users

5. **Post-Incident**
   - Write incident report
   - Identify root cause
   - Implement preventive measures

## Performance Baselines

### Expected Response Times

| Operation | Target | Max Acceptable |
|-----------|--------|----------------|
| Umami script load | < 50ms | 200ms |
| Event tracking | < 100ms | 500ms |
| Dashboard load | < 1s | 3s |
| GlitchTip error capture | < 200ms | 1s |

### Resource Usage Baselines

| Service | CPU (idle) | Memory | Disk (monthly growth) |
|---------|------------|--------|----------------------|
| PostgreSQL | < 5% | 256-512MB | ~100MB |
| Umami | < 5% | 128-256MB | ~50MB |
| GlitchTip | < 5% | 256-512MB | ~200MB |
| Redis | < 1% | 64-128MB | < 10MB |

## Escalation Procedures

### Level 1: Self-Service

- Restart services
- Clear caches
- Check documentation

### Level 2: Development Team

Escalate when:
- Issue persists after Level 1
- Data integrity concerns
- Security incidents

Contact: Development team Slack channel

### Level 3: Infrastructure

Escalate when:
- Server-level issues
- Network problems
- Need infrastructure changes

Contact: DevOps/Infrastructure team

## Log Locations

| Service | Log Command |
|---------|-------------|
| All services | `docker-compose logs -f` |
| Umami | `docker-compose logs -f umami` |
| GlitchTip | `docker-compose logs -f glitchtip-web glitchtip-worker` |
| PostgreSQL | `docker-compose logs -f postgres` |
| System | `/var/log/syslog` |
| Health checks | `/var/log/analytics-health.log` |

## Useful Commands Reference

```bash
# Service management
docker-compose ps                    # Check status
docker-compose restart SERVICE       # Restart service
docker-compose logs -f SERVICE       # Follow logs
docker-compose exec SERVICE sh       # Shell into container

# Database
docker exec -it analytics-postgres psql -U analytics_admin  # PostgreSQL shell
docker exec analytics-redis redis-cli                       # Redis CLI

# System
docker stats --no-stream             # Container resources
df -h                                # Disk space
free -h                              # Memory
htop                                 # Process monitor

# Cleanup
docker system prune -f               # Remove unused resources
docker volume prune -f               # Remove unused volumes
```
