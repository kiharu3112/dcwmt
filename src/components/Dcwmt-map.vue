<template>
  <div id="main-screen">
    <layerselecter />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import layerselecter from './LayerSelector/Layerselecter.vue';

import type {
  DefinedOptions,
  DrawingOptions,
  LayerTypes,
  Variable,
} from '../dcmwtconfType';
import { LayerController } from '../modules/layer/LayerController';
import { ViewerController } from '../modules/viewer/ViewerController';
import { mapDiv } from '../modules/viewer/map';

export default Vue.extend({
  components: {
    layerselecter,
  },
  computed: {
    drawingOptions: {
      get: function (): DrawingOptions {
        return this.$store.getters.drawingOptions;
      },
      set: function (value: DrawingOptions) {
        this.$store.commit('setDrawingOptions', value);
      },
    },
    definedOptions: function () {
      return this.$store.getters.definedOptions;
    },
    fixedIndex: function (): number | undefined {
      const layers = this.$store.getters.drawingOptions?.layers;
      if (!layers) return layers;
      const lastLayer = layers[layers.length - 1];
      return lastLayer.fixedindex;
    },
    viewerController: {
      get: function () {
        return this.$store.getters.viewerController;
      },
      set: function (value: ViewerController) {
        this.$store.commit('setViewerController', value);
      },
    },
  },
  methods: {
    initialize: async function () {
      const controller = this.createController();
      this.viewerController = controller.viewerController;
      const layerController = controller.layerController;
      await this.draw(this.viewerController, layerController);
    },
    getZoomNativeLevel: (definedOptions: DefinedOptions) => ({
      min: Math.max(...definedOptions.variables.map((v) => v.minZoom)),
      max: Math.min(...definedOptions.variables.map((v) => v.maxZoom)),
    }),
    draw: async function (
      viewerController: ViewerController,
      layerController: LayerController
    ) {
      if (!this.definedOptions) {
        throw new Error('Failed to run read_configfile method.');
      }

      const mapEl = mapDiv.create();
      mapDiv.mount(mapEl);
      const viewer = viewerController.create(mapEl);
      if (!viewer) {
        throw new Error('Failed to create viewer.');
      }
      console.log('drawingOptions.layers: ', this.drawingOptions.layers);
      for (const layerOption of this.drawingOptions.layers) {
        const props = this.createPropsForCreateLayerMethod(
          layerOption,
          this.definedOptions.variables
        );
        const layer = await layerController.create(...props);
        layerController.add(layer);
      }
      viewer.register(layerController);
    },
    createController() {
      if (!this.definedOptions) {
        throw new Error('definedOptions is undefined');
      }
      const zoomNativeLevel = this.getZoomNativeLevel(this.definedOptions);

      const viewerController = new ViewerController(
        this.drawingOptions.projCode,
        zoomNativeLevel,
        this.drawingOptions.zoom,
        this.drawingOptions.center
      );
      const layerController = new LayerController(
        this.definedOptions.root,
        this.drawingOptions.projCode
      );

      return { viewerController, layerController };
    },
    createPropsForCreateLayerMethod(layer: LayerTypes, variables: Variable[]) {
      const variable = variables[layer.varindex];
      console.log('variable is ', variable);
      const fixed = variable.fixed[layer.fixedindex];
      const url_ary = variable.name.map(
        (v) => `${this.definedOptions?.root}/${v}`
      );
      const diagramProps = (() => {
        switch (layer.type) {
          case 'tone':
            return layer.clrindex;
          case 'vector':
            return layer.vecinterval;
          case 'contour':
            return layer.thretholdinterval;
          case 'normal':
            return undefined;
          default:
            return undefined;
        }
      })();

      return [
        layer.type,
        layer.name,
        url_ary,
        fixed,
        variable.tileSize,
        { min: variable.minZoom, max: variable.maxZoom },
        (x: number) => x,
        layer.show,
        layer.opacity,
        layer.minmax ? layer.minmax : undefined,
        diagramProps,
      ] as const;
    },
  },
  watch: {
    drawingOptions: {
      handler: async function (
        newOptions: DrawingOptions,
        oldOptions: DrawingOptions | undefined
      ) {
        if (!oldOptions || newOptions.id !== oldOptions.id) {
          await this.initialize();
        } else if (newOptions.projCode !== oldOptions.projCode) {
          const zoom = Math.round(this.viewerController?.get()?.zoom);
          const center = this.viewerController?.get()?.center;
          if (zoom === undefined || !center) {
            throw new Error('zoom / center is undefined');
          }
          this.drawingOptions = { ...this.drawingOptions, zoom, center };

          const controller = this.createController();
          this.viewerController = controller.viewerController;
          const layerController = controller.layerController;
          await this.draw(this.viewerController, layerController);
        } else {
          const viewer = this.viewerController?.get();
          if (viewer) {
            viewer.updateLayers(newOptions.layers);
          }
        }
      },
      deep: true,
    },
    fixedIndex: function (newIndex: number) {
      const viewer = this.viewerController?.get();
      const layers = this.drawingOptions.layers;
      if (viewer && layers) {
        const lastLayer = layers[layers.length - 1];
        const variable = this.definedOptions?.variables[lastLayer.varindex];
        const fixed = variable.fixed[newIndex];

        viewer.changeFixed(fixed);
      }
    },
  },
});
</script>

<style scoped>
div#main-screen {
  height: 100%;
  display: flex;
}

div#main-screen > div#map {
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  border: none;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
