import {
  COPY_IDENTITY,
  Extension,
  ExtensionProperty,
  GraphChild,
  PropertyType,
  Format
} from "@gltf-transform/core";
import fetch from "isomorphic-unfetch";

const MOZ_HUBS_COMPONENTS = "MOZ_hubs_components";

export function transformHubsComponentsToOMI(options = {}) {
  const componentMappings = options.componentMappings || {};

  return async (doc) => {
    const root = doc.getRoot();
    const extensionsUsed = root.listExtensionsUsed();

    if (
      !extensionsUsed.some(
        (extension) => extension.extensionName === MOZ_HUBS_COMPONENTS
      )
    ) {
      return;
    }

    const componentExtensions = new Map();

    const nodes = root.listNodes();

    for (const node of nodes) {
      const hubsComponents = node.getExtension(MOZ_HUBS_COMPONENTS);

      if (!hubsComponents) {
        continue;
      }

      for (const component of hubsComponents.getComponents()) {
        if (!componentMappings[component.componentName]) {
          continue;
        }

        let extension = componentExtensions.get(component.componentName);

        if (!extension) {
          extension = doc.createExtension(
            componentMappings[component.componentName]
          );
          componentExtensions.set(component.componentName, extension);
        }

        await extension.fromHubsComponent(doc, node, hubsComponents, component);
      }
    }
  };
}

export class HubsComponentsExtension extends Extension {
  static EXTENSION_NAME = MOZ_HUBS_COMPONENTS;

  extensionName = MOZ_HUBS_COMPONENTS;

  readDependencies = ["hubs-components"];

  writeDependencies = ["hubs-components"];

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
    return new HubsComponents(this.doc.getGraph(), this);
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

      const component = new componentClass().read(
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

    const root = this.doc.getRoot();

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

  propertyType = "HubsComponents";
  parentTypes = [PropertyType.SCENE, PropertyType.NODE, PropertyType.MATERIAL];
  extensionName = MOZ_HUBS_COMPONENTS;

  _components = new Map();

  addComponent(name, component) {
    this._components.set(name, component);
    return this;
  }

  getComponent(name) {
    return this._components.get(name);
  }

  hasComponent(name) {
    return this._components.has(name);
  }

  removeComponent(name) {
    return this._components.delete(name);
  }

  getComponents() {
    return this._components.values();
  }

  copy(other, resolve = COPY_IDENTITY) {
    super.copy(other, resolve);

    this._components.clear();

    for (const [name, component] of other._components) {
      this.addComponent(name, component.clone());
    }

    return this;
  }
}

export class HubsComponent {
  static componentName = "";

  componentName = "";

  read(context) {}

  write(context) {}

  clone() {}
}

// TODO: Maybe we can generate all the Hubs components from a schema?
export class HubsAudioComponent extends HubsComponent {
  static componentName = "audio";

  componentName = "audio";

  read(context, componentDef) {
    this.src = componentDef.src;
    this.autoPlay = componentDef.autoPlay || false;
    this.controls = componentDef.controls || false;
    this.loop = componentDef.loop || false;
    this.audioType = componentDef.audioType ? componentDef.audioType : "stereo";
    this.volume = componentDef.volume === undefined ? 1 : componentDef.volume;
    this.distanceModel = componentDef.distanceModel || "inverse";
    this.rolloffFactor =
      componentDef.rolloffFactor === undefined ? 1 : componentDef.rolloffFactor;
    this.refDistance =
      componentDef.refDistance === undefined ? 1 : componentDef.refDistance;
    this.maxDistance =
      componentDef.maxDistance === undefined ? 10000 : componentDef.maxDistance;
    this.coneInnerAngle =
      componentDef.coneInnerAngle === undefined
        ? 360
        : componentDef.coneInnerAngle;
    this.coneOuterAngle =
      componentDef.coneOuterAngle === undefined
        ? 360
        : componentDef.coneOuterAngle;
    this.coneOuterGain =
      componentDef.coneOuterGain === undefined ? 0 : componentDef.coneOuterGain;
    return this;
  }

  write(context) {
    return {
      src: this.src,
      autoPlay: this.autoPlay,
      controls: this.controls,
      loop: this.loop,
      audioType: this.audioType,
      volume: this.volume,
      distanceModel: this.distanceModel,
      rolloffFactor: this.rolloffFactor,
      refDistance: this.refDistance,
      maxDistance: this.maxDistance,
      coneInnerAngle: this.coneInnerAngle,
      coneOuterAngle: this.coneOuterAngle,
      coneOuterGain: this.coneOuterGain,
    };
  }

  clone() {
    return new HubsAudioComponent().copy(this);
  }

  copy(other) {
    this.src = other.src;
    this.autoPlay = other.autoPlay;
    this.controls = other.controls;
    this.loop = other.loop;
    this.audioType = other.audioType;
    this.volume = other.volume;
    this.distanceModel = other.distanceModel;
    this.rolloffFactor = other.rolloffFactor;
    this.refDistance = other.refDistance;
    this.maxDistance = other.maxDistance;
    this.coneInnerAngle = other.coneInnerAngle;
    this.coneOuterAngle = other.coneOuterAngle;
    this.coneOuterGain = other.coneOuterGain;
    return this;
  }
}

const OMI_AUDIO_EMITTER = "OMI_audio_emitter";

export class OMIAudioEmitterExtension extends Extension {
  static EXTENSION_NAME = OMI_AUDIO_EMITTER;

  extensionName = OMI_AUDIO_EMITTER;

  async fromHubsComponent(doc, property, hubsComponents, component) {
    const audioEmitter = this.createAudioEmitter();

    audioEmitter._type = component.audioType;
    audioEmitter._volume = component.volume;
    audioEmitter._loop = component.loop;
    audioEmitter._autoPlay = component.autoPlay;
    audioEmitter._muted = component.muted;
    audioEmitter._coneInnerAngle = component.coneInnerAngle;
    audioEmitter._coneOuterAngle = component.coneOuterAngle;
    audioEmitter._coneOuterGain = component.coneOuterGain;
    audioEmitter._distanceModel = component.distanceModel;
    audioEmitter._maxDistance = component.maxDistance;
    audioEmitter._refDistance = component.refDistance;
    audioEmitter._rolloffFactor = component.rolloffFactor;

    const clip = this.createAudioClip();

    const res = await fetch(component.src);
    const data = await res.arrayBuffer();
    clip.setData(data);

    audioEmitter.setClip(clip);

    property.setExtension(OMI_AUDIO_EMITTER, audioEmitter);
    hubsComponents.removeComponent(component.componentName);
  }

  createAudioEmitter() {
    return new OMIAudioEmitter(this.doc.getGraph(), this);
  }

  createAudioClip() {
    return new OMIAudioClip(this.doc.getGraph(), this);
  }

  // TODO: Read OMI_audio_emitter
  read() {}

  write(context) {
    if (this.properties.size === 0) {
      return this;
    }

    const { json } = context.jsonDoc;

    const audioClips = Array.from(this.properties).filter(
      (property) => property.propertyType === "OMIAudioClip"
    );
    const audioClipDefs = [];
    const audioClipIndexMap = new Map();

    let audioClipIndex = 0;

    for (const audioClip of audioClips) {
      const audioSource = {
        mimeType: "audio/mpeg",
      };

      if (context.options.format === Format.GLB) {
        const buffer = this.doc.getRoot().listBuffers()[0];

        if (!context.otherBufferViews.has(buffer)) {
          context.otherBufferViews.set(buffer, []);
        }

        context.otherBufferViews.get(buffer).push(audioClip._data);

        audioSource.bufferView = json.bufferViews.length;
        json.bufferViews.push({
          buffer: 0,
          byteOffset: -1, // determined while iterating buffers, in Writer.ts.
          byteLength: audioClip._data.byteLength,
        });
      } else {
        const uri = `${context.options.basename}_audio${audioClipIndex++}.mp3`;
        context.jsonDoc.resources[uri] = audioClip._data;
        audioSource.uri = uri;
      }

      const audioClipDef = {
        sources: [audioSource],
      };
      audioClipDefs.push(audioClipDef);
      audioClipIndexMap.set(audioClip, audioClipDefs.length - 1);
    }

    const audioEmitters = Array.from(this.properties).filter(
      (property) => property.propertyType === "OMIAudioEmitter"
    );
    const audioEmitterDefs = [];
    const audioEmitterIndexMap = new Map();

    for (const audioEmitter of audioEmitters) {
      const clip = audioClips.findIndex(
        (clip) => audioEmitter.clip.getChild() === clip
      );

      if (clip === -1) {
        throw new Error("Error getting clip index");
      }

      const audioEmitterDef = {
        type: audioEmitter._type,
        volume: audioEmitter._volume,
        loop: audioEmitter._loop,
        autoPlay: audioEmitter._autoPlay,
        muted: audioEmitter._muted,
        coneInnerAngle: audioEmitter._coneInnerAngle,
        coneOuterAngle: audioEmitter._coneOuterAngle,
        coneOuterGain: audioEmitter._coneOuterGain,
        distanceModel: audioEmitter._distanceModel,
        maxDistance: audioEmitter._maxDistance,
        refDistance: audioEmitter._refDistance,
        rolloffFactor: audioEmitter._rolloffFactor,
        clip,
      };
      audioEmitterDefs.push(audioEmitterDef);
      audioEmitterIndexMap.set(audioEmitter, audioEmitterDefs.length - 1);
    }

    const root = this.doc.getRoot();

    root.listNodes().forEach((node) => {
      const nodeIndex = context.nodeIndexMap.get(node);
      const nodeDef = json.nodes[nodeIndex];

      const audioEmitter = node.getExtension(OMI_AUDIO_EMITTER);

      if (!audioEmitter) {
        return;
      }

      nodeDef.extensions = nodeDef.extensions || {};

      nodeDef.extensions[OMI_AUDIO_EMITTER] = {
        audioEmitter: audioEmitterIndexMap.get(audioEmitter),
      };
    });

    json.extensions = json.extensions || {};

    json.extensions[OMI_AUDIO_EMITTER] = {
      audioClips: audioClipDefs,
      audioEmitters: audioEmitterDefs,
    };

    return this;
  }
}

export class OMIAudioEmitter extends ExtensionProperty {
  static EXTENSION_NAME = OMI_AUDIO_EMITTER;

  propertyType = "OMIAudioEmitter";
  parentTypes = [PropertyType.SCENE, PropertyType.NODE];
  extensionName = OMI_AUDIO_EMITTER;

  _type = "positional";
  _volume = 1;
  _loop = false;
  _autoPlay = false;
  _muted = false;
  _coneInnerAngle = 360;
  _coneOuterAngle = 360;
  _coneOuterGain = 0;
  _distanceModel = "inverse";
  _maxDistance = 10000;
  _refDistance = 1;
  _rolloffFactor = 1;

  constructor(graph, extension) {
    super(graph, extension);
    this.clip = GraphChild(this, "clip");
  }

  setClip(clip) {
    this.clip = this.graph.link("clip", this, clip);
    return this;
  }

  copy(other, resolve = COPY_IDENTITY) {
    super.copy(other, resolve);

    this._type = other._type;
    this._volume = other._volume;
    this._loop = other._loop;
    this._autoPlay = other._autoPlay;
    this._muted = other._muted;
    this._coneInnerAngle = other._coneInnerAngle;
    this._coneOuterAngle = other._coneOuterAngle;
    this._coneOuterGain = other._coneOuterGain;
    this._distanceModel = other._distanceModel;
    this._maxDistance = other._maxDistance;
    this._refDistance = other._refDistance;
    this._rolloffFactor = other._rolloffFactor;

    this.setClip(other.clip ? resolve(other.clip.getChild()) : null);

    return this;
  }
}

export class OMIAudioClip extends ExtensionProperty {
  static EXTENSION_NAME = OMI_AUDIO_EMITTER;
  propertyType = "OMIAudioClip";
  // TODO: Should we also be able to place these on the root?
  parentTypes = ["OMIAudioEmitter"];
  extensionName = OMI_AUDIO_EMITTER;

  setData(data) {
    this._data = data;
    return this;
  }

  copy(other, resolve = COPY_IDENTITY) {
    super.copy(other, resolve);

    // TODO: clone array buffer?
    this._data = other._data;

    return this;
  }
}
