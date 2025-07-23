import { NextRequest } from 'next/server';
import { createAdminHandler, logAdminAction } from '@/lib/admin-api-middleware';
import { prisma } from '@/lib/db/prisma';
import * as os from 'os';
import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * GET /api/admin/system/infrastructure
 * Infrastructure monitoring with detailed system information
 */
export const GET = createAdminHandler(async (req, { user, permissions }) => {
  try {
    if (!permissions.canAccessSystem) {
      return Response.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const component = url.searchParams.get('component');
    const detailed = url.searchParams.get('detailed') === 'true';

    // Log the admin action
    await logAdminAction(user, 'CHECK_INFRASTRUCTURE', 'infrastructure', {
      component,
      detailed,
    });

    const infrastructure = await getInfrastructureMetrics(detailed);

    // Filter by specific component if requested
    const filteredData = component && infrastructure[component] 
      ? { [component]: infrastructure[component] }
      : infrastructure;

    return Response.json({
      success: true,
      data: {
        infrastructure: filteredData,
        timestamp: new Date(),
        hostname: os.hostname(),
        platform: os.platform(),
      },
    });

  } catch (error) {
    console.error('Infrastructure monitoring error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to get infrastructure metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}, 'canAccessSystem');

/**
 * Get comprehensive infrastructure metrics
 */
async function getInfrastructureMetrics(detailed: boolean): Promise<any> {
  const infrastructure: any = {};

  // Server Information
  infrastructure.server = await getServerInformation(detailed);
  
  // CPU Information
  infrastructure.cpu = await getCPUInformation(detailed);
  
  // Memory Information
  infrastructure.memory = await getMemoryInformation(detailed);
  
  // Storage Information
  infrastructure.storage = await getStorageInformation(detailed);
  
  // Network Information
  infrastructure.network = await getNetworkInformation(detailed);
  
  // Process Information
  infrastructure.process = await getProcessInformation(detailed);
  
  // Environment Information
  infrastructure.environment = await getEnvironmentInformation(detailed);

  return infrastructure;
}

/**
 * Get server information
 */
async function getServerInformation(detailed: boolean): Promise<any> {
  const server = {
    hostname: os.hostname(),
    platform: os.platform(),
    architecture: os.arch(),
    release: os.release(),
    type: os.type(),
    uptime: Math.round(os.uptime()),
    bootTime: new Date(Date.now() - (os.uptime() * 1000)),
    lastChecked: new Date(),
  };

  if (detailed) {
    try {
      // Try to get additional system information (Linux/macOS specific)
      if (os.platform() === 'linux') {
        try {
          const { stdout: kernelVersion } = await execAsync('uname -r');
          const { stdout: osInfo } = await execAsync('cat /etc/os-release 2>/dev/null || echo "OS info not available"');
          
          (server as any).detailed = {
            kernelVersion: kernelVersion.trim(),
            osInfo: osInfo.trim(),
          };
        } catch (error) {
          (server as any).detailed = { error: 'Failed to get detailed OS info' };
        }
      } else if (os.platform() === 'darwin') {
        try {
          const { stdout: macVersion } = await execAsync('sw_vers -productVersion');
          const { stdout: macBuild } = await execAsync('sw_vers -buildVersion');
          
          (server as any).detailed = {
            macVersion: macVersion.trim(),
            buildVersion: macBuild.trim(),
          };
        } catch (error) {
          (server as any).detailed = { error: 'Failed to get macOS info' };
        }
      }
    } catch (error) {
      (server as any).detailed = { error: 'System command execution failed' };
    }
  }

  return server;
}

/**
 * Get CPU information
 */
async function getCPUInformation(detailed: boolean): Promise<any> {
  const cpus = os.cpus();
  
  // Calculate current CPU usage
  let totalIdle = 0;
  let totalTick = 0;
  
  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type as keyof typeof cpu.times];
    }
    totalIdle += cpu.times.idle;
  });
  
  const currentUsage = 100 - Math.round(100 * totalIdle / totalTick);
  
  const cpu = {
    count: cpus.length,
    model: cpus[0]?.model || 'Unknown',
    speed: cpus[0]?.speed || 0,
    currentUsage,
    loadAverage: os.loadavg().map(load => Math.round(load * 100) / 100),
    lastChecked: new Date(),
  };

  if (detailed) {
    (cpu as any).detailed = {
      cores: cpus.map((cpu, index) => ({
        core: index,
        model: cpu.model,
        speed: cpu.speed,
        times: {
          user: cpu.times.user,
          nice: cpu.times.nice,
          sys: cpu.times.sys,
          idle: cpu.times.idle,
          irq: cpu.times.irq,
        },
      })),
      architecture: os.arch(),
      endianness: os.endianness(),
    };

    // Try to get CPU temperature (Linux only)
    if (os.platform() === 'linux') {
      try {
        const { stdout } = await execAsync('cat /sys/class/thermal/thermal_zone0/temp 2>/dev/null || echo "0"');
        const temp = parseInt(stdout.trim());
        if (temp > 0) {
          (cpu as any).detailed.temperature = Math.round(temp / 1000); // Convert from millicelsius
        }
      } catch (error) {
        // Temperature not available
      }
    }
  }

  return cpu;
}

/**
 * Get memory information
 */
async function getMemoryInformation(detailed: boolean): Promise<any> {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  const memory = {
    total: Math.round(totalMem / 1024 / 1024), // MB
    free: Math.round(freeMem / 1024 / 1024), // MB
    used: Math.round(usedMem / 1024 / 1024), // MB
    usagePercent: Math.round((usedMem / totalMem) * 100),
    available: Math.round(freeMem / 1024 / 1024), // MB
    lastChecked: new Date(),
  };

  if (detailed) {
    const processMemory = process.memoryUsage();
    
    (memory as any).detailed = {
      process: {
        rss: Math.round(processMemory.rss / 1024 / 1024), // MB
        heapTotal: Math.round(processMemory.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(processMemory.heapUsed / 1024 / 1024), // MB
        external: Math.round(processMemory.external / 1024 / 1024), // MB
        arrayBuffers: Math.round((processMemory as any).arrayBuffers / 1024 / 1024) || 0, // MB
      },
      system: {
        totalGB: Math.round(totalMem / 1024 / 1024 / 1024 * 100) / 100,
        freeGB: Math.round(freeMem / 1024 / 1024 / 1024 * 100) / 100,
        usedGB: Math.round(usedMem / 1024 / 1024 / 1024 * 100) / 100,
      },
    };

    // Try to get swap information (Linux only)
    if (os.platform() === 'linux') {
      try {
        const { stdout } = await execAsync('cat /proc/swaps 2>/dev/null | tail -n +2 | awk "{sum+=$3} END {print sum}"');
        const swapUsed = parseInt(stdout.trim()) || 0;
        (memory as any).detailed.swap = {
          used: Math.round(swapUsed / 1024), // MB
        };
      } catch (error) {
        // Swap info not available
      }
    }
  }

  return memory;
}

/**
 * Get storage information
 */
async function getStorageInformation(detailed: boolean): Promise<any> {
  const storage: any = {
    lastChecked: new Date(),
  };

  try {
    if (os.platform() === 'linux' || os.platform() === 'darwin') {
      const { stdout } = await execAsync('df -h / 2>/dev/null | tail -1');
      const parts = stdout.trim().split(/\s+/);
      
      if (parts.length >= 5) {
        storage.root = {
          filesystem: parts[0],
          size: parts[1],
          used: parts[2],
          available: parts[3],
          usagePercent: parseInt(parts[4].replace('%', '')),
          mountPoint: parts[5] || '/',
        };
      }
    }
  } catch (error) {
    storage.error = 'Failed to get disk usage information';
  }

  if (detailed) {
    try {
      if (os.platform() === 'linux') {
        // Get detailed disk information
        const { stdout } = await execAsync('df -h 2>/dev/null | grep -E "^/" | head -10');
        const lines = stdout.trim().split('\n');
        
        storage.detailed = {
          filesystems: lines.map(line => {
            const parts = line.split(/\s+/);
            return {
              filesystem: parts[0],
              size: parts[1],
              used: parts[2],
              available: parts[3],
              usagePercent: parseInt(parts[4]?.replace('%', '') || '0'),
              mountPoint: parts[5],
            };
          }),
        };

        // Get inode information
        try {
          const { stdout: inodeInfo } = await execAsync('df -i / 2>/dev/null | tail -1');
          const inodeParts = inodeInfo.trim().split(/\s+/);
          if (inodeParts.length >= 5) {
            storage.detailed.inodes = {
              total: inodeParts[1],
              used: inodeParts[2],
              available: inodeParts[3],
              usagePercent: parseInt(inodeParts[4].replace('%', '')),
            };
          }
        } catch (error) {
          // Inode info not available
        }
      }
    } catch (error) {
      storage.detailed = { error: 'Failed to get detailed storage info' };
    }
  }

  return storage;
}

/**
 * Get network information
 */
async function getNetworkInformation(detailed: boolean): Promise<any> {
  const networkInterfaces = os.networkInterfaces();
  
  const network: any = {
    interfaces: [],
    lastChecked: new Date(),
  };

  Object.keys(networkInterfaces).forEach(name => {
    const interfaces = networkInterfaces[name];
    if (interfaces) {
      interfaces.forEach(iface => {
        network.interfaces.push({
          name,
          family: iface.family,
          address: iface.address,
          netmask: iface.netmask,
          mac: iface.mac,
          internal: iface.internal,
        });
      });
    }
  });

  // Count active external interfaces
  network.activeExternal = network.interfaces.filter((iface: any) => 
    !iface.internal && iface.family === 'IPv4'
  ).length;

  network.total = network.interfaces.length;

  if (detailed) {
    try {
      // Try to get network statistics (Linux only)
      if (os.platform() === 'linux') {
        const { stdout } = await execAsync('cat /proc/net/dev 2>/dev/null | tail -n +3');
        const lines = stdout.trim().split('\n');
        
        network.detailed = {
          statistics: lines.map(line => {
            const parts = line.trim().split(/\s+/);
            const interfaceName = parts[0].replace(':', '');
            return {
              interface: interfaceName,
              bytesReceived: parseInt(parts[1]) || 0,
              packetsReceived: parseInt(parts[2]) || 0,
              bytesTransmitted: parseInt(parts[9]) || 0,
              packetsTransmitted: parseInt(parts[10]) || 0,
            };
          }),
        };
      }
    } catch (error) {
      network.detailed = { error: 'Failed to get network statistics' };
    }
  }

  return network;
}

/**
 * Get process information
 */
async function getProcessInformation(detailed: boolean): Promise<any> {
  const processInfo = {
    pid: process.pid,
    ppid: process.ppid,
    uptime: Math.round(process.uptime()),
    version: process.version,
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.versions.node,
    v8Version: process.versions.v8,
    lastChecked: new Date(),
  };

  if (detailed) {
    (processInfo as any).detailed = {
      versions: process.versions,
      features: {
        inspector: typeof process.env.NODE_OPTIONS?.includes('--inspect') !== 'undefined',
        deprecationWarnings: !process.noDeprecation,
        experimentalModules: typeof (process as any).experimentalModules !== 'undefined',
      },
      resourceUsage: process.resourceUsage ? process.resourceUsage() : null,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    };

    // Try to get process list (limited for security)
    try {
      if (os.platform() === 'linux' || os.platform() === 'darwin') {
        const { stdout } = await execAsync('ps aux | head -20');
        const lines = stdout.trim().split('\n');
        (processInfo as any).detailed.systemProcesses = {
          count: lines.length - 1, // Subtract header
          sample: lines.slice(0, 5), // First 5 lines only
        };
      }
    } catch (error) {
      // Process list not available
    }
  }

  return processInfo;
}

/**
 * Get environment information
 */
async function getEnvironmentInformation(detailed: boolean): Promise<any> {
  const environment: any = {
    nodeEnv: process.env.NODE_ENV || 'development',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: Intl.DateTimeFormat().resolvedOptions().locale,
    lastChecked: new Date(),
  };

  if (detailed) {
    environment.detailed = {
      // Only include non-sensitive environment variables
      safeEnvVars: Object.keys(process.env)
        .filter(key => !key.toLowerCase().includes('secret') && 
                      !key.toLowerCase().includes('key') &&
                      !key.toLowerCase().includes('password') &&
                      !key.toLowerCase().includes('token'))
        .reduce((acc, key) => {
          acc[key] = process.env[key]?.length ? `${process.env[key]?.substring(0, 20)}...` : '';
          return acc;
        }, {} as Record<string, string>),
      execPath: process.execPath,
      argv: process.argv,
      cwd: process.cwd(),
    };
  }

  return environment;
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}