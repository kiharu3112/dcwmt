import { Map as BaseMap, View } from "ol";
import * as olExtent from "ol/extent";
import * as olProj from "ol/proj";
import { register } from "ol/proj/proj4";
import { createXYZ } from "ol/tilegrid";
import proj4 from "proj4";

import type { LayerTypes } from "@/dcmwtconfType";
import type { LayerController } from "@/modules/layer/LayerController";
import type { LayerProjection } from "@/modules/layer/lib/layerProjection";
import type { Coordinate } from "ol/coordinate";
import type TileGrid from "ol/tilegrid/TileGrid";
import { type ProjCodes, projections } from "../../../components/DrawerContents/Drawer-figure/projection_lib";
import type { ViewerInterface } from "./ViewerInterface";

export class ViewerProjection extends BaseMap implements ViewerInterface {
  constructor(
    mapEl: HTMLDivElement,
    private readonly projCode: ProjCodes,
    zoomNativeLevel: { min: number; max: number },
    zoom: number,
    center: [number, number],
  ) {
    super({ target: mapEl, layers: new Array<LayerProjection>() });
    const projection = this.createProjection(this.projCode);

    const tileGrid = createXYZ({
      extent: projection.getExtent(),
      maxZoom: zoomNativeLevel.max,
      minZoom: zoomNativeLevel.min,
    });

    const view = this.createView(projection, tileGrid, zoom, center, zoomNativeLevel);

    this.setView(view);
  }

  private createProjection = (projCode: olProj.ProjectionLike) => {
    const getProjection = olProj.get;

    // Register prepared projections
    for (const projection of projections) {
      if (!projection.proj4) {
        continue;
      }
      proj4.defs(projection.code, projection.proj4);
    }
    register(proj4);

    // Get projection for using now.
    const projection = getProjection(projCode);
    if (!projection) {
      throw new Error("Passed projection is undefined title.");
    }

    // Register extent of projection.
    const purposeProj = projections.find((p) => p.code.includes(projCode as string));
    if (!purposeProj) {
      throw new Error("Passed projection is undefined title.");
    }
    const extent = purposeProj.extent || projection.getExtent();
    projection.setExtent(extent);

    return projection;
  };

  private createView = (
    projection: olProj.Projection,
    tileGrid: TileGrid,
    zoom: number,
    center: [number, number],
    zoomNativeLevel: { min: number; max: number },
  ) => {
    const getCenter = olExtent.getCenter;

    return new View({
      projection: projection,
      resolution: tileGrid.getResolution(zoom || zoomNativeLevel.min),
      resolutions: tileGrid.getResolutions(),
      center: center || getCenter(projection.getExtent() || [0, 0, 0, 0]),
      multiWorld: true,
    });
  };

  public register = (layerController: LayerController) => {
    const layerAry = layerController.get() as LayerProjection[];
    for (const layer of layerAry) {
      this.addLayer(layer);
    }
  };

  public set renderingCompleted(eventListener: () => void) {
    this.on("rendercomplete", eventListener);
  }

  public updateLayers = (layers: LayerTypes[]) => {
    //@ts-ignore
    const baseLayers: LayerProjection[] = this.getLayers().getArray();
    if (baseLayers.length !== layers.length) {
      return;
    }
    for (let i = 0; i < baseLayers.length; i++) {
      const layer = layers[i];
      // [TODO] layer id で切り替え
      if (baseLayers[i].name === layer.name) {
        if (baseLayers[i].show !== layer.show) {
          baseLayers[i].show = layer.show;
          break;
        }
        if (baseLayers[i].opacity !== layer.opacity) {
          baseLayers[i].opacity = layer.opacity;
          break;
        }
        if (layer.type === "tone") {
          if (baseLayers[i].colorIndex !== layer.clrindex) {
            baseLayers[i].colorIndex = layer.clrindex;
            break;
          }
        } else if (layer.type === "contour") {
          if (baseLayers[i].thresholdInterval !== layer.thretholdinterval) {
            baseLayers[i].thresholdInterval = layer.thretholdinterval;
            break;
          }
        } else if (layer.type === "vector") {
          if (
            baseLayers[i].vectorInterval.x !== layer.vecinterval.x ||
            baseLayers[i].vectorInterval.y !== layer.vecinterval.y
          ) {
            baseLayers[i].vectorInterval = layer.vecinterval;
            break;
          }
        }
      } else {
        const j = baseLayers.map((l) => l.name).indexOf(layer.name);
        const updateLayer = baseLayers[i];
        if (i < j) {
          this.raise(updateLayer);
        } else {
          this.lower(updateLayer);
        }
        break;
      }
    }
  };

  public changeFixed = (fixed: string) => {
    const baseLayer = this.getLayers().getArray() as LayerProjection[];
    const lenOfLayers = baseLayer.length;
    if (lenOfLayers === 0) return;
    const lastLayer = baseLayer[lenOfLayers - 1];
    lastLayer.fixed = fixed;
    lastLayer.getSource()?.refresh();
  };

  private lower(layer: LayerProjection) {
    const layers = this.getLayers();
    const layersAry = layers.getArray();
    for (let i = 0; i < layers.getLength(); i++) {
      if (i > 0 && (layersAry[i] as LayerProjection).name === layer.name) {
        layers.remove(layer);
        layers.insertAt(i - 1, layer);
        break;
      }
    }
    this.setLayers(layers);
  }

  private raise(layer: LayerProjection) {
    const layers = this.getLayers();
    const layersAry = layers.getArray();
    const maxIndex = layers.getLength() - 1;
    for (let i = 0; i < layers.getLength(); i++) {
      if (i < maxIndex && (layersAry[i] as LayerProjection).name === layer.name) {
        layers.remove(layer);
        layers.insertAt(i + 1, layer);
        break;
      }
    }
    this.setLayers(layers);
  }

  get zoom(): number {
    const zoom = this.getView().getZoom();
    if (zoom === undefined) {
      throw new Error("zoom is undefined");
    }
    return zoom;
  }
  set zoom(value: number) {
    this.getView().setZoom(value);
  }

  get center(): [number, number] {
    const center = this.getView().getCenter();
    if (!center) {
      throw new Error("center is undefined");
    }
    return center as [number, number];
  }
  set center(value: [number, number]) {
    this.getView().setCenter(value as Coordinate);
  }
}
