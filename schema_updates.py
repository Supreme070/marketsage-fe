#!/usr/bin/env python3
"""
Safe Prisma Schema Updater for organizationId
Adds organizationId to tenant-isolated models without breaking the system
"""

import re
import sys

def read_file(filepath):
    with open(filepath, 'r') as f:
        return f.read()

def write_file(filepath, content):
    with open(filepath, 'w') as f:
        f.write(content)

def add_organization_id_to_model(content, model_name):
    """
    Add organizationId field and relation to a specific model
    """
    # Pattern to match the model declaration
    model_pattern = rf'(model {model_name} \{{[^}}]*?createdById\s+String[^}}]*?)(\s+// Relations)'
    
    # Replacement with organizationId field
    replacement = r'\1\n  organizationId  String?   // Made optional for safe migration\2'
    
    content = re.sub(model_pattern, replacement, content, flags=re.DOTALL)
    
    # Add organization relation
    relation_pattern = rf'(model {model_name} \{{[^}}]*?// Relations[^}}]*?createdBy[^}}]*?)(\s+[a-zA-Z_][a-zA-Z0-9_]*\s+[^}}]*?\[\])'
    
    org_relation = r'\1\n  organization    Organization? @relation(fields: [organizationId], references: [id])\2'
    
    content = re.sub(relation_pattern, org_relation, content, flags=re.DOTALL)
    
    # Add index
    index_pattern = rf'(model {model_name} \{{[^}}]*?)(\}})'
    index_replacement = r'\1\n\n  @@index([organizationId])\2'
    
    content = re.sub(index_pattern, index_replacement, content, flags=re.DOTALL)
    
    return content

def main():
    schema_path = '/Users/supreme/Desktop/marketsage/prisma/schema.prisma'
    
    # Models that need organizationId (excluding ones already done)
    models_to_update = [
        'Segment',
        'EmailTemplate', 
        'SMSCampaign',
        'WhatsAppCampaign',
        'Workflow',
        'Task',
        'Journey',
        'AI_ContentAnalysis',
        'AI_CustomerSegment',
        'AI_ChatHistory',
        'LeadPulseVisitor',
        'LeadPulseTouchpoint',
        'ConversionEvent',
        'ConversionTracking',
        'ConversionFunnel',
        'PredictionModel',
        'ChurnPrediction',
        'LifetimeValuePrediction',
        'ContactJourney'
    ]
    
    print(f"Reading schema from {schema_path}")
    content = read_file(schema_path)
    
    print(f"Processing {len(models_to_update)} models...")
    
    for model in models_to_update:
        print(f"  Adding organizationId to {model}")
        content = add_organization_id_to_model(content, model)
    
    print(f"Writing updated schema...")
    write_file(schema_path, content)
    
    print("✅ Schema update complete!")
    print("\nNext steps:")
    print("1. Run: npx prisma db push")
    print("2. Test super admin login")
    print("3. Verify tenant isolation")

if __name__ == "__main__":
    main()