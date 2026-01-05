// plugins/drivers/modbus-rtu.js
// Modbus RTU Driver for HAL
// Proof of connection / device testing only

;(() => {
  'use strict';

  let currentPort = null;
  let reader = null;
  let slaveId = 1;
  let timeout = 1000;

  // CRC-16 calculation for Modbus
  const calculateCRC = (buffer) => {
    let crc = 0xFFFF;
    for (let i = 0; i < buffer.length; i++) {
      crc ^= buffer[i];
      for (let j = 0; j < 8; j++) {
        if (crc & 0x0001) {
          crc = (crc >> 1) ^ 0xA001;
        } else {
          crc >>= 1;
        }
      }
    }
    return crc;
  };

  // Build Modbus RTU frame
  const buildFrame = (slave, functionCode, data) => {
    const frameLength = 2 + data.length + 2;
    const frame = new Uint8Array(frameLength);
    
    frame[0] = slave;
    frame[1] = functionCode;
    frame.set(data, 2);
    
    const crc = calculateCRC(frame.slice(0, -2));
    frame[frameLength - 2] = crc & 0xFF;
    frame[frameLength - 1] = (crc >> 8) & 0xFF;
    
    return frame;
  };

  // Verify CRC
  const verifyCRC = (frame) => {
    if (frame.length < 4) return false;
    const data = frame.slice(0, -2);
    const receivedCRC = frame[frame.length - 2] | (frame[frame.length - 1] << 8);
    const calculatedCRC = calculateCRC(data);
    return receivedCRC === calculatedCRC;
  };

  if (window.HardwareDrivers) {
    window.HardwareDrivers.register({
      name: 'modbus-rtu',
      type: 'webapi',
      version: '1.0.0',

      // Detect if Web Serial API available
      detect: async () => {
        return 'serial' in navigator;
      },

      // Connect to Modbus device
      connect: async (options = {}) => {
        const baudRate = options.baudRate || 9600;
        const parity = options.parity || 'none';
        slaveId = options.slaveId || 1;
        timeout = options.timeout || 1000;
        
        if (slaveId < 1 || slaveId > 247) {
          throw new Error('Slave ID must be between 1 and 247');
        }
        
        currentPort = await navigator.serial.requestPort();
        await currentPort.open({
          baudRate: baudRate,
          dataBits: 8,
          stopBits: 1,
          parity: parity,
          flowControl: 'none'
        });
        
        console.log('[Modbus RTU] Connected:', {
          baudRate,
          parity,
          slaveId,
          timeout: `${timeout}ms`
        });
        
        return currentPort;
      },

      // Disconnect
      disconnect: async () => {
        if (reader) {
          await reader.cancel();
          reader = null;
        }
        if (currentPort) {
          await currentPort.close();
          currentPort = null;
        }
        console.log('[Modbus RTU] Disconnected');
      },

      // Read holding registers (FC 0x03) - Simple test function
      read: async (options = {}) => {
        if (!currentPort) throw new Error('Port not connected');
        
        const address = options.address || 0;
        const quantity = options.quantity || 1;
        
        if (quantity < 1 || quantity > 125) {
          throw new Error('Quantity must be between 1 and 125');
        }
        
        // Build request frame
        const data = new Uint8Array(4);
        data[0] = (address >> 8) & 0xFF;
        data[1] = address & 0xFF;
        data[2] = (quantity >> 8) & 0xFF;
        data[3] = quantity & 0xFF;
        
        const frame = buildFrame(slaveId, 0x03, data);
        
        // Send request
        const writer = currentPort.writable.getWriter();
        await writer.write(frame);
        writer.releaseLock();
        
        // Read response
        return new Promise((resolve, reject) => {
          const responseBuffer = [];
          let timeoutId;
          
          const readResponse = async () => {
            try {
              reader = currentPort.readable.getReader();
              
              while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                responseBuffer.push(...value);
                
                // Check if response is complete
                if (responseBuffer.length >= 5) {
                  const byteCount = responseBuffer[2];
                  if (responseBuffer.length >= 3 + byteCount + 2) {
                    clearTimeout(timeoutId);
                    reader.releaseLock();
                    reader = null;
                    
                    const response = new Uint8Array(responseBuffer);
                    
                    if (!verifyCRC(response)) {
                      return reject(new Error('CRC check failed'));
                    }
                    
                    // Check for exception
                    if (response[1] & 0x80) {
                      const exceptionCode = response[2];
                      return reject(new Error(`Modbus Exception: 0x${exceptionCode.toString(16)}`));
                    }
                    
                    // Parse registers
                    const registers = [];
                    for (let i = 0; i < byteCount; i += 2) {
                      registers.push((response[3 + i] << 8) | response[4 + i]);
                    }
                    
                    return resolve({
                      success: true,
                      registers: registers,
                      raw: Array.from(response)
                    });
                  }
                }
              }
            } catch (err) {
              clearTimeout(timeoutId);
              if (reader) {
                reader.releaseLock();
                reader = null;
              }
              reject(err);
            }
          };
          
          timeoutId = setTimeout(() => {
            if (reader) {
              reader.cancel();
              reader.releaseLock();
              reader = null;
            }
            reject(new Error('Modbus request timeout'));
          }, timeout);
          
          readResponse();
        });
      },

      // Write single register (FC 0x06) - Simple test function
      write: async (options = {}) => {
        if (!currentPort) throw new Error('Port not connected');
        
        const address = options.address || 0;
        const value = options.value || 0;
        
        if (value < 0 || value > 0xFFFF) {
          throw new Error('Value must be between 0 and 65535');
        }
        
        // Build request frame
        const data = new Uint8Array(4);
        data[0] = (address >> 8) & 0xFF;
        data[1] = address & 0xFF;
        data[2] = (value >> 8) & 0xFF;
        data[3] = value & 0xFF;
        
        const frame = buildFrame(slaveId, 0x06, data);
        
        // Send request
        const writer = currentPort.writable.getWriter();
        await writer.write(frame);
        writer.releaseLock();
        
        // Read echo response
        return new Promise((resolve, reject) => {
          const responseBuffer = [];
          let timeoutId;
          
          const readResponse = async () => {
            try {
              reader = currentPort.readable.getReader();
              
              while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                responseBuffer.push(...value);
                
                // Response should be 8 bytes (echo)
                if (responseBuffer.length >= 8) {
                  clearTimeout(timeoutId);
                  reader.releaseLock();
                  reader = null;
                  
                  const response = new Uint8Array(responseBuffer);
                  
                  if (!verifyCRC(response)) {
                    return reject(new Error('CRC check failed'));
                  }
                  
                  // Check for exception
                  if (response[1] & 0x80) {
                    const exceptionCode = response[2];
                    return reject(new Error(`Modbus Exception: 0x${exceptionCode.toString(16)}`));
                  }
                  
                  return resolve({
                    success: true,
                    address: (response[2] << 8) | response[3],
                    value: (response[4] << 8) | response[5]
                  });
                }
              }
            } catch (err) {
              clearTimeout(timeoutId);
              if (reader) {
                reader.releaseLock();
                reader = null;
              }
              reject(err);
            }
          };
          
          timeoutId = setTimeout(() => {
            if (reader) {
              reader.cancel();
              reader.releaseLock();
              reader = null;
            }
            reject(new Error('Modbus request timeout'));
          }, timeout);
          
          readResponse();
        });
      },

      // Custom methods
      methods: {
        getSlaveId: () => slaveId,
        
        setSlaveId: (id) => {
          if (id < 1 || id > 247) {
            throw new Error('Slave ID must be between 1 and 247');
          }
          slaveId = id;
          console.log(`[Modbus RTU] Slave ID set to ${id}`);
        },
        
        getTimeout: () => timeout,
        
        setTimeout: (ms) => {
          timeout = ms;
          console.log(`[Modbus RTU] Timeout set to ${ms}ms`);
        },
        
        getPortInfo: () => {
          if (!currentPort) return null;
          return currentPort.getInfo();
        },
        
        // Quick connection test (read 1 register from address 0)
        testConnection: async () => {
          try {
            const result = await window.HardwareDrivers.read('modbus-rtu', {
              address: 0,
              quantity: 1
            });
            console.log('[Modbus RTU] Connection test passed:', result);
            return { success: true, data: result };
          } catch (error) {
            console.error('[Modbus RTU] Connection test failed:', error);
            return { success: false, error: error.message };
          }
        }
      },

      // No REST fallback for Modbus (direct hardware only)
      fallback: null
    });

    console.log('[Modbus RTU] Driver registered with HAL');
  }

})();