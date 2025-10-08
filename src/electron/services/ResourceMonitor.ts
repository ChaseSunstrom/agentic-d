import * as si from 'systeminformation';
import { EventEmitter } from 'events';

export interface ResourceUsage {
  cpu: {
    usage: number;
    cores: number;
    model: string;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  network: {
    received: number;
    sent: number;
  };
  timestamp: Date;
}

export interface ResourceHistory {
  timestamp: Date;
  cpu: number;
  memory: number;
  disk: number;
}

export class ResourceMonitor extends EventEmitter {
  private history: ResourceHistory[] = [];
  private maxHistorySize = 1000;
  private monitorInterval: NodeJS.Timeout | null = null;
  private lastNetworkStats: any = null;

  constructor() {
    super();
    this.startMonitoring();
  }

  private startMonitoring(): void {
    // Monitor every 5 seconds
    this.monitorInterval = setInterval(async () => {
      try {
        const usage = await this.getResourceUsage();
        
        // Add to history
        this.history.push({
          timestamp: usage.timestamp,
          cpu: usage.cpu.usage,
          memory: usage.memory.usagePercent,
          disk: usage.disk.usagePercent
        });

        // Trim history if too large
        if (this.history.length > this.maxHistorySize) {
          this.history = this.history.slice(-this.maxHistorySize);
        }

        this.emit('update', usage);
      } catch (error) {
        console.error('Resource monitoring error:', error);
      }
    }, 5000);
  }

  async getResourceUsage(): Promise<ResourceUsage> {
    try {
      const [cpuData, memData, diskData, networkData, cpuInfo] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.fsSize(),
        si.networkStats(),
        si.cpu()
      ]);

      // Calculate network delta
      let networkReceived = 0;
      let networkSent = 0;
      
      if (networkData.length > 0) {
        const currentStats = networkData[0];
        if (this.lastNetworkStats) {
          networkReceived = currentStats.rx_bytes - this.lastNetworkStats.rx_bytes;
          networkSent = currentStats.tx_bytes - this.lastNetworkStats.tx_bytes;
        }
        this.lastNetworkStats = currentStats;
      }

      // Aggregate disk stats
      const totalDisk = diskData.reduce((acc, disk) => acc + disk.size, 0);
      const usedDisk = diskData.reduce((acc, disk) => acc + disk.used, 0);

      return {
        cpu: {
          usage: Math.round(cpuData.currentLoad * 10) / 10,
          cores: cpuInfo.cores,
          model: cpuInfo.brand
        },
        memory: {
          total: memData.total,
          used: memData.used,
          free: memData.free,
          usagePercent: Math.round((memData.used / memData.total) * 1000) / 10
        },
        disk: {
          total: totalDisk,
          used: usedDisk,
          free: totalDisk - usedDisk,
          usagePercent: Math.round((usedDisk / totalDisk) * 1000) / 10
        },
        network: {
          received: networkReceived,
          sent: networkSent
        },
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to get resource usage:', error);
      throw error;
    }
  }

  async getHistory(duration: string = '1h'): Promise<ResourceHistory[]> {
    const now = Date.now();
    let cutoff: number;

    switch (duration) {
      case '5m':
        cutoff = now - 5 * 60 * 1000;
        break;
      case '15m':
        cutoff = now - 15 * 60 * 1000;
        break;
      case '1h':
        cutoff = now - 60 * 60 * 1000;
        break;
      case '6h':
        cutoff = now - 6 * 60 * 60 * 1000;
        break;
      case '24h':
        cutoff = now - 24 * 60 * 60 * 1000;
        break;
      default:
        cutoff = now - 60 * 60 * 1000;
    }

    return this.history.filter(h => h.timestamp.getTime() >= cutoff);
  }

  stop(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }
}
