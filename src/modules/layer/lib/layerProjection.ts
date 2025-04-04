import type { ImageTile } from 'ol';
import type Tile from 'ol/Tile';
import type { LoadFunction, UrlFunction } from 'ol/Tile';
import TileLayer from 'ol/layer/Tile';
import { get } from 'ol/proj';
import XYZ, { type Options } from 'ol/source/XYZ';
import type { TileCoord } from 'ol/tilecoord';
import { createXYZ } from 'ol/tilegrid';
import type { Diagram } from '../diagram/diagram';
import type { LayerInterface } from './LayerInterface';

export class LayerProjection extends TileLayer<XYZ> implements LayerInterface {
  public minmax: [number, number] | undefined;

  constructor(
    public readonly name: string,
    private readonly urls: string[],
    public fixed: string,
    private readonly tileSize: { x: number; y: number },
    zoomLevel: { min: number; max: number },
    show: boolean,
    opacity: number,
    private readonly diagram: Diagram
  ) {
    super({
      visible: show,
      opacity: opacity,
    });

    const projection = get('EPSG:3857');

    if (!projection) {
      throw new Error('projection is null');
    }

    const defaultTileGrid = createXYZ({
      extent: projection.getExtent(),
      minZoom: zoomLevel.min,
      maxZoom: zoomLevel.max,
      //@ts-ignore
      tileSize: this.tileSize,
    });

    const xyz_options: Options = {
      url: '',
      tileUrlFunction: this.tileUrlFunction,
      tileLoadFunction: this.tileLoadFunction,
      tileGrid: defaultTileGrid,
      crossOrigin: 'Anonymous',
      wrapX: true,
    };
    const xyz = new XYZ(xyz_options);

    this.setExtent(projection.getExtent());
    this.setSource(xyz);
  }

  private tileUrlFunction: UrlFunction = (coord: TileCoord) => {
    const [Z, X, Y] = [0, 1, 2];
    return `/${this.fixed}/${coord[Z]}/${coord[X]}/${coord[Y]}.png`;
  };

  private tileLoadFunction: LoadFunction = async (
    imageTile: Tile,
    url: string
  ) => {
    const canvas = document.createElement('canvas');
    // @ts-ignore
    [canvas.width, canvas.height] = this.tileSize;
    const url_ary = this.urls.map((v) => v.concat(url));
    const drawnCanvas = await this.diagram.draw(url_ary, canvas);
    const image = (imageTile as ImageTile).getImage() as HTMLImageElement;
    image.src = drawnCanvas.toDataURL();
  };

  set opacity(value: number) {
    this.setOpacity(value);
  }
  get opacity(): number {
    return this.getOpacity();
  }

  set show(value: boolean) {
    this.setVisible(value);
  }
  get show(): boolean {
    return this.getVisible();
  }

  set colorIndex(value: number) {
    if (!this.diagram.colorIndex) {
      throw new Error("Shouldn't adapt to this layer");
    }
    //@ts-ignore
    this.diagram.changeColorMap(value);
    const source = this.getSource();
    source?.refresh();
  }
  get colorIndex() {
    if (!this.diagram.colorIndex) {
      throw new Error("Shouldn't call to this layer");
    }
    return this.diagram.colorIndex;
  }

  set thresholdInterval(value: number) {
    if (!this.diagram.thresholdInterval) {
      throw new Error("Shouldn't call to this layer");
    }
    this.diagram.thresholdInterval = value;
    const source = this.getSource();
    source?.refresh();
  }
  get thresholdInterval() {
    if (!this.diagram.thresholdInterval) {
      throw new Error("Shouldn't call to this layer");
    }
    return this.diagram.thresholdInterval;
  }

  set vectorInterval(value: { x: number; y: number }) {
    if (!this.diagram.vectorInterval) {
      throw new Error("Shouldn't call to this layer");
    }
    this.diagram.vectorInterval = value;
    const source = this.getSource();
    source?.refresh();
  }
  get vectorInterval() {
    if (!this.diagram.vectorInterval) {
      throw new Error("Shouldn't call to this layer");
    }
    return this.diagram.vectorInterval;
  }
}
