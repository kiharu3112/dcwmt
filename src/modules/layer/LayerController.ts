import type { ProjCodes } from "../../components/DrawerContents/Drawer-figure/projection_lib";
import { WmtsLibIdentifer } from "../utility/wmtsLibIdentifer";

import { Layer3D } from "./lib/layer3D";
import { LayerProjection } from "./lib/layerProjection";

import type { DiagramTypes } from "../../dcmwtconfType";
import { ContourDiagram } from "./diagram/counterDiagram";
import type { Diagram } from "./diagram/diagram";
import { ToneDiagram } from "./diagram/toneDiagram";
import { VectorDiagram } from "./diagram/vectorDiagram";

import Graticule from "ol/layer/Graticule";
import Stroke from "ol/style/Stroke";

export class LayerController {
  private readonly wli: WmtsLibIdentifer;
  private readonly bundler: (Layer3D | LayerProjection)[];

  constructor(
    private readonly rootUrl: string,
    private readonly projCode: ProjCodes,
  ) {
    if (this.projCode === "XY") {
      this.wli = new WmtsLibIdentifer("Projections");
      this.bundler = new Array<LayerProjection>();
    } else if (this.projCode === "3d Sphere") {
      this.wli = new WmtsLibIdentifer("3d Sphere");
      this.bundler = new Array<Layer3D>();
    } else {
      this.wli = new WmtsLibIdentifer("Projections");
      this.bundler = new Array<LayerProjection>();
    }
  }

  public create = async (
    type: DiagramTypes,
    name: string,
    url_ary: string[],
    fixed: string,
    tileSize: { x: number; y: number },
    zoomLevel: { min: number; max: number },
    mathMethod: (x: number) => number,
    show: boolean,
    opacity: number,
    minmax: [number, number] | undefined,
    diagramProp: number | { x: number; y: number },
  ) => {
    let diagramObj: Diagram;
    let updatedMinMax = minmax;
    if (type === "tone") {
      const clrindex = diagramProp as number;
      diagramObj = new ToneDiagram(clrindex, mathMethod, minmax);
      const temp_url_ary = url_ary.map((v) => v.concat(`/${fixed}`));
      updatedMinMax = await this.getMinMax(temp_url_ary, tileSize, diagramObj);
    } else if (type === "contour") {
      const thretholdinterval = diagramProp as number;
      diagramObj = new ContourDiagram(thretholdinterval, mathMethod, minmax);
      const temp_url_ary = url_ary.map((v) => v.concat(`/${fixed}`));
      updatedMinMax = await this.getMinMax(temp_url_ary, tileSize, diagramObj);
    } else {
      const vecinterval = diagramProp as { x: number; y: number };
      diagramObj = new VectorDiagram(vecinterval, mathMethod);
    }
    const layer = this.getLayerWithSuitableLib(name, url_ary, fixed, tileSize, zoomLevel, show, opacity, diagramObj);
    layer.minmax = updatedMinMax;

    return layer;
  };

  public graticule = (extent: [number, number, number, number]) => {
    console.log(extent);
    const lonLabelFormatter = (n: number): string => {
      return n.toString();
    };
    const latLabelFormatter = (n: number): string => {
      return n.toString();
    };
    const projections = () =>
      new Graticule({
        strokeStyle: new Stroke({
          color: "rgba(0, 255, 0, 0.9)",
          width: 3,
          lineDash: [0.5, 4],
        }),
        showLabels: true,
        lonLabelFormatter: lonLabelFormatter,
        latLabelFormatter: latLabelFormatter,
      });
    const sphere = () =>
      new Graticule({
        strokeStyle: new Stroke({
          color: "rgba(0, 255, 0, 0.9)",
          width: 3,
          lineDash: [0.5, 4],
        }),
        showLabels: true,
        lonLabelFormatter: lonLabelFormatter,
        latLabelFormatter: latLabelFormatter,
      });
    const suitableFunc = this.wli.whichLib(projections, sphere);
    return suitableFunc();
  };

  private getMinMax = async (url_ary: string[], tileSize: { x: number; y: number }, diagramObj: Diagram) => {
    const level0Url = url_ary.map((url) => `${this.rootUrl}/${url}/0/0/0.png`);
    const canvas = document.createElement("canvas");
    // @ts-ignore
    canvas.width = tileSize[0];
    // @ts-ignore
    canvas.height = tileSize[1];
    return await diagramObj.calcMinMax(level0Url, canvas);
  };

  public add = (layer: Layer3D | LayerProjection) => {
    return this.bundler.push(layer);
  };

  public get = () => {
    return this.bundler;
  };

  private getLayerWithSuitableLib = (
    name: string,
    url_ary: string[],
    fixed: string,
    tileSize: { x: number; y: number },
    zoomLevel: { min: number; max: number },
    show: boolean,
    opacity: number,
    diagramObj: Diagram,
  ): Layer3D | LayerProjection => {
    const props = [name, url_ary, fixed, tileSize, zoomLevel, show, opacity, diagramObj] as const;
    const sphere = () => new Layer3D(...props);
    const projections = () => new LayerProjection(...props);
    const suitableFunc = this.wli.whichLib(sphere, projections);

    return suitableFunc();
  };
}
