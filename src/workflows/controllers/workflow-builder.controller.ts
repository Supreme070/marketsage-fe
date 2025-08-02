import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { WorkflowBuilderService } from '../services/workflow-builder.service';
import {
  CreateWorkflowDto,
  UpdateWorkflowDto,
  WorkflowDto,
  GetWorkflowsQueryDto,
  GetWorkflowsResponseDto,
} from '../dto';

@ApiTags('Workflow Builder')
@Controller('workflows')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkflowBuilderController {
  constructor(
    private readonly workflowBuilderService: WorkflowBuilderService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create workflow' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Workflow created successfully',
    type: WorkflowDto,
  })
  async create(
    @Body() createDto: CreateWorkflowDto,
    @Request() req: any,
  ): Promise<WorkflowDto> {
    return this.workflowBuilderService.create(
      createDto,
      req.user.organizationId,
      req.user.id,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get workflows' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of workflows',
    type: GetWorkflowsResponseDto,
  })
  async findAll(
    @Query() query: GetWorkflowsQueryDto,
    @Request() req: any,
  ): Promise<GetWorkflowsResponseDto> {
    return this.workflowBuilderService.findAll(
      query,
      req.user.organizationId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workflow by ID' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workflow details',
    type: WorkflowDto,
  })
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<WorkflowDto> {
    return this.workflowBuilderService.findOne(
      id,
      req.user.organizationId,
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update workflow' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workflow updated successfully',
    type: WorkflowDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateWorkflowDto,
    @Request() req: any,
  ): Promise<WorkflowDto> {
    return this.workflowBuilderService.update(
      id,
      updateDto,
      req.user.organizationId,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete workflow' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Workflow deleted successfully',
  })
  async remove(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<void> {
    return this.workflowBuilderService.remove(
      id,
      req.user.organizationId,
    );
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate workflow' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workflow activated successfully',
    type: WorkflowDto,
  })
  async activate(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<WorkflowDto> {
    return this.workflowBuilderService.activate(
      id,
      req.user.organizationId,
    );
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate workflow' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workflow deactivated successfully',
    type: WorkflowDto,
  })
  async deactivate(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<WorkflowDto> {
    return this.workflowBuilderService.deactivate(
      id,
      req.user.organizationId,
    );
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate workflow' })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Workflow duplicated successfully',
    type: WorkflowDto,
  })
  async duplicate(
    @Param('id') id: string,
    @Body('name') name: string,
    @Request() req: any,
  ): Promise<WorkflowDto> {
    return this.workflowBuilderService.duplicate(
      id,
      name,
      req.user.organizationId,
      req.user.id,
    );
  }
}