import * as robot from '@jitsi/robotjs';

export interface AutomationCommand {
  type: 'mouse_move' | 'mouse_click' | 'keyboard_type' | 'keyboard_press' | 'screenshot' | 'get_mouse_pos' | 'get_screen_size';
  params?: any;
}

export class AutomationService {
  constructor() {
    // Configure robot.js
    robot.setMouseDelay(2);
    robot.setKeyboardDelay(10);
  }

  async executeCommand(command: AutomationCommand): Promise<any> {
    switch (command.type) {
      case 'mouse_move':
        return this.mouseMove(command.params.x, command.params.y);
      
      case 'mouse_click':
        return this.mouseClick(command.params.button || 'left', command.params.double || false);
      
      case 'keyboard_type':
        return this.keyboardType(command.params.text);
      
      case 'keyboard_press':
        return this.keyboardPress(command.params.key, command.params.modifiers);
      
      case 'screenshot':
        return this.takeScreenshot(command.params?.region);
      
      case 'get_mouse_pos':
        return this.getMousePosition();
      
      case 'get_screen_size':
        return this.getScreenSize();
      
      default:
        throw new Error(`Unknown automation command: ${command.type}`);
    }
  }

  private mouseMove(x: number, y: number): { success: boolean } {
    try {
      robot.moveMouse(x, y);
      return { success: true };
    } catch (error) {
      console.error('Mouse move error:', error);
      throw error;
    }
  }

  private mouseClick(button: 'left' | 'right' | 'middle' = 'left', double: boolean = false): { success: boolean } {
    try {
      robot.mouseClick(button, double);
      return { success: true };
    } catch (error) {
      console.error('Mouse click error:', error);
      throw error;
    }
  }

  private keyboardType(text: string): { success: boolean } {
    try {
      robot.typeString(text);
      return { success: true };
    } catch (error) {
      console.error('Keyboard type error:', error);
      throw error;
    }
  }

  private keyboardPress(key: string, modifiers?: string[]): { success: boolean } {
    try {
      if (modifiers && modifiers.length > 0) {
        robot.keyTap(key, modifiers);
      } else {
        robot.keyTap(key);
      }
      return { success: true };
    } catch (error) {
      console.error('Keyboard press error:', error);
      throw error;
    }
  }

  private takeScreenshot(region?: { x: number; y: number; width: number; height: number }): any {
    try {
      if (region) {
        const img = robot.screen.capture(region.x, region.y, region.width, region.height);
        return {
          width: img.width,
          height: img.height,
          image: img.image.toString('base64'),
          colorAt: (x: number, y: number) => robot.getPixelColor(x, y)
        };
      } else {
        const screenSize = robot.getScreenSize();
        const img = robot.screen.capture(0, 0, screenSize.width, screenSize.height);
        return {
          width: img.width,
          height: img.height,
          image: img.image.toString('base64')
        };
      }
    } catch (error) {
      console.error('Screenshot error:', error);
      throw error;
    }
  }

  private getMousePosition(): { x: number; y: number } {
    try {
      const pos = robot.getMousePos();
      return { x: pos.x, y: pos.y };
    } catch (error) {
      console.error('Get mouse position error:', error);
      throw error;
    }
  }

  private getScreenSize(): { width: number; height: number } {
    try {
      const size = robot.getScreenSize();
      return { width: size.width, height: size.height };
    } catch (error) {
      console.error('Get screen size error:', error);
      throw error;
    }
  }

  async testAutomation(): Promise<boolean> {
    try {
      // Test basic automation capabilities
      const pos = this.getMousePosition();
      const size = this.getScreenSize();
      return pos.x >= 0 && pos.y >= 0 && size.width > 0 && size.height > 0;
    } catch (error) {
      console.error('Automation test failed:', error);
      return false;
    }
  }
}
