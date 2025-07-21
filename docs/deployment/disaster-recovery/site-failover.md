# Site Failover Procedures for ChaseWhiteRabbit

## Overview
Site failover procedures ensure business continuity by switching traffic from a failed primary site to a secondary site with minimal service interruption.

## Infrastructure Setup

### Primary Site
- **Location**: NYC1 (DigitalOcean)
- **Services**: Main application, database, monitoring
- **Domains**: chasewhiterabbit.sxc.codes, api.chasewhiterabbit.sxc.codes

### Secondary Site
- **Location**: SFO3 (DigitalOcean)
- **Services**: Standby application, database replica, monitoring
- **Domains**: Same as primary (DNS switch)

## Failover Triggers

### Automatic Failover Conditions
- Primary site downtime > 5 minutes
- Database connectivity loss for > 3 minutes
- Health check failures on all primary site endpoints

### Manual Failover Conditions
- Planned maintenance windows
- Regional outages affecting primary site
- Security incidents requiring immediate traffic diversion

## Failover Process

### Phase 1: Detection and Alert (0-2 minutes)
1. Monitoring systems detect failure
2. Alerts sent to incident response team
3. Automated health checks confirm outage
4. Incident commander designated

### Phase 2: Decision and Preparation (2-5 minutes)
1. Assess primary site recovery time
2. Verify secondary site readiness
3. Check database synchronization status
4. Prepare DNS changes

### Phase 3: Execution (5-10 minutes)
1. **DNS Failover**:
   ```bash
   # Update DNS records to point to secondary site
   curl -X PUT "https://api.digitalocean.com/v2/domains/sxc.codes/records/chasewhiterabbit" \
     -H "Authorization: Bearer $DO_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"data": "secondary-site-ip", "ttl": 300}'
   ```

2. **Application Activation**:
   ```bash
   # Scale up secondary site deployment
   kubectl scale deployment/chasewhiterabbit -n chasewhiterabbit --replicas=3 --context=secondary
   
   # Verify pods are running
   kubectl get pods -n chasewhiterabbit --context=secondary
   ```

3. **Database Promotion**:
   ```bash
   # Promote replica to primary
   pg_promote -D /var/lib/postgresql/data
   
   # Update application config
   kubectl patch configmap chasewhiterabbit-config -n chasewhiterabbit \
     -p '{"data":{"database.host":"secondary-db.sxc.codes"}}'
   ```

### Phase 4: Verification (10-15 minutes)
1. Test all critical application functions
2. Verify data consistency
3. Monitor error rates and performance
4. Update status page
5. Notify stakeholders

## Post-Failover Actions

### Immediate (0-30 minutes)
- [ ] Confirm all services are operational
- [ ] Monitor application metrics and logs
- [ ] Update incident tracking system
- [ ] Communicate status to users and stakeholders

### Short-term (30 minutes - 4 hours)
- [ ] Investigate primary site failure root cause
- [ ] Plan primary site recovery
- [ ] Review and optimize secondary site performance
- [ ] Update monitoring thresholds if needed

### Long-term (4+ hours)
- [ ] Restore primary site when possible
- [ ] Plan failback procedure
- [ ] Conduct post-incident review
- [ ] Update runbooks based on lessons learned

## Failback Procedures

### Prerequisites
- Primary site fully restored and tested
- Database synchronization verified
- All team members available

### Process
1. **Data Synchronization**:
   ```bash
   # Sync data from secondary back to primary
   pg_basebackup -h secondary-db.sxc.codes -D /var/lib/postgresql/data -P -v
   ```

2. **Application Deployment**:
   ```bash
   # Scale up primary site
   kubectl scale deployment/chasewhiterabbit -n chasewhiterabbit --replicas=3 --context=primary
   ```

3. **DNS Restoration**:
   ```bash
   # Point DNS back to primary site
   curl -X PUT "https://api.digitalocean.com/v2/domains/sxc.codes/records/chasewhiterabbit" \
     -H "Authorization: Bearer $DO_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"data": "primary-site-ip", "ttl": 300}'
   ```

4. **Scale Down Secondary**:
   ```bash
   # Scale down secondary site to standby
   kubectl scale deployment/chasewhiterabbit -n chasewhiterabbit --replicas=1 --context=secondary
   ```

## Communication Plan

### Stakeholders
- Development team: Slack #incidents
- Management: Email alerts
- Customers: Status page updates
- External partners: API status notifications

### Message Templates

#### Failover Initiated
```
INCIDENT: ChaseWhiteRabbit Failover Initiated
Time: {{timestamp}}
Reason: {{failure_reason}}
Expected Resolution: {{eta}}
Status Page: https://status.chasewhiterabbit.sxc.codes
```

#### Failover Complete
```
UPDATE: ChaseWhiteRabbit Failover Complete
Services restored on secondary site
Current Status: Operational
Next Update: {{next_update_time}}
```

## Testing and Validation

### Quarterly Failover Drills
- Schedule during low-traffic periods
- Test both automatic and manual triggers
- Validate all procedures and documentation
- Measure RTO/RPO against targets

### Key Metrics
- **RTO Target**: 15 minutes
- **RPO Target**: 5 minutes
- **DNS Propagation**: 5 minutes
- **Application Startup**: 3 minutes

## Emergency Contacts

### Primary On-Call
- **Tiation**: tiatheone@protonmail.com, +1-xxx-xxx-xxxx
- **Garrett**: garrett@sxc.codes, +1-xxx-xxx-xxxx

### Escalation
- **DigitalOcean Support**: Enterprise support ticket
- **DNS Provider**: Support hotline
- **Database Vendor**: Premium support

## Runbook Updates

This runbook should be reviewed and updated:
- After each incident
- Quarterly during DR testing
- When infrastructure changes occur
- When team members change

---

**Last Updated**: {{current_date}}
**Next Review**: {{next_review_date}}
**Version**: 1.0
