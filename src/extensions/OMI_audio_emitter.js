import {
  Extension,
  ExtensionProperty,
  PropertyType,
  Format
} from "@gltf-transform/core";

export const OMI_AUDIO_EMITTER = "OMI_audio_emitter";

export class OMIAudioEmitterExtension extends Extension {
  static EXTENSION_NAME = OMI_AUDIO_EMITTER;

  extensionName = OMIAudioEmitterExtension.EXTENSION_NAME;

  prewriteTypes = [PropertyType.BUFFER];

  createSceneAudioEmitters() {
    return new OMISceneAudioEmitters(this.document.getGraph());
  }

  createAudioEmitter() {
    return new OMIAudioEmitter(this.document.getGraph());
  }

  createAudioSource() {
    return new OMIAudioSource(this.document.getGraph());
  }

  // TODO: Read OMI_audio_emitter
  read() {}

  prewrite(context, propertyType) {
    if (
      propertyType !== PropertyType.BUFFER ||
      this.properties.size === 0 ||
      context.options.format !== Format.GLB
    ) {
      return this;
    }

    const audioSources = Array.from(this.properties).filter(
      (property) => property.propertyType === "OMIAudioSource"
    );

    for (const audioSource of audioSources) {
      const buffer = this.document.getRoot().listBuffers()[0];

      if (!context.otherBufferViews.has(buffer)) {
        context.otherBufferViews.set(buffer, []);
      }

      context.otherBufferViews.get(buffer).push(audioSource.getData());
    }

    return this;
  }

  write(context) {
    if (this.properties.size === 0) {
      return this;
    }

    const { json } = context.jsonDoc;

    const audioSources = Array.from(this.properties).filter(
      (property) => property.propertyType === "OMIAudioSource"
    );
    const audioSourceDefs = [];
    const audioSourceIndexMap = new Map();

    let audioSourceIndex = 0;

    for (const audioSource of audioSources) {
      const audioSourceDef = {};

      if (context.options.format === Format.GLB) {
        audioSourceDef.bufferView = context.otherBufferViewsIndexMap.get(audioSource.getData());
        audioSourceDef.mimeType = "audio/mpeg";
      } else {
        const uri = `${context.options.basename}_audio${audioSourceIndex++}.mp3`;
        context.jsonDoc.resources[uri] = audioSource.getData();
        audioSourceDef.uri = uri;
      }

      audioSourceDefs.push(audioSourceDef);
      audioSourceIndexMap.set(audioSource, audioSourceDefs.length - 1);
    }

    const audioEmitters = Array.from(this.properties).filter(
      (property) => property.propertyType === "OMIAudioEmitter"
    );
    const audioEmitterDefs = [];
    const audioEmitterIndexMap = new Map();

    for (const audioEmitter of audioEmitters) {
      const sourceIndex = audioSources.indexOf(audioEmitter.getSource());

      if (sourceIndex === -1) {
        throw new Error("Error getting audio source index");
      }

      const audioEmitterDef = {
        type: audioEmitter.get("type"),
        gain: audioEmitter.get("gain"),
        loop: audioEmitter.get("loop"),
        playing: audioEmitter.get("playing"),
        source: sourceIndex,
      };

      if (audioEmitter.get("type") === "positional") {
        audioEmitterDef.coneInnerAngle = audioEmitter.get("coneInnerAngle");
        audioEmitterDef.coneOuterAngle = audioEmitter.get("coneOuterAngle");
        audioEmitterDef.coneOuterGain = audioEmitter.get("coneOuterGain");
        audioEmitterDef.distanceModel = audioEmitter.get("distanceModel");
        audioEmitterDef.maxDistance = audioEmitter.get("maxDistance");
        audioEmitterDef.refDistance = audioEmitter.get("refDistance");
        audioEmitterDef.rolloffFactor = audioEmitter.get("rolloffFactor");
      }

      audioEmitterDefs.push(audioEmitterDef);
      audioEmitterIndexMap.set(audioEmitter, audioEmitterDefs.length - 1);
    }

    const root = this.document.getRoot();

    // TODO: Support multiple scenes
    const scene = root.getDefaultScene();
    const sceneDef = json.scenes[json.scene];

    const sceneAudioEmitters = scene.getExtension(OMI_AUDIO_EMITTER);

    if (sceneAudioEmitters) {
      sceneDef.extensions = sceneDef.extensions || {};

      sceneDef.extensions[OMI_AUDIO_EMITTER] = {
        audioEmitters: sceneAudioEmitters.listAudioEmitters().map(
          (audioEmitter) => audioEmitterIndexMap.get(audioEmitter)
        ),
      };
    }

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
      audioSources: audioSourceDefs,
      audioEmitters: audioEmitterDefs,
    };

    return this;
  }
}

export class OMISceneAudioEmitters extends ExtensionProperty {
  static EXTENSION_NAME = OMI_AUDIO_EMITTER;

  init() {
    this.extensionName = OMI_AUDIO_EMITTER;
    this.propertyType = "OMISceneAudioEmitters";
    this.parentTypes = [PropertyType.SCENE];
  }

  getDefaults() {
    return Object.assign(super.getDefaults(), {audioEmitters: []});
  }

  addAudioEmitter(audioEmitter) {
    this.addRef('audioEmitters', audioEmitter);
  }

  removeAudioEmitter(audioEmitter) {
    this.removeRef('audioEmitters', audioEmitter);
  }

  listAudioEmitters() {
    return this.listRefs('audioEmitters');
  }
}

export class OMIAudioEmitter extends ExtensionProperty {
  static EXTENSION_NAME = OMI_AUDIO_EMITTER;

  init() {
    this.extensionName = OMI_AUDIO_EMITTER;
    this.propertyType = "OMIAudioEmitter";
    this.parentTypes = ["OMISceneAudioEmitters", PropertyType.NODE];
  }

  getDefaults() {
    return Object.assign(super.getDefaults(), {
      source: null,
      type: "positional",
      gain: 1,
      loop: false,
      playing: false,
      coneInnerAngle: Math.PI * 2,
      coneOuterAngle: Math.PI * 2,
      coneOuterGain: 0,
      distanceModel: "inverse",
      maxDistance: 10000,
      refDistance: 1,
      rolloffFactor: 1,
    });
  }

  getSource() {
    return this.getRef('source');
  }

  setSource(source) {
    return this.setRef('source', source);
  }
}

export class OMIAudioSource extends ExtensionProperty {
  static EXTENSION_NAME = OMI_AUDIO_EMITTER;

  init() {
    this.extensionName = OMI_AUDIO_EMITTER;
    this.propertyType = "OMIAudioSource";
    // TODO: Should we also be able to place these on the root?
    this.parentTypes = ["OMIAudioEmitter"];
  }

  getDefaults() {
    return Object.assign(super.getDefaults(), {data: null});
  }

  getData() {
    return this.get('data');
  }

  setData(data) {
    this.set('data', data);
  }
}
