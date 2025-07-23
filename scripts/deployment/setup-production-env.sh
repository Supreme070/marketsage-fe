#!/bin/bash

# MarketSage Production Environment Setup Script
# This script helps configure production environment variables securely

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
ENV_FILE="${PROJECT_ROOT}/.env.production"
EXAMPLE_ENV_FILE="${PROJECT_ROOT}/.env.production.example"
BACKUP_DIR="${PROJECT_ROOT}/backups/env"

echo -e "${BLUE}🚀 MarketSage Production Environment Setup${NC}"
echo "=============================================="

# Function to log messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Function to generate secure random strings
generate_secret() {
    local length=${1:-64}
    openssl rand -base64 $((length * 3 / 4)) | tr -d "=+/" | cut -c1-${length}
}

# Function to generate encryption key
generate_encryption_key() {
    openssl rand -hex 16  # 32 characters for AES-256
}

# Function to validate required tools
validate_tools() {
    log "Checking required tools..."
    
    local tools=("openssl" "curl" "grep" "sed" "awk")
    local missing_tools=()
    
    for tool in "${tools[@]}"; do
        if ! command -v $tool >/dev/null 2>&1; then
            missing_tools+=($tool)
        fi
    done
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        error "Missing required tools: ${missing_tools[*]}"
        error "Please install missing tools and run again"
        exit 1
    fi
    
    log "✅ All required tools are available"
}

# Function to backup existing environment file
backup_existing_env() {
    if [ -f "$ENV_FILE" ]; then
        log "Backing up existing .env.production file..."
        
        # Create backup directory
        mkdir -p "$BACKUP_DIR"
        
        # Create backup with timestamp
        local backup_file="${BACKUP_DIR}/.env.production.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$ENV_FILE" "$backup_file"
        
        log "✅ Backup created: $backup_file"
    fi
}

# Function to create production environment file
create_production_env() {
    log "Creating production environment file..."
    
    if [ ! -f "$EXAMPLE_ENV_FILE" ]; then
        error "Example environment file not found: $EXAMPLE_ENV_FILE"
        exit 1
    fi
    
    # Copy example file to production
    cp "$EXAMPLE_ENV_FILE" "$ENV_FILE"
    
    log "✅ Base environment file created"
}

# Function to generate secrets and update environment file
generate_and_update_secrets() {
    log "Generating secure secrets..."
    
    # Generate secrets
    local nextauth_secret=$(generate_secret 64)
    local jwt_secret=$(generate_secret 64)
    local session_secret=$(generate_secret 64)
    local mcp_jwt_secret=$(generate_secret 64)
    local master_encryption_key=$(generate_encryption_key)
    local field_encryption_key=$(generate_encryption_key)
    local mcp_api_key=$(generate_secret 32)
    local webhook_verify_token=$(generate_secret 32)
    local webhook_secret=$(generate_secret 32)
    
    log "Updating secrets in environment file..."
    
    # Update secrets in file
    sed -i.bak \
        -e "s/GENERATE_STRONG_64_CHAR_SECRET_FOR_NEXTAUTH_IN_PRODUCTION/${nextauth_secret}/g" \
        -e "s/GENERATE_STRONG_64_CHAR_JWT_SECRET_FOR_PRODUCTION_USE/${jwt_secret}/g" \
        -e "s/GENERATE_STRONG_64_CHAR_SESSION_SECRET_FOR_PRODUCTION/${session_secret}/g" \
        -e "s/GENERATE_STRONG_64_CHAR_MCP_JWT_SECRET/${mcp_jwt_secret}/g" \
        -e "s/32_CHAR_ENCRYPTION_KEY_FOR_PROD/${master_encryption_key}/g" \
        -e "s/32_CHAR_FIELD_ENCRYPTION_KEY/${field_encryption_key}/g" \
        -e "s/GENERATE_STRONG_API_KEY_FOR_MCP_ACCESS/${mcp_api_key}/g" \
        -e "s/YOUR_WEBHOOK_VERIFY_TOKEN/${webhook_verify_token}/g" \
        -e "s/YOUR_PAYSTACK_WEBHOOK_SECRET/${webhook_secret}/g" \
        "$ENV_FILE"
    
    # Remove backup file created by sed
    rm "${ENV_FILE}.bak" 2>/dev/null || true
    
    log "✅ Secrets generated and updated"
}

# Function to prompt for user configuration
prompt_for_configuration() {
    log "Prompting for production configuration..."
    
    echo ""
    echo -e "${YELLOW}Please provide the following production configuration:${NC}"
    echo ""
    
    # Domain configuration
    read -p "Enter your production domain (e.g., marketsage.africa): " domain
    if [ -n "$domain" ]; then
        sed -i.bak "s/your-domain\.com/${domain}/g" "$ENV_FILE"
        rm "${ENV_FILE}.bak" 2>/dev/null || true
        log "✅ Domain updated to: $domain"
    fi
    
    # Database configuration
    read -p "Enter your production database URL (press Enter to skip): " database_url
    if [ -n "$database_url" ]; then
        # Escape special characters for sed
        database_url_escaped=$(echo "$database_url" | sed 's/[[\.*^$()+?{|]/\\&/g')
        sed -i.bak "s|postgresql://marketsage_prod:STRONG_DATABASE_PASSWORD@your-db-host:5432/marketsage_prod.*|${database_url_escaped}|g" "$ENV_FILE"
        rm "${ENV_FILE}.bak" 2>/dev/null || true
        log "✅ Database URL updated"
    fi
    
    # Redis configuration
    read -p "Enter your production Redis URL (press Enter to skip): " redis_url
    if [ -n "$redis_url" ]; then
        redis_url_escaped=$(echo "$redis_url" | sed 's/[[\.*^$()+?{|]/\\&/g')
        sed -i.bak "s|redis://username:password@your-redis-host:6379|${redis_url_escaped}|g" "$ENV_FILE"
        rm "${ENV_FILE}.bak" 2>/dev/null || true
        log "✅ Redis URL updated"
    fi
    
    # OpenAI API Key
    read -p "Enter your OpenAI API Key (press Enter to skip): " openai_key
    if [ -n "$openai_key" ]; then
        sed -i.bak "s/YOUR_PRODUCTION_OPENAI_API_KEY/${openai_key}/g" "$ENV_FILE"
        rm "${ENV_FILE}.bak" 2>/dev/null || true
        log "✅ OpenAI API Key updated"
    fi
    
    # Email configuration
    read -p "Enter your production email address (e.g., noreply@marketsage.africa): " email_from
    if [ -n "$email_from" ]; then
        sed -i.bak "s/noreply@marketsage\.africa/${email_from}/g" "$ENV_FILE"
        rm "${ENV_FILE}.bak" 2>/dev/null || true
        log "✅ Email configuration updated"
    fi
    
    read -p "Enter your email SMTP password (press Enter to skip): " smtp_pass
    if [ -n "$smtp_pass" ]; then
        sed -i.bak "s/YOUR_ZOHO_APP_PASSWORD/${smtp_pass}/g" "$ENV_FILE"
        rm "${ENV_FILE}.bak" 2>/dev/null || true
        log "✅ SMTP password updated"
    fi
    
    # Payment configuration
    read -p "Enter your Paystack Live Secret Key (press Enter to skip): " paystack_secret
    if [ -n "$paystack_secret" ]; then
        sed -i.bak "s/sk_live_YOUR_PAYSTACK_LIVE_SECRET_KEY/${paystack_secret}/g" "$ENV_FILE"
        rm "${ENV_FILE}.bak" 2>/dev/null || true
        log "✅ Paystack Secret Key updated"
    fi
    
    read -p "Enter your Paystack Live Public Key (press Enter to skip): " paystack_public
    if [ -n "$paystack_public" ]; then
        sed -i.bak "s/pk_live_YOUR_PAYSTACK_LIVE_PUBLIC_KEY/${paystack_public}/g" "$ENV_FILE"
        rm "${ENV_FILE}.bak" 2>/dev/null || true
        log "✅ Paystack Public Key updated"
    fi
    
    echo ""
    log "✅ Configuration prompts completed"
}

# Function to validate environment file
validate_environment_file() {
    log "Validating production environment file..."
    
    local errors=0
    
    # Check for placeholder values
    local placeholders=(
        "YOUR_PRODUCTION_"
        "GENERATE_STRONG_"
        "your-domain\.com"
        "YOUR_PAYSTACK_"
        "YOUR_TWILIO_"
        "YOUR_AFRICASTALKING_"
        "YOUR_WHATSAPP_"
    )
    
    for placeholder in "${placeholders[@]}"; do
        if grep -q "$placeholder" "$ENV_FILE"; then
            warn "Found placeholder value: $placeholder"
            errors=$((errors + 1))
        fi
    done
    
    # Check for required variables
    local required_vars=(
        "DATABASE_URL"
        "NEXTAUTH_SECRET"
        "JWT_SECRET"
        "MCP_ENABLED"
        "REDIS_URL"
    )
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" "$ENV_FILE"; then
            error "Missing required variable: $var"
            errors=$((errors + 1))
        fi
    done
    
    if [ $errors -eq 0 ]; then
        log "✅ Environment file validation passed"
    else
        warn "⚠️ Environment file has $errors validation issues"
        warn "Please review and update the configuration manually"
    fi
}

# Function to set secure file permissions
set_secure_permissions() {
    log "Setting secure file permissions..."
    
    # Set restrictive permissions on environment file
    chmod 600 "$ENV_FILE"
    
    # Ensure backup directory has correct permissions
    if [ -d "$BACKUP_DIR" ]; then
        chmod 700 "$BACKUP_DIR"
        chmod 600 "$BACKUP_DIR"/* 2>/dev/null || true
    fi
    
    log "✅ Secure permissions set"
}

# Function to generate deployment checklist
generate_checklist() {
    local checklist_file="${PROJECT_ROOT}/docs/deployment/PRODUCTION_CHECKLIST.md"
    
    log "Generating production deployment checklist..."
    
    mkdir -p "$(dirname "$checklist_file")"
    
    cat > "$checklist_file" << 'EOF'
# MarketSage Production Deployment Checklist

## Pre-Deployment Checklist

### Environment Configuration
- [ ] Production environment variables configured in `.env.production`
- [ ] All placeholder values replaced with actual production values
- [ ] Database URL configured with production database
- [ ] Redis URL configured with production Redis instance
- [ ] All secrets generated and properly set
- [ ] SSL certificates configured
- [ ] Domain DNS properly configured

### Security
- [ ] Strong passwords and secrets generated
- [ ] HTTPS enabled and enforced
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Environment file permissions set to 600
- [ ] No sensitive data in version control

### MCP Configuration
- [ ] MCP servers enabled in production
- [ ] MCP authentication configured
- [ ] MCP rate limiting configured
- [ ] MCP audit logging enabled
- [ ] MCP health checks configured

### External Services
- [ ] Email service (Zoho) configured and tested
- [ ] SMS providers (Africa's Talking, Termii) configured
- [ ] WhatsApp Business API configured
- [ ] Payment gateway (Paystack) configured
- [ ] OpenAI API configured
- [ ] Monitoring services configured

### Database & Storage
- [ ] Production database created and accessible
- [ ] Database migrations run
- [ ] Database seeds executed (if needed)
- [ ] Database backups configured
- [ ] Redis/Valkey configured and accessible
- [ ] File storage configured (if applicable)

### Monitoring & Logging
- [ ] Application logging configured
- [ ] Error tracking configured
- [ ] Performance monitoring configured
- [ ] Health checks configured
- [ ] Alerting configured
- [ ] Backup monitoring configured

## Deployment Steps

### 1. Pre-deployment
- [ ] Run tests in staging environment
- [ ] Verify all dependencies are available
- [ ] Check system requirements
- [ ] Prepare rollback plan

### 2. Deployment
- [ ] Deploy application code
- [ ] Run database migrations
- [ ] Update environment variables
- [ ] Start application services
- [ ] Verify health checks pass

### 3. Post-deployment
- [ ] Run smoke tests
- [ ] Verify all features working
- [ ] Check logs for errors
- [ ] Monitor performance metrics
- [ ] Test all integrations

### 4. Go-live
- [ ] Update DNS if needed
- [ ] Enable monitoring alerts
- [ ] Notify stakeholders
- [ ] Monitor for 24 hours
- [ ] Document any issues

## Production Verification

### Application Health
- [ ] Health check endpoint responds (200 OK)
- [ ] Database connectivity verified
- [ ] Redis connectivity verified
- [ ] All MCP servers healthy
- [ ] Authentication working
- [ ] Core features functional

### External Integrations
- [ ] Email sending working
- [ ] SMS sending working
- [ ] WhatsApp messaging working
- [ ] Payment processing working
- [ ] AI features working

### Performance
- [ ] Page load times acceptable (<3s)
- [ ] API response times acceptable (<1s)
- [ ] Database queries optimized
- [ ] Caching working properly
- [ ] Memory usage stable

### Security
- [ ] HTTPS working properly
- [ ] Authentication secure
- [ ] Authorization working
- [ ] Rate limiting active
- [ ] No sensitive data exposed

## Monitoring & Maintenance

### Daily Checks
- [ ] Check application logs
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify backup completion

### Weekly Checks
- [ ] Review security logs
- [ ] Check system resource usage
- [ ] Review slow queries
- [ ] Update dependencies if needed

### Monthly Checks
- [ ] Security vulnerability scan
- [ ] Performance optimization review
- [ ] Backup restoration test
- [ ] Disaster recovery test

## Troubleshooting

### Common Issues
1. **Application won't start**
   - Check environment variables
   - Verify database connectivity
   - Check Redis connectivity
   - Review application logs

2. **Database connection issues**
   - Verify DATABASE_URL
   - Check network connectivity
   - Verify database credentials
   - Check firewall rules

3. **Redis connection issues**
   - Verify REDIS_URL
   - Check Redis service status
   - Verify Redis credentials
   - Check network connectivity

4. **MCP servers not responding**
   - Check MCP configuration
   - Verify MCP secrets
   - Check MCP health endpoints
   - Review MCP logs

5. **External service failures**
   - Verify API credentials
   - Check service status pages
   - Review rate limits
   - Check network connectivity

### Support Contacts
- Database Administrator: [your-dba@company.com]
- DevOps Team: [devops@company.com]
- Security Team: [security@company.com]
- External Service Support: [Document service contact info]

Remember: Always test changes in staging before applying to production!
EOF

    log "✅ Production checklist generated: $checklist_file"
}

# Function to create environment validation script
create_validation_script() {
    local validation_script="${PROJECT_ROOT}/scripts/deployment/validate-production-env.sh"
    
    log "Creating environment validation script..."
    
    cat > "$validation_script" << 'EOF'
#!/bin/bash

# MarketSage Production Environment Validation Script

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ENV_FILE="${PWD}/.env.production"

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"; }

echo "🔍 Validating Production Environment Configuration"
echo "================================================"

if [ ! -f "$ENV_FILE" ]; then
    error "Production environment file not found: $ENV_FILE"
    exit 1
fi

# Load environment variables
source "$ENV_FILE"

errors=0
warnings=0

# Validate required variables
check_var() {
    local var_name=$1
    local var_value=${!var_name}
    local required=${2:-true}
    
    if [ -z "$var_value" ] && [ "$required" = true ]; then
        error "Required variable $var_name is not set"
        errors=$((errors + 1))
    elif [ -z "$var_value" ]; then
        warn "Optional variable $var_name is not set"
        warnings=$((warnings + 1))
    else
        log "✅ $var_name is configured"
    fi
}

# Check for placeholder values
check_placeholder() {
    local var_name=$1
    local var_value=${!var_name}
    local placeholder_pattern=$2
    
    if [[ "$var_value" =~ $placeholder_pattern ]]; then
        error "$var_name still contains placeholder value"
        errors=$((errors + 1))
    fi
}

log "Checking core configuration..."
check_var "NODE_ENV"
check_var "DATABASE_URL"
check_var "NEXTAUTH_SECRET"
check_var "JWT_SECRET"
check_var "APP_URL"

log "Checking MCP configuration..."
check_var "MCP_ENABLED"
check_var "MCP_JWT_SECRET"
check_var "MCP_API_KEY"

log "Checking Redis configuration..."
check_var "REDIS_URL"
check_var "REDIS_HOST"
check_var "REDIS_PORT"

log "Checking AI configuration..."
check_var "OPENAI_API_KEY"
check_var "OPENAI_MODEL"

log "Checking email configuration..."
check_var "EMAIL_PROVIDER"
check_var "SMTP_USER"
check_var "SMTP_PASS"

log "Checking payment configuration..."
check_var "PAYSTACK_SECRET_KEY" false
check_var "PAYSTACK_PUBLIC_KEY" false

log "Checking for placeholder values..."
check_placeholder "NEXTAUTH_SECRET" "GENERATE_STRONG_"
check_placeholder "JWT_SECRET" "GENERATE_STRONG_"
check_placeholder "APP_URL" "your-domain\.com"
check_placeholder "DATABASE_URL" "STRONG_DATABASE_PASSWORD"

echo ""
log "Validation Summary:"
log "✅ Checks passed: $(($(grep -c "✅" <<< "$(set +x; exec 2>&1; set -x; check_var NODE_ENV; check_var DATABASE_URL; check_var NEXTAUTH_SECRET; check_var JWT_SECRET; check_var APP_URL; check_var MCP_ENABLED; check_var MCP_JWT_SECRET; check_var MCP_API_KEY; check_var REDIS_URL; check_var REDIS_HOST; check_var REDIS_PORT; check_var OPENAI_API_KEY; check_var OPENAI_MODEL; check_var EMAIL_PROVIDER; check_var SMTP_USER; check_var SMTP_PASS)") 2>/dev/null || echo 0))"

if [ $errors -gt 0 ]; then
    error "❌ Validation failed with $errors errors"
    exit 1
elif [ $warnings -gt 0 ]; then
    warn "⚠️ Validation completed with $warnings warnings"
    exit 0
else
    log "🎉 All validations passed!"
    exit 0
fi
EOF

    chmod +x "$validation_script"
    log "✅ Validation script created: $validation_script"
}

# Main function
main() {
    log "Starting MarketSage production environment setup..."
    
    # Check if running with proper permissions
    if [ "$EUID" -eq 0 ]; then
        warn "Running as root is not recommended for security reasons"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Setup cancelled"
            exit 1
        fi
    fi
    
    # Validate tools
    validate_tools
    
    # Backup existing environment file
    backup_existing_env
    
    # Create production environment file
    create_production_env
    
    # Generate secrets
    generate_and_update_secrets
    
    # Prompt for configuration
    echo ""
    echo -e "${YELLOW}Would you like to configure production settings interactively?${NC}"
    read -p "Enter configuration interactively? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        log "Skipping interactive configuration"
    else
        prompt_for_configuration
    fi
    
    # Validate environment file
    validate_environment_file
    
    # Set secure permissions
    set_secure_permissions
    
    # Generate additional resources
    generate_checklist
    create_validation_script
    
    echo ""
    log "🎉 Production environment setup completed!"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Review and update .env.production with your specific values"
    echo "2. Run: ./scripts/deployment/validate-production-env.sh"
    echo "3. Follow the production deployment checklist"
    echo "4. Test in staging environment before production deployment"
    echo ""
    echo -e "${YELLOW}Important Files Created:${NC}"
    echo "- $ENV_FILE"
    echo "- ${PROJECT_ROOT}/docs/deployment/PRODUCTION_CHECKLIST.md"
    echo "- ${PROJECT_ROOT}/scripts/deployment/validate-production-env.sh"
    echo ""
    echo -e "${RED}Security Note:${NC}"
    echo "The .env.production file contains sensitive secrets."
    echo "Never commit this file to version control!"
    echo "Ensure proper file permissions are maintained (600)."
}

# Handle script interruption
trap 'error "Setup interrupted. Cleaning up..."; exit 1' INT TERM

# Run main function
main "$@"