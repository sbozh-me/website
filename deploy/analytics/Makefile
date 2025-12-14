.PHONY: help up down logs restart status setup clean backup restore ps

# Default target - show help
help:
	@echo "Analytics Infrastructure Management"
	@echo ""
	@echo "Available commands:"
	@echo "  make setup    - Initial setup (copy .env, generate secrets)"
	@echo "  make up       - Start all services"
	@echo "  make down     - Stop all services"
	@echo "  make restart  - Restart all services"
	@echo "  make logs     - View logs (all services)"
	@echo "  make status   - Check service status"
	@echo "  make ps       - List running containers"
	@echo "  make clean    - Stop services and remove volumes (WARNING: deletes data)"
	@echo "  make backup   - Backup databases"
	@echo "  make restore  - Restore from backup"
	@echo ""
	@echo "Service-specific logs:"
	@echo "  make logs-umami     - View Umami logs"
	@echo "  make logs-glitchtip - View GlitchTip logs"
	@echo "  make logs-postgres  - View PostgreSQL logs"

# Initial setup
setup:
	@echo "Setting up analytics infrastructure..."
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✓ Created .env file from template"; \
		echo ""; \
		echo "Generating secure secrets..."; \
		echo "UMAMI_APP_SECRET=$$(openssl rand -hex 16)" >> .env.generated; \
		echo "GLITCHTIP_SECRET_KEY=$$(openssl rand -base64 38 | head -c 50)" >> .env.generated; \
		echo "POSTGRES_PASSWORD=$$(openssl rand -base64 24)" >> .env.generated; \
		echo ""; \
		echo "✓ Generated secrets saved to .env.generated"; \
		echo ""; \
		echo "⚠️  IMPORTANT: Update .env with the generated secrets from .env.generated"; \
		echo ""; \
	else \
		echo "⚠️  .env already exists. Skipping setup."; \
	fi
	@echo "Setup complete! Next steps:"
	@echo "1. Edit .env with your configuration"
	@echo "2. Run 'make up' to start services"

# Start all services
up:
	@echo "Starting analytics services..."
	docker-compose up -d
	@echo ""
	@echo "✓ Services started!"
	@echo ""
	@echo "Access points:"
	@echo "  Umami:     http://localhost:3001 (admin/umami)"
	@echo "  GlitchTip: http://localhost:3002"
	@echo ""
	@echo "Run 'make logs' to view service logs"

# Stop all services
down:
	@echo "Stopping analytics services..."
	docker-compose down
	@echo "✓ Services stopped"

# View logs for all services
logs:
	docker-compose logs -f

# View logs for specific services
logs-umami:
	docker-compose logs -f umami

logs-glitchtip:
	docker-compose logs -f glitchtip-web glitchtip-worker

logs-postgres:
	docker-compose logs -f postgres

logs-redis:
	docker-compose logs -f redis

# Restart all services
restart:
	@echo "Restarting analytics services..."
	docker-compose restart
	@echo "✓ Services restarted"

# Check service status
status:
	@echo "Service Status:"
	@echo ""
	@docker-compose ps
	@echo ""
	@echo "Health Checks:"
	@curl -s -o /dev/null -w "  Umami:     %{http_code}\n" http://localhost:3001 || echo "  Umami:     Not responding"
	@curl -s -o /dev/null -w "  GlitchTip: %{http_code}\n" http://localhost:3002 || echo "  GlitchTip: Not responding"

# List running containers
ps:
	docker-compose ps

# Clean everything (WARNING: removes all data)
clean:
	@echo "⚠️  WARNING: This will delete all analytics data!"
	@echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
	@sleep 5
	docker-compose down -v
	rm -f .env.generated
	@echo "✓ Cleaned up services and volumes"

# Backup databases
backup:
	@echo "Creating backup..."
	@mkdir -p backups
	@BACKUP_FILE="backups/analytics_$$(date +%Y%m%d_%H%M%S).sql" && \
	docker exec analytics-postgres pg_dumpall -U $$(grep POSTGRES_USER .env | cut -d= -f2) > $$BACKUP_FILE && \
	echo "✓ Backup created: $$BACKUP_FILE"

# Restore from backup
restore:
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "Usage: make restore BACKUP_FILE=backups/analytics_YYYYMMDD_HHMMSS.sql"; \
		exit 1; \
	fi
	@echo "Restoring from $(BACKUP_FILE)..."
	@docker exec -i analytics-postgres psql -U $$(grep POSTGRES_USER .env | cut -d= -f2) < $(BACKUP_FILE)
	@echo "✓ Restore complete"

# Quick health check
health:
	@echo "Checking service health..."
	@docker exec analytics-postgres pg_isready -U $$(grep POSTGRES_USER .env | cut -d= -f2) > /dev/null 2>&1 && echo "✓ PostgreSQL: Healthy" || echo "✗ PostgreSQL: Unhealthy"
	@docker exec analytics-redis redis-cli ping > /dev/null 2>&1 && echo "✓ Redis: Healthy" || echo "✗ Redis: Unhealthy"
	@curl -s http://localhost:3001 > /dev/null 2>&1 && echo "✓ Umami: Healthy" || echo "✗ Umami: Unhealthy"
	@curl -s http://localhost:3002 > /dev/null 2>&1 && echo "✓ GlitchTip: Healthy" || echo "✗ GlitchTip: Unhealthy"

# Development helpers
exec-postgres:
	docker exec -it analytics-postgres psql -U $$(grep POSTGRES_USER .env | cut -d= -f2)

exec-redis:
	docker exec -it analytics-redis redis-cli

# Update images
update:
	@echo "Pulling latest images..."
	docker-compose pull
	@echo "✓ Images updated. Run 'make restart' to apply changes"