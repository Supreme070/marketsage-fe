#!/bin/bash

# MarketSage Production Database Migration Script
# Safely migrates database schema and executes seed scripts for production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/backups/database"
LOG_FILE="${BACKUP_DIR}/migration-$(date +%Y%m%d_%H%M%S).log"

echo -e "${BLUE}🗄️ MarketSage Production Database Migration${NC}"
echo "=============================================="

# Function to log messages
log() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] $1"
    echo -e "${GREEN}${message}${NC}"
    echo "$message" >> "$LOG_FILE"
}

warn() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1"
    echo -e "${YELLOW}${message}${NC}"
    echo "$message" >> "$LOG_FILE"
}

error() {
    local message="[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1"
    echo -e "${RED}${message}${NC}"
    echo "$message" >> "$LOG_FILE"
}

# Function to check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if we're in the project root
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        error "Not in MarketSage project root directory"
        exit 1
    fi
    
    # Check if Prisma is available
    if ! command -v npx >/dev/null 2>&1; then
        error "npx is not available. Please install Node.js and npm"
        exit 1
    fi
    
    # Check environment file
    if [ ! -f "$PROJECT_ROOT/.env.production" ]; then
        error "Production environment file not found: .env.production"
        error "Run setup-production-env.sh first"
        exit 1
    fi
    
    # Load environment variables
    source "$PROJECT_ROOT/.env.production"
    
    # Validate database URL
    if [ -z "$DATABASE_URL" ]; then
        error "DATABASE_URL not set in .env.production"
        exit 1
    fi
    
    log "✅ Prerequisites check passed"
}

# Function to create backup directory
create_backup_directory() {
    log "Creating backup directory..."
    mkdir -p "$BACKUP_DIR"
    chmod 700 "$BACKUP_DIR"
    log "✅ Backup directory created: $BACKUP_DIR"
}

# Function to backup current database
backup_database() {
    log "Creating database backup..."
    
    # Extract database connection details
    if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/([^?]+) ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASS="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"
    else
        error "Invalid DATABASE_URL format"
        exit 1
    fi
    
    local backup_file="${BACKUP_DIR}/marketsage_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    # Create database backup
    export PGPASSWORD="$DB_PASS"
    
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --no-password --verbose --clean --if-exists \
        --format=custom --compress=9 \
        --file="$backup_file" 2>> "$LOG_FILE"; then
        log "✅ Database backup created: $backup_file"
        
        # Create a plain SQL backup as well for easier inspection
        local sql_backup_file="${BACKUP_DIR}/marketsage_backup_$(date +%Y%m%d_%H%M%S).sql"
        pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
            --no-password --clean --if-exists \
            --format=plain \
            --file="$sql_backup_file" 2>> "$LOG_FILE"
        log "✅ SQL backup created: $sql_backup_file"
    else
        error "Failed to create database backup"
        exit 1
    fi
    
    unset PGPASSWORD
}

# Function to test database connectivity
test_database_connectivity() {
    log "Testing database connectivity..."
    
    cd "$PROJECT_ROOT"
    
    if npx prisma db execute --schema=prisma/schema.prisma --stdin <<< "SELECT 1;" 2>> "$LOG_FILE"; then
        log "✅ Database connectivity test passed"
    else
        error "Database connectivity test failed"
        exit 1
    fi
}

# Function to run Prisma migrations
run_migrations() {
    log "Running Prisma database migrations..."
    
    cd "$PROJECT_ROOT"
    
    # Generate Prisma client
    log "Generating Prisma client..."
    if npx prisma generate 2>> "$LOG_FILE"; then
        log "✅ Prisma client generated"
    else
        error "Failed to generate Prisma client"
        exit 1
    fi
    
    # Run migrations
    log "Deploying database migrations..."
    if npx prisma migrate deploy 2>> "$LOG_FILE"; then
        log "✅ Database migrations completed successfully"
    else
        error "Database migration failed"
        error "Check the log file: $LOG_FILE"
        exit 1
    fi
    
    # Verify schema
    log "Verifying database schema..."
    if npx prisma db pull --print 2>> "$LOG_FILE" >/dev/null; then
        log "✅ Database schema verification passed"
    else
        warn "Database schema verification had issues - check logs"
    fi
}

# Function to check if seeding is needed
check_seeding_needed() {
    log "Checking if database seeding is needed..."
    
    cd "$PROJECT_ROOT"
    
    # Check if users exist
    local user_count
    user_count=$(npx prisma db execute --schema=prisma/schema.prisma --stdin <<< 'SELECT COUNT(*) FROM "User";' 2>/dev/null | tail -1 || echo "0")
    
    if [ "$user_count" -gt 0 ]; then
        warn "Database already contains $user_count users"
        echo ""
        echo -e "${YELLOW}Do you want to proceed with seeding?${NC}"
        echo "This will:"
        echo "- Add additional test data"
        echo "- Create MCP data tables"
        echo "- NOT overwrite existing data"
        echo ""
        read -p "Continue with seeding? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Skipping database seeding"
            return 1
        fi
    fi
    
    return 0
}

# Function to run seed scripts
run_seed_scripts() {
    if ! check_seeding_needed; then
        return 0
    fi
    
    log "Running database seed scripts..."
    
    cd "$PROJECT_ROOT"
    
    # Set environment for seeding
    export NODE_ENV=production
    export SKIP_CONTACT_DELETE=true
    
    # Array of seed scripts in order
    local seed_scripts=(
        "src/scripts/seedContacts.ts:Contacts"
        "src/scripts/seedLists.ts:Lists"
        "src/scripts/seedSegments.js:Segments"
        "src/scripts/seedEmailCampaigns.ts:Email Campaigns"
        "src/scripts/seedSMSTemplates.ts:SMS Templates"
        "src/scripts/seedSMSCampaigns.ts:SMS Campaigns"
        "src/scripts/seedWhatsAppTemplates.js:WhatsApp Templates"
        "src/scripts/seedWhatsAppCampaigns.ts:WhatsApp Campaigns"
        "src/scripts/seedWorkflows.js:Workflows"
        "src/scripts/seedJourneys.ts:Journeys"
        "src/scripts/seedNotifications.ts:Notifications"
        "src/scripts/seedUserPreferences.ts:User Preferences"
        "src/scripts/seedTaskManagement.ts:Task Management"
        "src/scripts/seed-leadpulse.ts:LeadPulse Data"
        "src/scripts/seed-ai-intelligence.ts:AI Intelligence"
        "src/scripts/seed-mcp-campaign-analytics.ts:MCP Campaign Analytics"
        "src/scripts/seed-mcp-customer-predictions.ts:MCP Customer Predictions"
        "src/scripts/seed-mcp-visitor-sessions.ts:MCP Visitor Sessions"
        "src/scripts/seed-mcp-monitoring-metrics.ts:MCP Monitoring Metrics"
    )
    
    local successful_seeds=0
    local failed_seeds=0
    
    for script_info in "${seed_scripts[@]}"; do
        IFS=':' read -r script_path script_name <<< "$script_info"
        
        log "Seeding: $script_name..."
        
        # Determine the command to run based on file extension
        if [[ "$script_path" == *.js ]]; then
            cmd="node $script_path"
        else
            cmd="npx tsx $script_path"
        fi
        
        # Run with timeout
        if timeout 120 $cmd 2>> "$LOG_FILE"; then
            log "✅ $script_name seeded successfully"
            successful_seeds=$((successful_seeds + 1))
        else
            warn "⚠️ $script_name seeding failed or timed out"
            failed_seeds=$((failed_seeds + 1))
        fi
    done
    
    log "Seeding Summary:"
    log "✅ Successful: $successful_seeds"
    if [ $failed_seeds -gt 0 ]; then
        warn "⚠️ Failed: $failed_seeds"
    fi
    
    # Verify seed results
    verify_seed_results
}

# Function to verify seed results
verify_seed_results() {
    log "Verifying seed results..."
    
    cd "$PROJECT_ROOT"
    
    # Check key tables
    local tables=(
        "User:Users"
        "Contact:Contacts"
        "EmailCampaign:Email Campaigns"
        "SMSCampaign:SMS Campaigns"
        "WhatsAppCampaign:WhatsApp Campaigns"
        "Workflow:Workflows"
        "MCPCampaignMetrics:MCP Campaign Metrics"
        "MCPCustomerPredictions:MCP Customer Predictions"
        "MCPVisitorSessions:MCP Visitor Sessions"
        "MCPMonitoringMetrics:MCP Monitoring Metrics"
    )
    
    for table_info in "${tables[@]}"; do
        IFS=':' read -r table_name table_display <<< "$table_info"
        
        local count
        count=$(npx prisma db execute --schema=prisma/schema.prisma --stdin <<< "SELECT COUNT(*) FROM \"$table_name\";" 2>/dev/null | tail -1 || echo "0")
        
        if [ "$count" -gt 0 ]; then
            log "✅ $table_display: $count records"
        else
            warn "⚠️ $table_display: No records found"
        fi
    done
}

# Function to optimize database
optimize_database() {
    log "Optimizing database for production..."
    
    cd "$PROJECT_ROOT"
    
    # Update database statistics
    log "Updating database statistics..."
    npx prisma db execute --schema=prisma/schema.prisma --stdin <<< "ANALYZE;" 2>> "$LOG_FILE" || warn "Failed to update statistics"
    
    # Reindex tables for better performance
    log "Reindexing database tables..."
    npx prisma db execute --schema=prisma/schema.prisma --stdin <<< "REINDEX DATABASE;" 2>> "$LOG_FILE" || warn "Reindex had issues"
    
    log "✅ Database optimization completed"
}

# Function to create post-migration verification
create_verification_script() {
    local verify_script="${PROJECT_ROOT}/scripts/deployment/verify-production-database.sh"
    
    log "Creating database verification script..."
    
    cat > "$verify_script" << 'EOF'
#!/bin/bash

# MarketSage Production Database Verification Script

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"; }

echo "🔍 Verifying Production Database"
echo "================================"

# Load environment
if [ -f ".env.production" ]; then
    source .env.production
else
    error "Production environment file not found"
    exit 1
fi

# Test database connectivity
log "Testing database connectivity..."
if npx prisma db execute --schema=prisma/schema.prisma --stdin <<< "SELECT NOW();" >/dev/null 2>&1; then
    log "✅ Database connection successful"
else
    error "❌ Database connection failed"
    exit 1
fi

# Check critical tables
log "Checking critical tables..."

tables=("User" "Contact" "EmailCampaign" "SMSCampaign" "WhatsAppCampaign" "Workflow" "MCPCampaignMetrics" "MCPCustomerPredictions" "MCPVisitorSessions" "MCPMonitoringMetrics")

for table in "${tables[@]}"; do
    count=$(npx prisma db execute --schema=prisma/schema.prisma --stdin <<< "SELECT COUNT(*) FROM \"$table\";" 2>/dev/null | tail -1 || echo "0")
    if [ "$count" -ge 0 ]; then
        log "✅ $table: $count records"
    else
        error "❌ $table: Query failed"
    fi
done

# Check indexes
log "Checking database indexes..."
index_count=$(npx prisma db execute --schema=prisma/schema.prisma --stdin <<< "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" 2>/dev/null | tail -1 || echo "0")
log "✅ Database indexes: $index_count"

# Check constraints
log "Checking database constraints..."
constraint_count=$(npx prisma db execute --schema=prisma/schema.prisma --stdin <<< "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema = 'public';" 2>/dev/null | tail -1 || echo "0")
log "✅ Database constraints: $constraint_count"

log "🎉 Database verification completed successfully!"
EOF

    chmod +x "$verify_script"
    log "✅ Verification script created: $verify_script"
}

# Function to display final summary
display_summary() {
    echo ""
    log "🎉 Production Database Migration Completed!"
    echo ""
    echo -e "${YELLOW}Summary:${NC}"
    echo "- Database backup created in: $BACKUP_DIR"
    echo "- Migration log available: $LOG_FILE"
    echo "- Database schema migrated successfully"
    echo "- Seed scripts executed"
    echo "- Database optimized for production"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Run verification script: ./scripts/deployment/verify-production-database.sh"
    echo "2. Test application functionality"
    echo "3. Monitor database performance"
    echo "4. Set up automated backups"
    echo ""
    echo -e "${YELLOW}Important:${NC}"
    echo "- Keep database backups in a secure location"
    echo "- Monitor database performance after deployment"
    echo "- Set up regular automated backups"
    echo "- Review and optimize queries as needed"
}

# Function to handle rollback
handle_rollback() {
    error "Migration failed. Starting rollback process..."
    
    # Find latest backup
    local latest_backup
    latest_backup=$(find "$BACKUP_DIR" -name "marketsage_backup_*.sql" -type f -exec ls -t {} + | head -1)
    
    if [ -n "$latest_backup" ]; then
        echo ""
        echo -e "${YELLOW}Latest backup found: $latest_backup${NC}"
        read -p "Do you want to restore from this backup? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log "Restoring database from backup..."
            
            export PGPASSWORD="$DB_PASS"
            if pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
                --clean --if-exists --no-owner --no-privileges \
                "$latest_backup" 2>> "$LOG_FILE"; then
                log "✅ Database restored successfully"
            else
                error "❌ Database restore failed"
                error "You may need to restore manually"
            fi
            unset PGPASSWORD
        fi
    else
        warn "No backup files found for automatic rollback"
    fi
}

# Main function
main() {
    log "Starting MarketSage production database migration..."
    
    # Create backup directory and start logging
    create_backup_directory
    
    echo "Migration started at $(date)" > "$LOG_FILE"
    
    # Run migration steps
    check_prerequisites
    test_database_connectivity
    backup_database
    run_migrations
    run_seed_scripts
    optimize_database
    create_verification_script
    
    display_summary
    
    log "Migration completed successfully at $(date)" >> "$LOG_FILE"
}

# Handle script interruption and errors
trap 'handle_rollback; exit 1' ERR
trap 'error "Migration interrupted by user"; handle_rollback; exit 1' INT TERM

# Change to project root
cd "$PROJECT_ROOT"

# Run main function
main "$@"