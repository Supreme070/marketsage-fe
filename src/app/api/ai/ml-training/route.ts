import { type NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { mlTrainingPipeline, MLModelType, MLAlgorithm, LearningType } from '@/lib/ai/ml-training-pipeline';
import { logger } from '@/lib/logger';

/**
 * ML Training Pipeline API
 * 
 * Provides comprehensive machine learning training pipeline with continuous learning capabilities
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      action,
      modelConfig,
      datasetConfig,
      learningType = LearningType.BATCH,
      organizationId = session.user.organizationId,
      jobId,
      modelId,
      metrics,
      startDate,
      endDate
    } = body;

    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: action'
      }, { status: 400 });
    }

    logger.info('ML training request', {
      action,
      organizationId,
      userId: session.user.id
    });

    let result;

    switch (action) {
      case 'create_training_job':
        if (!modelConfig || !datasetConfig) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameters: modelConfig, datasetConfig'
          }, { status: 400 });
        }

        // Validate model configuration
        if (!modelConfig.name || !modelConfig.type || !modelConfig.algorithm) {
          return NextResponse.json({
            success: false,
            error: 'Invalid model configuration: name, type, and algorithm are required'
          }, { status: 400 });
        }

        // Validate dataset configuration
        if (!datasetConfig.dataSource || !datasetConfig.features || !Array.isArray(datasetConfig.features)) {
          return NextResponse.json({
            success: false,
            error: 'Invalid dataset configuration: dataSource and features array are required'
          }, { status: 400 });
        }

        result = await mlTrainingPipeline.createTrainingJob(
          {
            name: modelConfig.name,
            type: modelConfig.type as MLModelType,
            algorithm: modelConfig.algorithm as MLAlgorithm,
            parameters: modelConfig.parameters,
            architecture: modelConfig.architecture
          },
          {
            dataSource: datasetConfig.dataSource,
            targetColumn: datasetConfig.targetColumn,
            features: datasetConfig.features,
            splitRatio: datasetConfig.splitRatio,
            validationRatio: datasetConfig.validationRatio
          },
          organizationId,
          session.user.id,
          learningType as LearningType
        );
        break;

      case 'get_training_job_status':
        if (!jobId) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameter: jobId'
          }, { status: 400 });
        }

        result = await mlTrainingPipeline.getTrainingJobStatus(jobId);
        
        if (!result) {
          return NextResponse.json({
            success: false,
            error: 'Training job not found'
          }, { status: 404 });
        }
        break;

      case 'cancel_training_job':
        if (!jobId) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameter: jobId'
          }, { status: 400 });
        }

        const cancelled = await mlTrainingPipeline.cancelTrainingJob(jobId);
        
        if (!cancelled) {
          return NextResponse.json({
            success: false,
            error: 'Training job cannot be cancelled or not found'
          }, { status: 400 });
        }

        result = { cancelled: true };
        break;

      case 'get_model_performance':
        if (!modelId) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameter: modelId'
          }, { status: 400 });
        }

        result = await mlTrainingPipeline.getModelPerformanceMetrics(modelId);
        break;

      case 'update_model_performance':
        if (!modelId || !metrics) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameters: modelId, metrics'
          }, { status: 400 });
        }

        await mlTrainingPipeline.updateModelPerformanceMetrics(modelId, metrics);
        result = { updated: true };
        break;

      case 'get_training_statistics':
        result = await mlTrainingPipeline.getTrainingStatistics(organizationId);
        break;

      case 'get_models':
        result = await mlTrainingPipeline.getModels(organizationId);
        break;

      case 'get_model':
        if (!modelId) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameter: modelId'
          }, { status: 400 });
        }

        result = await mlTrainingPipeline.getModel(modelId);
        
        if (!result) {
          return NextResponse.json({
            success: false,
            error: 'Model not found'
          }, { status: 404 });
        }
        break;

      case 'create_churn_prediction_model':
        // Predefined churn prediction model
        result = await mlTrainingPipeline.createTrainingJob(
          {
            name: 'customer_churn_prediction',
            type: MLModelType.CLASSIFICATION,
            algorithm: MLAlgorithm.RANDOM_FOREST,
            parameters: {
              n_estimators: 100,
              max_depth: 10,
              min_samples_split: 2,
              random_state: 42
            },
            architecture: {
              layers: 3,
              neurons: [64, 32, 16],
              activation: 'relu',
              optimizer: 'adam'
            }
          },
          {
            dataSource: 'customer_engagement_data',
            targetColumn: 'churned',
            features: [
              'engagement_score',
              'days_since_last_login',
              'email_open_rate',
              'campaign_clicks',
              'support_tickets',
              'subscription_duration',
              'payment_failures',
              'feature_usage_count'
            ],
            splitRatio: 0.8,
            validationRatio: 0.2
          },
          organizationId,
          session.user.id,
          LearningType.BATCH
        );
        break;

      case 'create_engagement_scoring_model':
        // Predefined engagement scoring model
        result = await mlTrainingPipeline.createTrainingJob(
          {
            name: 'engagement_scoring',
            type: MLModelType.REGRESSION,
            algorithm: MLAlgorithm.GRADIENT_BOOSTING,
            parameters: {
              n_estimators: 150,
              learning_rate: 0.1,
              max_depth: 8,
              random_state: 42
            }
          },
          {
            dataSource: 'user_interaction_data',
            targetColumn: 'engagement_score',
            features: [
              'page_views',
              'session_duration',
              'bounce_rate',
              'time_on_page',
              'click_through_rate',
              'conversion_rate',
              'social_shares',
              'comments_count',
              'downloads',
              'form_submissions'
            ],
            splitRatio: 0.75,
            validationRatio: 0.25
          },
          organizationId,
          session.user.id,
          LearningType.ONLINE
        );
        break;

      case 'create_content_recommendation_model':
        // Predefined content recommendation model
        result = await mlTrainingPipeline.createTrainingJob(
          {
            name: 'content_recommendation',
            type: MLModelType.RECOMMENDATION,
            algorithm: MLAlgorithm.NEURAL_NETWORK,
            parameters: {
              embedding_size: 128,
              hidden_layers: [256, 128, 64],
              dropout_rate: 0.2,
              learning_rate: 0.001
            },
            architecture: {
              layers: 4,
              neurons: [256, 128, 64, 32],
              activation: 'relu',
              optimizer: 'adam'
            }
          },
          {
            dataSource: 'user_content_interactions',
            features: [
              'user_id',
              'content_id',
              'content_type',
              'interaction_type',
              'timestamp',
              'duration',
              'rating',
              'category',
              'tags',
              'user_preferences'
            ],
            splitRatio: 0.8,
            validationRatio: 0.2
          },
          organizationId,
          session.user.id,
          LearningType.INCREMENTAL
        );
        break;

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported action: ${action}`
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result,
      action,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('ML training API error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'ML training operation failed',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || session.user.organizationId;
    const action = searchParams.get('action') || 'capabilities';

    switch (action) {
      case 'capabilities':
        return NextResponse.json({
          success: true,
          data: {
            capabilities: {
              batchTraining: true,
              onlineLearning: true,
              incrementalLearning: true,
              transferLearning: true,
              federatedLearning: true,
              hyperparameterTuning: true,
              modelSelection: true,
              crossValidation: true,
              performanceMonitoring: true,
              continuousLearning: true,
              modelDeployment: true,
              driftDetection: true,
              abTesting: true,
              modelVersioning: true,
              realTimeInference: true
            },
            supportedModelTypes: Object.values(MLModelType),
            supportedAlgorithms: Object.values(MLAlgorithm),
            supportedLearningTypes: Object.values(LearningType),
            predefinedModels: [
              {
                name: 'Customer Churn Prediction',
                type: MLModelType.CLASSIFICATION,
                algorithm: MLAlgorithm.RANDOM_FOREST,
                description: 'Predicts customer churn based on engagement patterns',
                features: [
                  'engagement_score',
                  'days_since_last_login',
                  'email_open_rate',
                  'campaign_clicks',
                  'support_tickets',
                  'subscription_duration',
                  'payment_failures',
                  'feature_usage_count'
                ]
              },
              {
                name: 'Engagement Scoring',
                type: MLModelType.REGRESSION,
                algorithm: MLAlgorithm.GRADIENT_BOOSTING,
                description: 'Scores customer engagement based on interactions',
                features: [
                  'page_views',
                  'session_duration',
                  'bounce_rate',
                  'time_on_page',
                  'click_through_rate',
                  'conversion_rate',
                  'social_shares',
                  'comments_count',
                  'downloads',
                  'form_submissions'
                ]
              },
              {
                name: 'Content Recommendation',
                type: MLModelType.RECOMMENDATION,
                algorithm: MLAlgorithm.NEURAL_NETWORK,
                description: 'Recommends personalized content to users',
                features: [
                  'user_id',
                  'content_id',
                  'content_type',
                  'interaction_type',
                  'timestamp',
                  'duration',
                  'rating',
                  'category',
                  'tags',
                  'user_preferences'
                ]
              }
            ],
            features: [
              'Automated data collection and preprocessing',
              'Multiple ML model architectures and algorithms',
              'Continuous learning with online model updates',
              'A/B testing for model performance comparison',
              'Automated model evaluation and validation',
              'Model versioning and deployment pipeline',
              'Performance monitoring and drift detection',
              'Automated retraining based on performance degradation',
              'Real-time model serving and inference',
              'Comprehensive logging and audit trail',
              'WebSocket streaming for real-time updates',
              'Hyperparameter tuning and optimization'
            ]
          },
          timestamp: new Date().toISOString()
        });

      case 'training_overview':
        const statistics = await mlTrainingPipeline.getTrainingStatistics(organizationId);
        return NextResponse.json({
          success: true,
          data: statistics,
          timestamp: new Date().toISOString()
        });

      case 'models_summary':
        const models = await mlTrainingPipeline.getModels(organizationId);
        const modelsSummary = {
          totalModels: models.length,
          activeModels: models.filter(m => m.metadata.isActive).length,
          productionModels: models.filter(m => m.metadata.isProduction).length,
          modelTypes: models.reduce((acc, model) => {
            acc[model.type] = (acc[model.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          averageAccuracy: models.reduce((sum, model) => 
            sum + (model.performance.accuracy || 0), 0) / models.length || 0,
          recentModels: models
            .sort((a, b) => b.metadata.trainedAt.getTime() - a.metadata.trainedAt.getTime())
            .slice(0, 5)
            .map(model => ({
              id: model.id,
              name: model.name,
              type: model.type,
              algorithm: model.algorithm,
              accuracy: model.performance.accuracy,
              trainedAt: model.metadata.trainedAt,
              isActive: model.metadata.isActive,
              isProduction: model.metadata.isProduction
            }))
        };
        
        return NextResponse.json({
          success: true,
          data: modelsSummary,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported GET action: ${action}`
        }, { status: 400 });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('ML training GET error:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve ML training information',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}