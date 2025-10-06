/**
 * Layout calculation utilities for button positioning
 * Handles optimal arrangement of circular buttons on rectangular pages
 */

import { ButtonArea } from '@/models/ButtonArea';

export interface PageDimensions {
  width: number;
  height: number;
}

export interface LayoutGrid {
  rows: number;
  cols: number;
  cellWidth: number;
  cellHeight: number;
  spacing: {
    horizontal: number;
    vertical: number;
  };
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface ButtonPosition {
  x: number;
  y: number;
  row: number;
  col: number;
}

export interface LayoutOptimization {
  totalButtons: number;
  efficiency: number; // 0-1, percentage of page area used
  wastedSpace: number; // square inches
  recommendations: string[];
}

export class LayoutCalculator {
  /**
   * Calculate optimal grid layout for buttons on a page
   */
  static calculateOptimalGrid(
    pageSize: PageDimensions,
    buttonDiameter: number,
    minSpacing: number = 0.125,
    margins: { top: number; right: number; bottom: number; left: number } =
      { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 }
  ): LayoutGrid {
    // Calculate usable area
    const usableWidth = pageSize.width - margins.left - margins.right;
    const usableHeight = pageSize.height - margins.top - margins.bottom;

    // Calculate maximum number of buttons that fit
    const buttonWithMinSpacing = buttonDiameter + minSpacing;

    const maxCols = Math.floor(usableWidth / buttonWithMinSpacing);
    const maxRows = Math.floor(usableHeight / buttonWithMinSpacing);

    // Calculate actual spacing to center the grid
    const actualHorizontalSpacing = maxCols > 1 ?
      (usableWidth - (maxCols * buttonDiameter)) / (maxCols - 1) :
      usableWidth - buttonDiameter;

    const actualVerticalSpacing = maxRows > 1 ?
      (usableHeight - (maxRows * buttonDiameter)) / (maxRows - 1) :
      usableHeight - buttonDiameter;

    const cellWidth = buttonDiameter + (maxCols > 1 ? actualHorizontalSpacing : 0);
    const cellHeight = buttonDiameter + (maxRows > 1 ? actualVerticalSpacing : 0);

    return {
      rows: maxRows,
      cols: maxCols,
      cellWidth,
      cellHeight,
      spacing: {
        horizontal: actualHorizontalSpacing,
        vertical: actualVerticalSpacing
      },
      margins
    };
  }

  /**
   * Generate positions for buttons in a grid layout
   */
  static generateGridPositions(
    grid: LayoutGrid,
    buttonCount: number,
    _pageSize: PageDimensions
  ): ButtonPosition[] {
    const positions: ButtonPosition[] = [];

    // Calculate starting position (top-left of first button center)
    const startX = grid.margins.left + (grid.cellWidth / 2);
    const startY = grid.margins.top + (grid.cellHeight / 2);

    let buttonIndex = 0;

    for (let row = 0; row < grid.rows && buttonIndex < buttonCount; row++) {
      for (let col = 0; col < grid.cols && buttonIndex < buttonCount; col++) {
        const x = startX + (col * grid.cellWidth);
        const y = startY + (row * grid.cellHeight);

        positions.push({
          x,
          y,
          row,
          col
        });

        buttonIndex++;
      }
    }

    return positions;
  }

  /**
   * Auto-arrange existing button areas in optimal grid
   */
  static autoArrangeButtons(
    buttonAreas: ButtonArea[],
    pageSize: PageDimensions,
    _preserveImages: boolean = true
  ): ButtonArea[] {
    if (buttonAreas.length === 0) return [];

    // Calculate average button diameter or use default
    const avgDiameter = buttonAreas.reduce((sum, ba) => sum + ba.diameter, 0) / buttonAreas.length || 2.75;

    const grid = this.calculateOptimalGrid(pageSize, avgDiameter);
    const positions = this.generateGridPositions(grid, buttonAreas.length, pageSize);

    return buttonAreas.map((buttonArea, index) => {
      const position = positions[index];
      if (!position) return buttonArea; // No position available

      const updatedData = { ...buttonArea.toData() };
      updatedData.x = position.x;
      updatedData.y = position.y;
      updatedData.diameter = avgDiameter;

      return ButtonArea.fromData(updatedData);
    });
  }

  /**
   * Calculate layout efficiency and optimization suggestions
   */
  static analyzeLayout(
    buttonAreas: ButtonArea[],
    pageSize: PageDimensions
  ): LayoutOptimization {
    const pageArea = pageSize.width * pageSize.height;

    // Calculate total area used by buttons
    const totalButtonArea = buttonAreas.reduce((sum, ba) => {
      const radius = ba.diameter / 2;
      return sum + (Math.PI * radius * radius);
    }, 0);

    const efficiency = totalButtonArea / pageArea;
    const wastedSpace = pageArea - totalButtonArea;

    const recommendations: string[] = [];

    // Efficiency recommendations
    if (efficiency < 0.3) {
      recommendations.push('Layout efficiency is low. Consider adding more buttons or increasing button size.');
    } else if (efficiency > 0.8) {
      recommendations.push('Layout is very dense. Consider reducing button count or size for better print quality.');
    }

    // Check for overlaps
    const overlaps = this.findOverlappingButtons(buttonAreas);
    if (overlaps.length > 0) {
      recommendations.push(`${overlaps.length} button pairs overlap. Use auto-arrange to fix spacing.`);
    }

    // Check bounds
    const outOfBounds = buttonAreas.filter(ba => !ba.fitsInPage(pageSize.width, pageSize.height));
    if (outOfBounds.length > 0) {
      recommendations.push(`${outOfBounds.length} buttons extend beyond page boundaries.`);
    }

    // Optimal button count suggestion
    const optimalGrid = this.calculateOptimalGrid(pageSize, 2.75);
    const optimalCount = optimalGrid.rows * optimalGrid.cols;

    if (buttonAreas.length > optimalCount) {
      recommendations.push(`Consider reducing to ${optimalCount} buttons for optimal 2.75" layout.`);
    }

    return {
      totalButtons: buttonAreas.length,
      efficiency,
      wastedSpace,
      recommendations
    };
  }

  /**
   * Find pairs of overlapping buttons
   */
  static findOverlappingButtons(buttonAreas: ButtonArea[]): Array<[ButtonArea, ButtonArea]> {
    const overlaps: Array<[ButtonArea, ButtonArea]> = [];

    for (let i = 0; i < buttonAreas.length; i++) {
      for (let j = i + 1; j < buttonAreas.length; j++) {
        if (buttonAreas[i].overlaps(buttonAreas[j])) {
          overlaps.push([buttonAreas[i], buttonAreas[j]]);
        }
      }
    }

    return overlaps;
  }

  /**
   * Calculate minimum spacing needed between buttons
   */
  static calculateMinimumSpacing(_buttonDiameter: number, printQuality: 'draft' | 'standard' | 'high' = 'standard'): number {
    const baseSpacing = 0.125; // 1/8 inch minimum

    switch (printQuality) {
      case 'draft':
        return baseSpacing * 0.5;
      case 'standard':
        return baseSpacing;
      case 'high':
        return baseSpacing * 1.5;
      default:
        return baseSpacing;
    }
  }

  /**
   * Optimize button sizes to fit more on page while maintaining quality
   */
  static optimizeButtonSizes(
    targetButtonCount: number,
    pageSize: PageDimensions,
    minButtonSize: number = 0.5,
    maxButtonSize: number = 4.0
  ): { diameter: number; canFit: boolean; grid: LayoutGrid } {
    // Binary search for optimal button size
    let low = minButtonSize;
    let high = maxButtonSize;
    let bestFit: { diameter: number; canFit: boolean; grid: LayoutGrid } = {
      diameter: minButtonSize,
      canFit: false,
      grid: this.calculateOptimalGrid(pageSize, minButtonSize)
    };

    while (high - low > 0.01) {
      const mid = (low + high) / 2;
      const grid = this.calculateOptimalGrid(pageSize, mid);
      const capacity = grid.rows * grid.cols;

      if (capacity >= targetButtonCount) {
        bestFit = { diameter: mid, canFit: true, grid };
        low = mid; // Try larger size
      } else {
        high = mid; // Try smaller size
      }
    }

    return bestFit;
  }

  /**
   * Generate evenly spaced button positions for circular/radial layout
   */
  static generateRadialLayout(
    centerX: number,
    centerY: number,
    radius: number,
    buttonCount: number,
    startAngle: number = 0
  ): ButtonPosition[] {
    const positions: ButtonPosition[] = [];
    const angleStep = (2 * Math.PI) / buttonCount;

    for (let i = 0; i < buttonCount; i++) {
      const angle = startAngle + (i * angleStep);
      const x = centerX + (radius * Math.cos(angle));
      const y = centerY + (radius * Math.sin(angle));

      positions.push({
        x,
        y,
        row: 0,
        col: i
      });
    }

    return positions;
  }

  /**
   * Create spiral layout for artistic arrangements
   */
  static generateSpiralLayout(
    centerX: number,
    centerY: number,
    initialRadius: number,
    radiusGrowth: number,
    buttonCount: number
  ): ButtonPosition[] {
    const positions: ButtonPosition[] = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // Golden angle in radians

    for (let i = 0; i < buttonCount; i++) {
      const angle = i * goldenAngle;
      const radius = initialRadius + (radiusGrowth * Math.sqrt(i));

      const x = centerX + (radius * Math.cos(angle));
      const y = centerY + (radius * Math.sin(angle));

      positions.push({
        x,
        y,
        row: Math.floor(i / 10), // Approximate row for organization
        col: i % 10
      });
    }

    return positions;
  }

  /**
   * Calculate safe zones and margins for professional printing
   */
  static calculatePrintSafeZones(
    pageSize: PageDimensions,
    bleedSize: number = 0.125,
    safeMargin: number = 0.25
  ): {
    bleedZone: PageDimensions;
    safeZone: PageDimensions;
    printableArea: PageDimensions;
  } {
    const bleedZone = {
      width: pageSize.width + (bleedSize * 2),
      height: pageSize.height + (bleedSize * 2)
    };

    const safeZone = {
      width: pageSize.width - (safeMargin * 2),
      height: pageSize.height - (safeMargin * 2)
    };

    const printableArea = {
      width: pageSize.width - 0.5, // Typical printer margin
      height: pageSize.height - 0.5
    };

    return {
      bleedZone,
      safeZone,
      printableArea
    };
  }
}