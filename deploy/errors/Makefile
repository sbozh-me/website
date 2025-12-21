.PHONY: help up down logs restart status setup clean backup restore ps health

# Default target - show help
help:
	@echo "GlitchTip Error Tracking Infrastructure Management"
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
	@echo "  make backup   - Backup database"
	@echo "  make restore  - Restore from backup"
	@echo ""
	@echo "Service-specific logs:"
	@echo "  make logs-web     - View GlitchTip web logs"
	@echo "  make logs-worker  - View GlitchTip worker logs"
	@echo "  make logs-db      - View PostgreSQL logs"
	@echo "  make logs-redis   - View Redis logs"

# Initial setup
setup:
	@echo "Setting up GlitchTip error tracking infrastructure..."
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "Created .env file from template"; \
		echo ""; \
		echo "Generating secure secrets..."; \
		echo "SECRET_KEY=$$(openssl rand -hex 32)" > .env.generated; \
		echo "POSTGRES_PASSWORD=$$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)" >> .env.generated; \
		echo ""; \
		echo "Generated secrets saved to .env.generated"; \
		echo ""; \
		echo "IMPORTANT: Update .env with the generated secrets from .env.generated"; \
		echo ""; \
	else \
		echo ".env already exists. Skipping setup."; \
	fi
	@echo "Setup complete! Next steps:"
	@echo "1. Edit .env with your configuration"
	@echo "2. Run 'make up' to start services"

# Start all services
up:
	@echo "Starting GlitchTip services..."
	docker-compose up -d
	@echo ""
	@echo "Services started!"
	@echo ""
	@echo "Access GlitchTip at: http://localhost:3002"
	@echo ""
	@echo "First time setup:"
	@echo "1. Create your admin account"
	@echo "2. Create an organization"
	@echo "3. Create a project"
	@echo "4. Copy the DSN to your app's .env.local"
	@echo ""
	@echo "Run 'make logs' to view service logs"

# Stop all services
down:
	@echo "Stopping GlitchTip services..."
	docker-compose down
	@echo "Services stopped"

# View logs for all services
logs:
	docker-compose logs -f

# View logs for specific services
logs-web:
	docker-compose logs -f web

logs-worker:
	docker-compose logs -f worker

logs-db:
	docker-compose logs -f glitchtip-db

logs-redis:
	docker-compose logs -f redis

# Restart all services
restart:
	@echo "Restarting GlitchTip services..."
	docker-compose restart
	@echo "Services restarted"

# Check service status
status:
	@echo "Service Status:"
	@echo ""
	@docker-compose ps
	@echo ""
	@echo "Health Checks:"
	@curl -s -o /dev/null -w "  GlitchTip Web: %{http_code}\n" http://localhost:3002/_health/ 2>/dev/null || echo "  GlitchTip Web: Not responding"

# List running containers
ps:
	docker-compose ps

# Clean everything (WARNING: removes all data)
clean:
	@echo "WARNING: This will delete all error tracking data!"
	@echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
	@sleep 5
	docker-compose down -v
	rm -f .env.generated
	@echo "Cleaned up services and volumes"

# Backup database
backup:
	@echo "Creating backup..."
	@mkdir -p backups
	@BACKUP_FILE="backups/glitchtip_$$(date +%Y%m%d_%H%M%S).sql" && \
	docker exec sbozh-glitchtip-db pg_dump -U glitchtip glitchtip > $$BACKUP_FILE && \
	echo "Backup created: $$BACKUP_FILE"

# Restore from backup
restore:
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "Usage: make restore BACKUP_FILE=backups/glitchtip_YYYYMMDD_HHMMSS.sql"; \
		exit 1; \
	fi
	@echo "Restoring from $(BACKUP_FILE)..."
	@docker exec -i sbozh-glitchtip-db psql -U glitchtip glitchtip < $(BACKUP_FILE)
	@echo "Restore complete"

# Quick health check
health:
	@echo "Checking service health..."
	@docker exec sbozh-glitchtip-db pg_isready -U glitchtip -d glitchtip > /dev/null 2>&1 && echo "PostgreSQL: Healthy" || echo "PostgreSQL: Unhealthy"
	@docker exec sbozh-glitchtip-redis redis-cli ping > /dev/null 2>&1 && echo "Redis: Healthy" || echo "Redis: Unhealthy"
	@curl -s http://localhost:3002/_health/ > /dev/null 2>&1 && echo "GlitchTip Web: Healthy" || echo "GlitchTip Web: Unhealthy"
	@docker ps --filter "name=sbozh-glitchtip-worker" --format "{{.Status}}" | grep -q "Up" && echo "GlitchTip Worker: Running" || echo "GlitchTip Worker: Not running"

# Development helpers
exec-db:
	docker exec -it sbozh-glitchtip-db psql -U glitchtip glitchtip

exec-redis:
	docker exec -it sbozh-glitchtip-redis redis-cli

# Update images
update:
	@echo "Pulling latest images..."
	docker-compose pull
	@echo "Images updated. Run 'make restart' to apply changes"

# View migration status
migrate-status:
	docker-compose run --rm migrate ./manage.py showmigrations

# Create superuser
createsuperuser:
	docker-compose exec web ./manage.py createsuperuser
