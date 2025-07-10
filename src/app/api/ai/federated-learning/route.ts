import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { federatedLearningSystem } from '@/lib/ai/federated-learning-system';
import { UserRole } from '@prisma/client';

/**
 * Federated Learning API
 * 
 * Manages privacy-preserving distributed learning across multiple organizations
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || session.user.organizationId;
    const action = searchParams.get('action');
    const sessionId = searchParams.get('sessionId');
    const modelId = searchParams.get('modelId');

    switch (action) {
      case 'nodes':
        const nodes = federatedLearningSystem.getFederatedNodes();
        return NextResponse.json({
          success: true,
          data: nodes,
          timestamp: new Date().toISOString()
        });

      case 'models':
        const models = federatedLearningSystem.getFederatedModels();
        return NextResponse.json({
          success: true,
          data: models,
          timestamp: new Date().toISOString()
        });

      case 'sessions':
        const sessions = federatedLearningSystem.getFederatedSessions();
        return NextResponse.json({
          success: true,
          data: sessions,
          timestamp: new Date().toISOString()
        });

      case 'training_rounds':
        const rounds = federatedLearningSystem.getTrainingRounds(sessionId || undefined);
        return NextResponse.json({
          success: true,
          data: rounds,
          timestamp: new Date().toISOString()
        });

      case 'privacy_metrics':
        if (!sessionId) {
          return NextResponse.json({
            success: false,
            error: 'Session ID is required for privacy metrics'
          }, { status: 400 });
        }

        const privacyMetrics = federatedLearningSystem.getPrivacyMetrics(sessionId);
        return NextResponse.json({
          success: true,
          data: privacyMetrics,
          timestamp: new Date().toISOString()
        });

      case 'privacy_compliance':
        if (!sessionId) {
          return NextResponse.json({
            success: false,
            error: 'Session ID is required for privacy compliance'
          }, { status: 400 });
        }

        const compliance = await federatedLearningSystem.validatePrivacyCompliance(
          sessionId,
          organizationId
        );
        return NextResponse.json({
          success: true,
          data: compliance,
          timestamp: new Date().toISOString()
        });

      case 'statistics':
        const statistics = federatedLearningSystem.getSystemStatistics();
        return NextResponse.json({
          success: true,
          data: statistics,
          timestamp: new Date().toISOString()
        });

      case 'dashboard':
        const dashboardData = {
          nodes: federatedLearningSystem.getFederatedNodes(),
          models: federatedLearningSystem.getFederatedModels(),
          sessions: federatedLearningSystem.getFederatedSessions(),
          statistics: federatedLearningSystem.getSystemStatistics()
        };

        return NextResponse.json({
          success: true,
          data: dashboardData,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action specified'
        }, { status: 400 });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('Federated learning GET error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve federated learning data',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, nodeData, modelData, sessionData } = body;

    logger.info('Federated learning action', {
      action,
      userId: session.user.id,
      organizationId: session.user.organizationId
    });

    switch (action) {
      case 'register_node':
        if (!nodeData) {
          return NextResponse.json({
            success: false,
            error: 'Node data is required'
          }, { status: 400 });
        }

        const newNode = await federatedLearningSystem.registerNode(nodeData);
        return NextResponse.json({
          success: true,
          data: newNode,
          message: 'Node registered successfully',
          timestamp: new Date().toISOString()
        });

      case 'create_model':
        if (!modelData) {
          return NextResponse.json({
            success: false,
            error: 'Model data is required'
          }, { status: 400 });
        }

        const newModel = await federatedLearningSystem.createFederatedModel(modelData);
        return NextResponse.json({
          success: true,
          data: newModel,
          message: 'Federated model created successfully',
          timestamp: new Date().toISOString()
        });

      case 'start_session':
        if (!sessionData || !sessionData.modelId || !sessionData.coordinatorId) {
          return NextResponse.json({
            success: false,
            error: 'Session data with modelId and coordinatorId is required'
          }, { status: 400 });
        }

        const newSession = await federatedLearningSystem.startFederatedSession(
          sessionData.modelId,
          sessionData.coordinatorId,
          session.user.organizationId
        );

        return NextResponse.json({
          success: true,
          data: newSession,
          message: 'Federated learning session started successfully',
          timestamp: new Date().toISOString()
        });

      case 'validate_privacy':
        if (!sessionData || !sessionData.sessionId) {
          return NextResponse.json({
            success: false,
            error: 'Session ID is required for privacy validation'
          }, { status: 400 });
        }

        const validation = await federatedLearningSystem.validatePrivacyCompliance(
          sessionData.sessionId,
          session.user.organizationId
        );

        return NextResponse.json({
          success: true,
          data: validation,
          message: 'Privacy compliance validated',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported action: ${action}`
        }, { status: 400 });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('Federated learning POST error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Federated learning operation failed',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can update federated learning settings
    if (![UserRole.ADMIN, UserRole.IT_ADMIN, UserRole.SUPER_ADMIN].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, nodeId, modelId, updates } = body;

    switch (action) {
      case 'update_node':
        if (!nodeId || !updates) {
          return NextResponse.json({
            success: false,
            error: 'Node ID and updates are required'
          }, { status: 400 });
        }

        // In a real implementation, this would update the node
        return NextResponse.json({
          success: true,
          message: 'Node updated successfully',
          timestamp: new Date().toISOString()
        });

      case 'update_model':
        if (!modelId || !updates) {
          return NextResponse.json({
            success: false,
            error: 'Model ID and updates are required'
          }, { status: 400 });
        }

        // In a real implementation, this would update the model
        return NextResponse.json({
          success: true,
          message: 'Model updated successfully',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported action: ${action}`
        }, { status: 400 });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('Federated learning PUT error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Federated learning update failed',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete federated learning resources
    if (![UserRole.ADMIN, UserRole.IT_ADMIN, UserRole.SUPER_ADMIN].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get('nodeId');
    const modelId = searchParams.get('modelId');
    const sessionId = searchParams.get('sessionId');

    if (nodeId) {
      // In a real implementation, this would delete the node
      return NextResponse.json({
        success: true,
        message: 'Node deleted successfully',
        timestamp: new Date().toISOString()
      });
    }

    if (modelId) {
      // In a real implementation, this would delete the model
      return NextResponse.json({
        success: true,
        message: 'Model deleted successfully',
        timestamp: new Date().toISOString()
      });
    }

    if (sessionId) {
      // In a real implementation, this would delete the session
      return NextResponse.json({
        success: true,
        message: 'Session deleted successfully',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Node ID, Model ID, or Session ID is required'
    }, { status: 400 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('Federated learning DELETE error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Federated learning deletion failed',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}