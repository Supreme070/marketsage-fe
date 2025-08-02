import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

// Import all controllers
import { WhatsAppProvidersController } from './controllers/whatsapp-providers.controller';
import { WhatsAppMessagesController } from './controllers/whatsapp-messages.controller';
import { WhatsAppTemplatesController } from './controllers/whatsapp-templates.controller';
import { WhatsAppWebhooksController } from './controllers/whatsapp-webhooks.controller';

// Import all services
import { WhatsAppProvidersService } from './services/whatsapp-providers.service';
import { WhatsAppMessagesService } from './services/whatsapp-messages.service';
import { WhatsAppTemplatesService } from './services/whatsapp-templates.service';
import { WhatsAppWebhooksService } from './services/whatsapp-webhooks.service';
import { WhatsAppTemplateSyncService } from './services/whatsapp-template-sync.service';
import { WhatsAppProviderFactoryService } from './providers/whatsapp-provider-factory.service';

// Import core services
import { CoreModule } from '../core/core.module';

@Module({
  imports: [
    CoreModule, // Provides PrismaService, RedisService, QueueService
    HttpModule, // For API calls
  ],
  controllers: [
    WhatsAppProvidersController,
    WhatsAppMessagesController,
    WhatsAppTemplatesController,
    WhatsAppWebhooksController,
  ],
  providers: [
    // Factory service
    WhatsAppProviderFactoryService,
    
    // Business logic services
    WhatsAppProvidersService,
    WhatsAppMessagesService,
    WhatsAppTemplatesService,
    WhatsAppWebhooksService,
    WhatsAppTemplateSyncService,
  ],
  exports: [
    // Export services that might be used by other modules
    WhatsAppProvidersService,
    WhatsAppMessagesService,
    WhatsAppTemplatesService,
    WhatsAppWebhooksService,
    WhatsAppProviderFactoryService,
    WhatsAppTemplateSyncService,
  ],
})
export class WhatsAppModule {
  constructor() {
    console.log('WhatsAppModule initialized with complete integration routes');
  }
}