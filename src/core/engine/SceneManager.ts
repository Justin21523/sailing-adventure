/**
 * SceneManager.ts
 * Three.js 場景圖層管理器。將場景劃分為靜態、動態、特效與 3D UI 層，以優化視錐體剔除與矩陣更新。
 * 內建物件池 (Object Pooling) 機制，避免頻繁實例化/銷毀幾何體引發的記憶體抖動與 GC 停頓。
 */

import * as THREE from 'three';

export enum SceneLayerType {
  STATIC = 'STATIC',      // 島嶼、海底地形 (極少更新矩陣)
  DYNAMIC = 'DYNAMIC',    // 帆船、NPC、漂浮物
  EFFECTS = 'EFFECTS',    // 粒子系統、海浪飛沫
  UI_3D = 'UI_3D'         // 空間中的 3D 標記、傷害數字
}

export interface SceneLayers {
  [SceneLayerType.STATIC]: THREE.Group;
  [SceneLayerType.DYNAMIC]: THREE.Group;
  [SceneLayerType.EFFECTS]: THREE.Group;
  [SceneLayerType.UI_3D]: THREE.Group;
}

export class SceneManager {
  public readonly scene: THREE.Scene;
  public readonly layers: SceneLayers;
  
  private pool: Map<string, THREE.Object3D[]> = new Map();

  constructor(scene?: THREE.Scene) {
    this.scene = scene || new THREE.Scene();
    
    this.layers = {
      [SceneLayerType.STATIC]: this.createLayer('LAYER_STATIC'),
      [SceneLayerType.DYNAMIC]: this.createLayer('LAYER_DYNAMIC'),
      [SceneLayerType.EFFECTS]: this.createLayer('LAYER_EFFECTS'),
      [SceneLayerType.UI_3D]: this.createLayer('LAYER_UI_3D'),
    };

    this.scene.add(this.layers[SceneLayerType.STATIC]);
    this.scene.add(this.layers[SceneLayerType.DYNAMIC]);
    this.scene.add(this.layers[SceneLayerType.EFFECTS]);
    this.scene.add(this.layers[SceneLayerType.UI_3D]);

    // 預設海洋環境設定 (指數霧氣模擬海平面能見度)
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.0015);
    this.scene.background = new THREE.Color(0x87ceeb);
  }

  private createLayer(name: string): THREE.Group {
    const group = new THREE.Group();
    group.name = name;
    return group;
  }

  public addToLayer(layer: SceneLayerType, object: THREE.Object3D): void {
    this.layers[layer].add(object);
  }

  public removeFromLayer(layer: SceneLayerType, object: THREE.Object3D): void {
    this.layers[layer].remove(object);
  }

  /**
   * 將物件回收到物件池，隱藏並從場景圖移除
   */
  public addToPool(category: string, object: THREE.Object3D): void {
    object.visible = false;
    object.removeFromParent();
    const existing = this.pool.get(category);
    if (existing) {
      existing.push(object);
    } else {
      this.pool.set(category, [object]);
    }
  }

  /**
   * 從物件池獲取物件，若池為空則透過工廠函數生成新物件
   */
  public acquireFromPool(category: string, fallbackFactory: () => THREE.Object3D): THREE.Object3D {
    const existing = this.pool.get(category);
    if (existing && existing.length > 0) {
      const obj = existing.pop()!;
      obj.visible = true;
      return obj;
    }
    return fallbackFactory();
  }

  public setFog(color: THREE.ColorRepresentation, density: number): void {
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.set(color);
      this.scene.fog.density = density;
    } else {
      this.scene.fog = new THREE.FogExp2(color, density);
    }
  }

  public setBackgroundColor(color: THREE.ColorRepresentation): void {
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.set(color);
    } else {
      this.scene.background = new THREE.Color(color);
    }
  }

  /**
   * 清空指定圖層並強制釋放 GPU 記憶體 (Geometry / Material)
   */
  public clearLayer(layer: SceneLayerType): void {
    const group = this.layers[layer];
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      
      // 遞迴釋放幾何體與材質
      child.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          if (node.geometry) {
            node.geometry.dispose();
          }
          if (Array.isArray(node.material)) {
            node.material.forEach((m) => m.dispose());
          } else if (node.material) {
            node.material.dispose();
          }
        }
      });
    }
  }

  public dispose(): void {
    this.clearLayer(SceneLayerType.STATIC);
    this.clearLayer(SceneLayerType.DYNAMIC);
    this.clearLayer(SceneLayerType.EFFECTS);
    this.clearLayer(SceneLayerType.UI_3D);
    this.pool.clear();
  }
}