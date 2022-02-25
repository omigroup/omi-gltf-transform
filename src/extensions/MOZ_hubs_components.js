import {
  Extension,
  ExtensionProperty,
  PropertyType,
} from "@gltf-transform/core";

export const MOZ_HUBS_COMPONENTS = "MOZ_hubs_components";

export class HubsComponentsExtension extends Extension {
  static EXTENSION_NAME = MOZ_HUBS_COMPONENTS;

  extensionName = MOZ_HUBS_COMPONENTS;

  readDependencies = ["hubs-components"];

  writeDependencies = ["hubs-components"];

  prereadTypes = [PropertyType.NODE];

  _registeredHubsComponents = new Map();

  install(key, dependency) {
    if (key === "hubs-components") {
      for (const componentClass of dependency) {
        this._registeredHubsComponents.set(
          componentClass.componentName,
          componentClass
        );
      }
    }

    return this;
  }

  createHubsComponents() {
    return new HubsComponents(this.document.getGraph());
  }

  _migrateAudioToAudioParams(hubsComponents, audio) {
    if (audio.audioType !== undefined) {
      hubsComponents["audio-params"] = {
        audioType: audio.audioType,
        gain: audio.volume,
        distanceModel: audio.distanceModel,
        rolloffFactor: audio.rolloffFactor,
        refDistance: audio.refDistance,
        maxDistance: audio.maxDistance,
        coneInnerAngle: audio.coneInnerAngle,
        coneOuterAngle: audio.coneOuterAngle,
        coneOuterGain: audio.coneOuterGain,
      };
  
      hubsComponents["audio"] = {
        src: audio.src,
        controls: audio.controls,
        autoPlay: audio.autoPlay,
        loop: audio.loop,
      };
    } else {
      hubsComponents["audio-params"] = {};
    }
  }

  _beforeNodes(context) {
    const { json } = context.jsonDoc;

    for (const nodeDef of json.nodes) {
      const extensions = nodeDef.extensions;

      if (!extensions) {
        continue;
      }

      const hubsComponents = extensions[MOZ_HUBS_COMPONENTS];

      if (!hubsComponents) {
        continue;
      }

      const audio = hubsComponents["audio"];
      const audioParams = hubsComponents["audio-params"];

      if (audio && !audioParams) {
        this._migrateAudioToAudioParams(hubsComponents, audio)
      }
    }
  }

  preread(context, propertyType) {
    if (propertyType === PropertyType.NODE) {
      this._beforeNodes(context);
    }

    return this;
  }

  _readProperty(context, propertyDef, object) {
    const extension = propertyDef.extensions?.[MOZ_HUBS_COMPONENTS];

    if (!extension) {
      return;
    }

    let hubsComponents;

    for (const componentName in extension) {
      const componentClass = this._registeredHubsComponents.get(componentName);

      if (!componentClass) {
        continue;
      }

      if (!hubsComponents) {
        hubsComponents = this.createHubsComponents();
      }

      const component = new componentClass(this.document.getGraph()).read(
        context,
        extension[componentName]
      );

      hubsComponents.addComponent(componentName, component);
    }

    if (hubsComponents) {
      object.setExtension(MOZ_HUBS_COMPONENTS, hubsComponents);
    }
  }

  read(context) {
    const { json } = context.jsonDoc;

    if (json.scenes) {
      json.scenes.forEach((sceneDef, sceneIndex) => {
        this._readProperty(context, sceneDef, context.scenes[sceneIndex]);
      });
    }

    if (json.nodes) {
      json.nodes.forEach((nodeDef, nodeIndex) => {
        this._readProperty(context, nodeDef, context.nodes[nodeIndex]);
      });
    }

    if (json.materials) {
      json.materials.forEach((materialDef, materialIndex) => {
        this._readProperty(
          context,
          materialDef,
          context.materials[materialIndex]
        );
      });
    }

    return this;
  }

  _writeProperty(context, propertyDef, object) {
    const extension = object.getExtension(MOZ_HUBS_COMPONENTS);

    if (!extension) {
      return;
    }

    const hubsComponents = extension.getComponents();

    if (hubsComponents.length === 0) {
      return;
    }

    propertyDef.extensions = propertyDef.extensions || {};

    const extensionDef = {};

    for (const hubsComponent of hubsComponents) {
      extensionDef[hubsComponent.componentName] = hubsComponent.write(context);
    }

    propertyDef.extensions[MOZ_HUBS_COMPONENTS] = extensionDef;
  }

  write(context) {
    const { json } = context.jsonDoc;

    const root = this.document.getRoot();

    // root.listScenes().forEach((scene) => {
    //   const sceneIndex = context.sceneIndexMap.get(scene);
    //   const sceneDef = json.scenes[sceneIndex];
    //   this._writeProperty(context, sceneDef, scene);
    // });

    root.listNodes().forEach((node) => {
      const nodeIndex = context.nodeIndexMap.get(node);
      const nodeDef = json.nodes[nodeIndex];
      this._writeProperty(context, nodeDef, node);
    });

    root.listMaterials().forEach((material) => {
      const materialIndex = context.materialIndexMap.get(material);
      const materialDef = json.materials[materialIndex];
      this._writeProperty(context, materialDef, material);
    });

    return this;
  }
}

export class HubsComponents extends ExtensionProperty {
  static EXTENSION_NAME = MOZ_HUBS_COMPONENTS;

  init() {
    this.extensionName = MOZ_HUBS_COMPONENTS;
    this.propertyType = "HubsComponents";
    this.parentTypes = [PropertyType.SCENE, PropertyType.NODE, PropertyType.MATERIAL];
  }

  getDefaults() {
    return Object.assign(super.getDefaults(), {components: {}});
  }

  addComponent(name, component) {
    return this.setRefMap("components", name, component);
  }

  getComponent(name) {
    return this.getRefMap("components", name);
  }

  hasComponent(name) {
    return !!this.getRefMap("components", name);
  }

  removeComponent(name) {
    return this.setRefMap("components", name, null);
  }

  getComponents() {
    return this.listRefMapValues("components");
  }
}
